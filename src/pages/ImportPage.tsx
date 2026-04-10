import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  Loader2, Download, Pencil, Trash2, X, Save, ShieldAlert, Sparkles, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reloadDynamicEntries } from '@/data/searchData';

/* ─── Types ─── */
interface ParsedRow {
  _id: number;
  providerName: string;
  segment: string;
  serviceName: string;
  servicePrice: string;
  serviceUnit: string;
  productName: string;
  productPrice: string;
  productUnit: string;
  productStockType: string;
  phone: string;
  email: string;
  city: string;
  cpfCnpj: string;
  // Cascade match result
  _matchType?: 'email' | 'name' | 'cpf' | 'new';
  _matchedProviderId?: number;
  _matchedProviderName?: string;
  // AI enrichment tracking
  _aiFields?: Set<string>;
}

interface RowError {
  rowId: number;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'ai';
}

interface AutoFix {
  icon: 'segment' | 'provider' | 'price' | 'contact' | 'tags' | 'document' | 'logo' | 'ai' | 'merge';
  message: string;
}

interface ImportResult {
  providersCreated: number;
  providersLinked: number;
  servicesCreated: number;
  productsCreated: number;
  segmentsCreated: number;
  errors: { line: number; message: string }[];
  fixes: AutoFix[];
}

interface ExistingProvider {
  id: number;
  name: string;
  segment: string[];
  phone: string | null;
  email: string | null;
  cpf_cnpj: string | null;
}

const STOCK_TYPES = ['fisico', 'drop'];

const FIELD_LABELS: Record<string, string> = {
  providerName: 'Prestador',
  cpfCnpj: 'CPF/CNPJ',
  segment: 'Segmento',
  serviceName: 'Serviço',
  servicePrice: 'Preço Serviço',
  serviceUnit: 'Un. Serviço',
  productName: 'Produto',
  productPrice: 'Preço Produto',
  productUnit: 'Un. Produto',
  productStockType: 'Tipo Estoque',
  phone: 'Telefone',
  email: 'E-mail',
  city: 'Cidade',
};

const COLUMNS: (keyof Omit<ParsedRow, '_id' | '_matchType' | '_matchedProviderId' | '_matchedProviderName' | '_aiFields'>)[] = [
  'providerName', 'cpfCnpj', 'segment', 'serviceName', 'servicePrice', 'serviceUnit',
  'productName', 'productPrice', 'productUnit', 'productStockType',
  'phone', 'email', 'city',
];

/* ─── Template generator ─── */
const generateTemplate = async () => {
  const XLSX = await import('xlsx');
  const { data: unitsData } = await supabase.from('units').select('name, label').order('name');
  const unitsList = (unitsData || []).map((u: any) => u.name).join(', ');

  const headers = ['Prestador', 'CPF/CNPJ', 'Segmento', 'Serviço', 'Preço Serviço', 'Un. Serviço', 'Produto', 'Preço Produto', 'Un. Produto', 'Tipo Estoque', 'Telefone', 'E-mail', 'Cidade'];
  const example = ['João Silva', '123.456.789-09', 'Manutenção', 'Instalação Elétrica', '150', 'hr', 'Tomada 3 pinos', '12.50', 'un', 'fisico', '(11) 99999-0000', 'joao@email.com', 'São Paulo'];
  const noteRow = ['', '', '', '', '', `Unidades: ${unitsList}`, '', '', `Unidades: ${unitsList}`, 'fisico ou drop', '', '', ''];
  const ws = XLSX.utils.aoa_to_sheet([headers, example, noteRow]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Importação');

  if (unitsData && unitsData.length > 0) {
    const unitsHeaders = ['Sigla', 'Descrição'];
    const unitsRows = unitsData.map((u: any) => [u.name, u.label]);
    const wsUnits = XLSX.utils.aoa_to_sheet([unitsHeaders, ...unitsRows]);
    wsUnits['!cols'] = [{ wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsUnits, 'Unidades de Medida');
  }

  XLSX.writeFile(wb, 'modelo_importacao.xlsx');
  toast.success('Modelo baixado!');
};

/* ─── Cascade matching logic ─── */
const cascadeMatch = (
  row: ParsedRow,
  providers: ExistingProvider[],
): { type: 'email' | 'name' | 'cpf' | 'new'; provider?: ExistingProvider } => {
  const email = row.email.trim().toLowerCase();
  const fullName = row.providerName.trim().toLowerCase();
  const cpf = row.cpfCnpj.trim().replace(/\D/g, '');

  // 1. Email match
  if (email) {
    const match = providers.find(p => p.email?.trim().toLowerCase() === email);
    if (match) return { type: 'email', provider: match };
  }

  // 2. Name match (full name comparison)
  if (fullName) {
    const match = providers.find(p => p.name.trim().toLowerCase() === fullName);
    if (match) return { type: 'name', provider: match };
  }

  // 3. CPF/CNPJ match
  if (cpf && cpf !== 'isento') {
    const match = providers.find(p => {
      const pCpf = p.cpf_cnpj?.replace(/\D/g, '');
      return pCpf && pCpf === cpf;
    });
    if (match) return { type: 'cpf', provider: match };
  }

  return { type: 'new' };
};

/* ─── Validation ─── */
const validateFormat = (rows: ParsedRow[]): RowError[] => {
  const errors: RowError[] = [];
  rows.forEach(row => {
    if (!row.providerName.trim()) {
      errors.push({ rowId: row._id, field: 'providerName', message: 'Prestador é obrigatório', severity: 'error' });
    }
    if (!row.segment.trim()) {
      errors.push({ rowId: row._id, field: 'segment', message: 'Segmento é obrigatório', severity: 'error' });
    }
    if (!row.serviceName.trim() && !row.productName.trim()) {
      errors.push({ rowId: row._id, field: 'serviceName', message: 'Informe ao menos um Serviço ou Produto', severity: 'error' });
    }
    if (row.serviceName.trim() && row.servicePrice.trim()) {
      const p = parseFloat(row.servicePrice);
      if (isNaN(p) || p < 0) errors.push({ rowId: row._id, field: 'servicePrice', message: 'Preço inválido', severity: 'error' });
    }
    if (row.productName.trim() && row.productPrice.trim()) {
      const p = parseFloat(row.productPrice);
      if (isNaN(p) || p < 0) errors.push({ rowId: row._id, field: 'productPrice', message: 'Preço inválido', severity: 'error' });
    }
    if (row.productStockType.trim() && !STOCK_TYPES.includes(row.productStockType.toLowerCase())) {
      errors.push({ rowId: row._id, field: 'productStockType', message: 'Use "fisico" ou "drop"', severity: 'error' });
    }
    if (row.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ rowId: row._id, field: 'email', message: 'E-mail inválido', severity: 'error' });
    }
  });
  return errors;
};

const validateBusinessRules = (
  rows: ParsedRow[],
  existingSegments: Set<string>,
): RowError[] => {
  const errors: RowError[] = [];
  rows.forEach(row => {
    if (row.segment.trim() && !existingSegments.has(row.segment.trim())) {
      errors.push({ rowId: row._id, field: 'segment', message: `Segmento "${row.segment}" será criado automaticamente`, severity: 'warning' });
    }
    if (row.providerName.trim() && !row.phone.trim() && !row.email.trim() && row._matchType === 'new') {
      errors.push({ rowId: row._id, field: 'phone', message: 'Prestador novo sem contato', severity: 'warning' });
    }
    if (row.providerName.trim() && !row.cpfCnpj.trim() && row._matchType === 'new') {
      errors.push({ rowId: row._id, field: 'cpfCnpj', message: 'Sem CPF/CNPJ — será ISENTO', severity: 'warning' });
    }
    if (row.serviceName.trim()) {
      const p = parseFloat(row.servicePrice);
      if (!row.servicePrice.trim() || p === 0) {
        errors.push({ rowId: row._id, field: 'servicePrice', message: 'Preço zerado', severity: 'warning' });
      }
    }
    if (row.productName.trim()) {
      const p = parseFloat(row.productPrice);
      if (!row.productPrice.trim() || p === 0) {
        errors.push({ rowId: row._id, field: 'productPrice', message: 'Preço zerado', severity: 'warning' });
      }
    }
    // AI-enriched fields
    if (row._aiFields) {
      for (const field of row._aiFields) {
        errors.push({ rowId: row._id, field, message: 'Dado gerado por IA — revise', severity: 'ai' });
      }
    }
  });
  return errors;
};

/* ─── Component ─── */
const ImportPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [importing, setImporting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowId: number; field: string } | null>(null);
  const [existingSegments, setExistingSegments] = useState<Set<string>>(new Set());
  const [existingProviders, setExistingProviders] = useState<ExistingProvider[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [importedFileHashes, setImportedFileHashes] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState<{ step: string; percent: number } | null>(null);
  // Provider dedup confirmation
  const [dedupPending, setDedupPending] = useState<{
    rowId: number;
    providerName: string;
    matches: ExistingProvider[];
    resolved: boolean;
  }[]>([]);
  const [showDedupModal, setShowDedupModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [segRes, provRes] = await Promise.all([
        supabase.from('segments').select('name'),
        supabase.from('providers').select('id, name, segment, phone, email, cpf_cnpj'),
      ]);
      setExistingSegments(new Set((segRes.data || []).map(s => s.name)));
      setExistingProviders((provRes.data || []) as ExistingProvider[]);
      setDbLoaded(true);
    };
    load();
  }, []);

  /* ─── Full validation ─── */
  const runValidation = useCallback((data: ParsedRow[]) => {
    const formatErrors = validateFormat(data);
    const businessErrors = validateBusinessRules(data, existingSegments);
    const seen = new Set(formatErrors.map(e => `${e.rowId}:${e.field}`));
    return [...formatErrors, ...businessErrors.filter(e => !seen.has(`${e.rowId}:${e.field}`))];
  }, [existingSegments]);

  useEffect(() => {
    if (rows.length > 0 && dbLoaded) {
      setErrors(runValidation(rows));
    }
  }, [dbLoaded, existingSegments]);

  /* ─── Cascade matching after parse ─── */
  const applyCascadeMatching = useCallback((parsed: ParsedRow[]): ParsedRow[] => {
    return parsed.map(row => {
      const result = cascadeMatch(row, existingProviders);
      return {
        ...row,
        _matchType: result.type,
        _matchedProviderId: result.provider?.id,
        _matchedProviderName: result.provider?.name,
      };
    });
  }, [existingProviders]);

  /* ─── File hash for duplicate prevention ─── */
  const computeFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  /* ─── Enhanced provider matching with fuzzy search ─── */
  const findProviderMatches = (row: ParsedRow, providers: ExistingProvider[]): ExistingProvider[] => {
    const matches: ExistingProvider[] = [];
    const email = row.email.trim().toLowerCase();
    const name = row.providerName.trim().toLowerCase();
    const phone = row.phone.trim().replace(/\D/g, '');
    const cpf = row.cpfCnpj.trim().replace(/\D/g, '');

    for (const p of providers) {
      if (email && p.email?.trim().toLowerCase() === email) { matches.push(p); continue; }
      if (name && p.name.trim().toLowerCase() === name) { matches.push(p); continue; }
      if (phone && phone.length >= 8 && p.phone?.replace(/\D/g, '')?.includes(phone.slice(-8))) { matches.push(p); continue; }
      if (cpf && cpf !== 'isento' && p.cpf_cnpj?.replace(/\D/g, '') === cpf) { matches.push(p); continue; }
    }
    return matches;
  };

  /* ─── Parse file ─── */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check for duplicate file
    const fileHash = await computeFileHash(file);
    if (importedFileHashes.has(fileHash)) {
      toast.error('Este arquivo já foi importado. Selecione um arquivo diferente.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setResult(null);
    setEditingCell(null);
    setDedupPending([]);

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

      if (json.length === 0) { toast.error('Planilha vazia'); return; }

      const rawHeaders = Object.keys(json[0]);
      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const findCol = (patterns: string[]) => rawHeaders.find(h => patterns.some(p => normalize(h).includes(p)));

      const colMap = {
        provider: findCol(['prestador', 'provider', 'nome do prestador', 'profissional']),
        cpfCnpj: findCol(['cpf', 'cnpj', 'cpf/cnpj', 'cpf_cnpj', 'documento']),
        segment: findCol(['segmento', 'segment', 'categoria', 'area']),
        service: findCol(['servico', 'service', 'serviço']),
        servicePrice: findCol(['preco_servico', 'preço serviço', 'preco servico', 'service_price', 'valor_servico', 'valor servico', 'preço_serviço']),
        serviceUnit: findCol(['un. servico', 'un. serviço', 'unidade servico', 'unidade serviço', 'service_unit']),
        product: findCol(['produto', 'product']),
        productPrice: findCol(['preco_produto', 'preço produto', 'preco produto', 'product_price', 'valor_produto', 'valor produto', 'preço_produto']),
        productUnit: findCol(['un. produto', 'unidade produto', 'product_unit']),
        stock: findCol(['estoque', 'stock', 'tipo_estoque', 'tipo estoque']),
        phone: findCol(['telefone', 'phone', 'cel']),
        email: findCol(['email', 'e-mail']),
        city: findCol(['cidade', 'city']),
      };

      const parsed: ParsedRow[] = json.map((r: any, i: number) => ({
        _id: i + 1,
        providerName: String(r[colMap.provider || ''] ?? '').trim(),
        cpfCnpj: String(r[colMap.cpfCnpj || ''] ?? '').trim(),
        segment: String(r[colMap.segment || ''] ?? '').trim(),
        serviceName: String(r[colMap.service || ''] ?? '').trim(),
        servicePrice: String(r[colMap.servicePrice || ''] ?? '').trim(),
        serviceUnit: String(r[colMap.serviceUnit || ''] ?? '').trim().toLowerCase(),
        productName: String(r[colMap.product || ''] ?? '').trim(),
        productPrice: String(r[colMap.productPrice || ''] ?? '').trim(),
        productUnit: String(r[colMap.productUnit || ''] ?? '').trim().toLowerCase(),
        productStockType: String(r[colMap.stock || ''] ?? '').trim().toLowerCase(),
        phone: String(r[colMap.phone || ''] ?? '').trim(),
        email: String(r[colMap.email || ''] ?? '').trim(),
        city: String(r[colMap.city || ''] ?? '').trim(),
      })).filter((r: ParsedRow) => r.providerName || r.serviceName || r.productName);

      // Apply cascade matching
      const matched = applyCascadeMatching(parsed);

      // Check for provider matches that need user confirmation
      const providerNames = [...new Set(matched.filter(r => r._matchType === 'new').map(r => r.providerName.trim()))];
      const dedupItems: typeof dedupPending = [];

      for (const pName of providerNames) {
        const sampleRow = matched.find(r => r.providerName.trim() === pName)!;
        const fuzzyMatches = findProviderMatches(sampleRow, existingProviders);
        if (fuzzyMatches.length > 0) {
          dedupItems.push({
            rowId: sampleRow._id,
            providerName: pName,
            matches: fuzzyMatches,
            resolved: false,
          });
        }
      }

      setRows(matched);
      setErrors(runValidation(matched));
      setDedupPending(dedupItems);

      if (dedupItems.length > 0) {
        setShowDedupModal(true);
      }

      // Store hash to prevent re-import
      setImportedFileHashes(prev => new Set([...prev, fileHash]));

      const newCount = matched.filter(r => r._matchType === 'new').length;
      const mergeCount = matched.filter(r => r._matchType !== 'new').length;
      toast.success(`${matched.length} linhas carregadas — ${mergeCount} existente(s), ${newCount} novo(s)${dedupItems.length > 0 ? ` — ${dedupItems.length} coincidência(s) para revisão` : ''}`);
    } catch (err: any) {
      toast.error('Erro ao ler planilha: ' + err.message);
    }
  };

  /* ─── AI Enrichment ─── */
  const enrichWithAI = async () => {
    if (rows.length === 0) return;
    setEnriching(true);
    try {
      // Find rows with empty required fields
      const rowsToEnrich = rows.filter(r => {
        const hasEmptyFields = !r.segment.trim() || !r.phone.trim() || !r.email.trim() || !r.city.trim() ||
          (r.serviceName.trim() && !r.servicePrice.trim()) ||
          (r.productName.trim() && !r.productPrice.trim()) ||
          (r.serviceName.trim() && !r.serviceUnit.trim()) ||
          (r.productName.trim() && !r.productUnit.trim()) ||
          (r.productName.trim() && !r.productStockType.trim());
        return hasEmptyFields;
      });

      if (rowsToEnrich.length === 0) {
        toast.info('Todos os campos obrigatórios já estão preenchidos');
        setEnriching(false);
        return;
      }

      // Send to AI in batches of 20
      const batchSize = 20;
      const allEnriched: ParsedRow[] = [...rows];
      const segNames = [...existingSegments];

      for (let i = 0; i < rowsToEnrich.length; i += batchSize) {
        const batch = rowsToEnrich.slice(i, i + batchSize);
        const simplifiedRows = batch.map(r => ({
          _id: r._id,
          providerName: r.providerName,
          segment: r.segment,
          serviceName: r.serviceName,
          servicePrice: r.servicePrice,
          serviceUnit: r.serviceUnit,
          productName: r.productName,
          productPrice: r.productPrice,
          productUnit: r.productUnit,
          productStockType: r.productStockType,
          phone: r.phone,
          email: r.email,
          city: r.city,
          cpfCnpj: r.cpfCnpj,
        }));

        const { data, error } = await supabase.functions.invoke('enrich-import-data', {
          body: { rows: simplifiedRows, existingSegments: segNames },
        });

        if (error) {
          toast.error('Erro ao enriquecer dados: ' + error.message);
          continue;
        }

        if (data?.enriched) {
          for (const enrichedRow of data.enriched) {
            const idx = allEnriched.findIndex(r => r._id === enrichedRow._id);
            if (idx === -1) continue;
            const original = allEnriched[idx];
            const aiFields = new Set<string>();

            // Track which fields were filled by AI
            const fieldsToCheck: (keyof ParsedRow)[] = [
              'segment', 'phone', 'email', 'city', 'servicePrice', 'serviceUnit',
              'productPrice', 'productUnit', 'productStockType',
            ];

            for (const field of fieldsToCheck) {
              const origVal = String(original[field] || '').trim();
              const newVal = String(enrichedRow[field] || '').trim();
              if (!origVal && newVal) {
                (allEnriched[idx] as any)[field] = newVal;
                aiFields.add(field);
              }
            }

            allEnriched[idx] = { ...allEnriched[idx], _aiFields: aiFields };
          }
        }
      }

      setRows(allEnriched);
      setErrors(runValidation(allEnriched));
      const aiCount = allEnriched.filter(r => r._aiFields && r._aiFields.size > 0).length;
      toast.success(`IA enriqueceu ${aiCount} linha(s) — revise os campos em roxo antes de importar`);
    } catch (err: any) {
      toast.error('Erro no enriquecimento IA: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setEnriching(false);
    }
  };

  /* ─── Cell editing ─── */
  const updateCell = useCallback((rowId: number, field: string, value: string) => {
    setRows(prev => {
      const updated = prev.map(r => {
        if (r._id !== rowId) return r;
        const updatedRow = { ...r, [field]: value };
        // Remove AI tag if user edits the field
        if (r._aiFields?.has(field)) {
          const newAiFields = new Set(r._aiFields);
          newAiFields.delete(field);
          updatedRow._aiFields = newAiFields;
        }
        return updatedRow;
      });
      // Re-run cascade matching if key fields change
      if (['email', 'providerName', 'cpfCnpj'].includes(field)) {
        const reMatched = updated.map(row => {
          if (row._id !== rowId) return row;
          const result = cascadeMatch(row, existingProviders);
          return { ...row, _matchType: result.type, _matchedProviderId: result.provider?.id, _matchedProviderName: result.provider?.name };
        });
        setErrors(runValidation(reMatched));
        return reMatched;
      }
      setErrors(runValidation(updated));
      return updated;
    });
  }, [runValidation, existingProviders]);

  const removeRow = useCallback((rowId: number) => {
    setRows(prev => {
      const updated = prev.filter(r => r._id !== rowId);
      setErrors(runValidation(updated));
      return updated;
    });
  }, [runValidation]);

  const getCellError = (rowId: number, field: string) =>
    errors.find(e => e.rowId === rowId && e.field === field);

  const criticalErrors = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning');
  const aiMarkers = errors.filter(e => e.severity === 'ai');
  const hasCriticalErrors = criticalErrors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasAiData = aiMarkers.length > 0;
  const criticalRowIds = new Set(criticalErrors.map(e => e.rowId));

  /* ─── Import (atomic) with progress tracking ─── */
  const executeImport = async () => {
    if (rows.length === 0 || hasCriticalErrors) return;
    // Block if unresolved dedup items
    if (dedupPending.some(d => !d.resolved)) {
      setShowDedupModal(true);
      toast.error('Resolva as coincidências de prestador antes de importar.');
      return;
    }

    setImporting(true);
    setImportProgress({ step: 'Preparando dados...', percent: 5 });
    try {
      const res: ImportResult = {
        providersCreated: 0, providersLinked: 0, servicesCreated: 0,
        productsCreated: 0, segmentsCreated: 0, errors: [], fixes: [],
      };

      // Step 1: Auto-create missing segments
      setImportProgress({ step: 'Criando segmentos...', percent: 10 });
      const { data: dbSegments } = await supabase.from('segments').select('id, name');
      const segMap = new Map<string, number>();
      (dbSegments || []).forEach((s: any) => segMap.set(s.name, s.id));

      const uniqueSegments = new Set(rows.map(r => r.segment.trim()).filter(Boolean));
      for (const segName of uniqueSegments) {
        if (!segMap.has(segName)) {
          const { data: newSeg, error } = await supabase.from('segments').insert({
            name: segName, suggested_tags: [segName.toLowerCase()],
          }).select().single();
          if (error) {
            res.errors.push({ line: 0, message: `Erro ao criar segmento "${segName}": ${error.message}` });
          } else if (newSeg) {
            segMap.set(segName, (newSeg as any).id);
            res.segmentsCreated++;
            res.fixes.push({ icon: 'segment', message: `Segmento "${segName}" criado automaticamente` });
          }
        }
      }

      // Step 2: Get max IDs
      setImportProgress({ step: 'Preparando IDs...', percent: 20 });
      const { data: maxSvc } = await supabase.from('dynamic_services').select('service_id').order('service_id', { ascending: false }).limit(1);
      const { data: maxProd } = await supabase.from('dynamic_products').select('product_id').order('product_id', { ascending: false }).limit(1);
      let nextServiceId = ((maxSvc?.[0]?.service_id) || 2000) + 1;
      let nextProductId = ((maxProd?.[0]?.product_id) || 2000) + 1;

      // Group by provider
      const byProvider = new Map<string, ParsedRow[]>();
      rows.forEach(row => {
        const key = row.providerName.trim();
        if (!key) return;
        if (!byProvider.has(key)) byProvider.set(key, []);
        byProvider.get(key)!.push(row);
      });

      // Reload providers for fresh data
      setImportProgress({ step: 'Carregando prestadores...', percent: 25 });
      const { data: freshProviders } = await supabase.from('providers').select('id, name, segment, phone, email, cpf_cnpj');
      const providerList = (freshProviders || []) as ExistingProvider[];

      const totalProviders = byProvider.size;
      let processedProviders = 0;

      for (const [provName, provRows] of byProvider) {
        processedProviders++;
        const progressPercent = 25 + Math.round((processedProviders / totalProviders) * 50);
        setImportProgress({ step: `Processando: ${provName}...`, percent: progressPercent });

        const firstRow = provRows[0];
        let providerId: number;

        // Use cascade match result
        const matchResult = cascadeMatch(firstRow, providerList);

        if (matchResult.type !== 'new' && matchResult.provider) {
          providerId = matchResult.provider.id;
          res.providersLinked++;
          res.fixes.push({
            icon: 'merge',
            message: `"${provName}" vinculado a "${matchResult.provider.name}" via ${matchResult.type === 'email' ? 'e-mail' : matchResult.type === 'name' ? 'nome' : 'CPF/CNPJ'}`,
          });

          const rowSegments = new Set(provRows.map(r => r.segment.trim()).filter(Boolean));
          const currentSegments = new Set(matchResult.provider.segment || []);
          const newSegments = [...rowSegments].filter(s => !currentSegments.has(s));
          if (newSegments.length > 0) {
            await supabase.from('providers').update({ segment: [...currentSegments, ...newSegments] }).eq('id', providerId);
            res.fixes.push({ icon: 'provider', message: `"${provName}": segmento(s) "${newSegments.join(', ')}" vinculado(s)` });
          }

          const updates: Record<string, string> = {};
          if (!matchResult.provider.phone && firstRow.phone.trim()) updates.phone = firstRow.phone;
          if (!matchResult.provider.email && firstRow.email.trim()) updates.email = firstRow.email;
          if (Object.keys(updates).length > 0) {
            await supabase.from('providers').update(updates).eq('id', providerId);
            res.fixes.push({ icon: 'contact', message: `"${provName}": contato atualizado` });
          }
        } else {
          const allSegments = [...new Set(provRows.map(r => r.segment.trim()).filter(Boolean))];
          const cpfVal = firstRow.cpfCnpj.replace(/\D/g, '').trim() || null;
          const { data: newProv, error } = await supabase.from('providers').insert({
            name: provName,
            segment: allSegments.length > 0 ? allSegments : ['Geral'],
            type: 'mei',
            phone: firstRow.phone || '',
            email: firstRow.email || '',
            city: firstRow.city || '',
            cpf_cnpj: cpfVal || 'ISENTO',
            active: false,
          }).select().single();

          if (error || !newProv) {
            res.errors.push({ line: firstRow._id, message: `Erro ao criar "${provName}": ${error?.message}` });
            continue;
          }
          providerId = (newProv as any).id;
          providerList.push({ id: providerId, name: provName, segment: allSegments, phone: firstRow.phone, email: firstRow.email, cpf_cnpj: cpfVal });
          res.providersCreated++;

          if (!cpfVal) {
            res.fixes.push({ icon: 'document', message: `"${provName}": CPF/CNPJ ausente — marcado como ISENTO` });
          }
          if (!firstRow.phone.trim() && !firstRow.email.trim()) {
            res.fixes.push({ icon: 'contact', message: `"${provName}" criado sem contato — corrija no Admin` });
          }

          // Generate logo
          try {
            const { data: logoData, error: logoErr } = await supabase.functions.invoke('generate-provider-logo', {
              body: { providerName: provName, segment: allSegments[0] || 'Geral' },
            });
            if (!logoErr && logoData?.logoUrl) {
              await supabase.from('providers').update({ logo_url: logoData.logoUrl }).eq('id', providerId);
              res.fixes.push({ icon: 'logo', message: `"${provName}": logo gerado por IA` });
            }
          } catch (e) {
            console.error('Logo generation error:', e);
          }
        }

        // Insert services and products
        for (const row of provRows) {
          if (row.serviceName.trim()) {
            const price = parseFloat(row.servicePrice) || 0;
            const { error } = await supabase.from('dynamic_services').insert({
              service_id: nextServiceId++,
              name: row.serviceName,
              segment: row.segment || 'Geral',
              provider: provName,
              provider_id: providerId,
              price,
              unit: row.serviceUnit || 'hr',
            });
            if (error) {
              res.errors.push({ line: row._id, message: `Serviço "${row.serviceName}": ${error.message}` });
            } else {
              res.servicesCreated++;
            }
          }
          if (row.productName.trim()) {
            const price = parseFloat(row.productPrice) || 0;
            const tags = row.segment ? [row.segment.toLowerCase()] : [];
            const { error } = await supabase.from('dynamic_products').insert({
              product_id: nextProductId++,
              name: row.productName,
              provider: provName,
              provider_id: providerId,
              price,
              stock_type: row.productStockType === 'drop' ? 'drop' : 'fisico',
              tags,
              unit: row.productUnit || 'un',
            });
            if (error) {
              res.errors.push({ line: row._id, message: `Produto "${row.productName}": ${error.message}` });
            } else {
              res.productsCreated++;
            }
          }
        }
      }

      // Step 5: Generate product images in background (fire & forget)
      setImportProgress({ step: 'Gerando imagens de produtos (IA)...', percent: 80 });
      const productsToImage = rows.filter(r => r.productName.trim());
      // Process images async, don't block
      for (const row of productsToImage.slice(0, 10)) {
        supabase.functions.invoke('search-product-image', {
          body: { productName: row.productName, segment: row.segment, itemType: 'product' },
        }).catch(console.error);
      }

      setImportProgress({ step: 'Finalizando...', percent: 90 });
      await reloadDynamicEntries();
      
      setImportProgress({ step: 'Concluído!', percent: 100 });
      setResult(res);

      if (res.errors.length === 0) {
        toast.success('Importação concluída com sucesso!');
      } else {
        toast.warning(`Importação parcial: ${res.errors.length} erro(s) em linhas específicas`);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error('Erro durante importação: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setImporting(false);
      setTimeout(() => setImportProgress(null), 2000);
    }
  };

  const resetAll = () => {
    setRows([]); setErrors([]); setResult(null); setFileName(''); setEditingCell(null);
    setDedupPending([]); setImportProgress(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ─── Dedup resolution ─── */
  const resolveDedupAsExisting = (providerName: string, existingProvider: ExistingProvider) => {
    // Update all rows with this provider name to use the existing provider
    setRows(prev => prev.map(row => {
      if (row.providerName.trim() === providerName) {
        return { ...row, _matchType: 'name' as const, _matchedProviderId: existingProvider.id, _matchedProviderName: existingProvider.name };
      }
      return row;
    }));
    setDedupPending(prev => prev.map(d => d.providerName === providerName ? { ...d, resolved: true } : d));
  };

  const resolveDedupAsNew = (providerName: string) => {
    setDedupPending(prev => prev.map(d => d.providerName === providerName ? { ...d, resolved: true } : d));
  };

  /* ─── Match type badge ─── */
  const matchBadge = (row: ParsedRow) => {
    if (!row._matchType || row._matchType === 'new') {
      return <Badge variant="outline" className="text-[8px] h-4 border-primary/40 text-primary">NOVO</Badge>;
    }
    const labels = { email: 'E-mail', name: 'Nome', cpf: 'CPF' };
    return (
      <Badge variant="secondary" className="text-[8px] h-4 bg-blue-500/15 text-blue-600 dark:text-blue-400">
        MERGE ({labels[row._matchType]})
      </Badge>
    );
  };

  /* ─── Render cell ─── */
  const renderCell = (row: ParsedRow, field: keyof Omit<ParsedRow, '_id' | '_matchType' | '_matchedProviderId' | '_matchedProviderName' | '_aiFields'>) => {
    const isEditing = editingCell?.rowId === row._id && editingCell?.field === field;
    const cellError = getCellError(row._id, field);
    const value = row[field] as string;
    const isAiField = row._aiFields?.has(field);

    if (isEditing) {
      if (field === 'productStockType') {
        return (
          <Select value={value} onValueChange={(v) => { updateCell(row._id, field, v); setEditingCell(null); }}>
            <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fisico">Físico</SelectItem>
              <SelectItem value="drop">Drop</SelectItem>
            </SelectContent>
          </Select>
        );
      }
      return (
        <Input
          autoFocus
          className="h-7 text-xs w-full min-w-[80px]"
          defaultValue={value}
          onBlur={(e) => { updateCell(row._id, field, e.target.value); setEditingCell(null); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { updateCell(row._id, field, (e.target as HTMLInputElement).value); setEditingCell(null); }
            if (e.key === 'Escape') setEditingCell(null);
          }}
        />
      );
    }

    const isWarning = cellError?.severity === 'warning';
    const isError = cellError?.severity === 'error';
    const isAi = cellError?.severity === 'ai' || isAiField;

    return (
      <div
        className={`cursor-pointer px-1 py-0.5 rounded text-xs min-h-[24px] flex items-center gap-1 ${
          isError
            ? 'bg-destructive/15 text-destructive ring-1 ring-destructive/30'
            : isAi
              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 ring-1 ring-purple-500/30'
              : isWarning
                ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30'
                : 'hover:bg-muted/50'
        }`}
        onClick={() => setEditingCell({ rowId: row._id, field })}
        title={cellError?.message || (isAiField ? 'Gerado por IA — clique para editar' : undefined)}
      >
        {value || <span className="text-muted-foreground italic">—</span>}
        {isError && <AlertTriangle className="w-3 h-3 shrink-0" />}
        {isAi && <Sparkles className="w-3 h-3 shrink-0" />}
        {isWarning && !isAi && <ShieldAlert className="w-3 h-3 shrink-0" />}
      </div>
    );
  };

  const hasEmptyFields = rows.some(r =>
    !r.segment.trim() || !r.phone.trim() || !r.email.trim() || !r.city.trim() ||
    (r.serviceName.trim() && !r.servicePrice.trim()) ||
    (r.productName.trim() && !r.productPrice.trim())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center h-14 px-4 gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">Importação Inteligente</span>
          {rows.length > 0 && (
            <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{rows.filter(r => r._matchType === 'new').length} novos</span>
              <span>·</span>
              <span>{rows.filter(r => r._matchType !== 'new').length} merge</span>
              {hasAiData && (
                <>
                  <span>·</span>
                  <span className="text-purple-500">{aiMarkers.length} IA</span>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="pt-20 px-4 container mx-auto max-w-6xl space-y-4">
        {/* Actions row */}
        <div className="flex flex-wrap gap-3">
          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-primary" /> 1. Modelo
              </p>
              <p className="text-[10px] text-muted-foreground">Baixe a planilha modelo.</p>
              <Button variant="outline" size="sm" className="gap-1.5 mt-auto" onClick={generateTemplate}>
                <Download className="w-3 h-3" /> Baixar Modelo
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-primary" /> 2. Upload
              </p>
              <p className="text-[10px] text-muted-foreground">Excel (.xlsx) ou CSV.</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
              <Button variant="outline" size="sm" className="gap-1.5 mt-auto" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3 h-3" /> {fileName || 'Selecionar'}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" /> 3. Enriquecer (IA)
              </p>
              <p className="text-[10px] text-muted-foreground">Preencha campos vazios com IA.</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 mt-auto border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                disabled={rows.length === 0 || enriching || !hasEmptyFields}
                onClick={enrichWithAI}
              >
                {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {enriching ? 'Enriquecendo...' : 'Enriquecer'}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-primary" /> 4. Importar
              </p>
              <p className="text-[10px] text-muted-foreground">Revise e confirme a importação.</p>
              <Button
                size="sm"
                className="gap-1.5 mt-auto"
                disabled={rows.length === 0 || hasCriticalErrors || importing}
                onClick={executeImport}
              >
                {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {importing ? 'Importando...' : 'Confirmar Importação'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        {rows.length > 0 && !result && (
          <div className="flex flex-wrap gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-destructive/20 ring-1 ring-destructive/40" />
              <span className="text-muted-foreground">Erro crítico (bloqueia importação)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-yellow-500/20 ring-1 ring-yellow-500/40" />
              <span className="text-muted-foreground">Aviso / inconsistência</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-purple-500/20 ring-1 ring-purple-500/40" />
              <span className="text-muted-foreground">Gerado por IA — revise</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[8px] h-4 border-primary/40 text-primary">NOVO</Badge>
              <span className="text-muted-foreground">Será criado como Lead</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[8px] h-4 bg-blue-500/15 text-blue-600 dark:text-blue-400">MERGE</Badge>
              <span className="text-muted-foreground">Será vinculado a existente</span>
            </div>
          </div>
        )}

        {/* Error/Warning summaries */}
        <AnimatePresence>
          {rows.length > 0 && hasCriticalErrors && !result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-destructive/40 bg-destructive/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <span className="text-xs font-medium text-destructive">
                      {criticalErrors.length} erro(s) crítico(s) — importação bloqueada. Clique nas células para corrigir.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {rows.length > 0 && (hasWarnings || hasAiData) && !hasCriticalErrors && !result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-yellow-500/40 bg-yellow-500/5">
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      {warnings.length} aviso(s){hasAiData ? ` + ${aiMarkers.length} campo(s) IA` : ''} — revise antes de importar
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {rows.length > 0 && !hasCriticalErrors && !hasWarnings && !hasAiData && !result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-green-500/40 bg-green-500/5">
                <CardContent className="p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    ✓ {rows.length} linhas validadas — pronto para importar
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data table */}
        {rows.length > 0 && !result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  Preview — {rows.length} linhas
                  {criticalErrors.length > 0 && <Badge variant="destructive" className="text-[10px]">{criticalErrors.length} erro(s)</Badge>}
                  {warnings.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                      {warnings.length} aviso(s)
                    </Badge>
                  )}
                  {aiMarkers.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-400">
                      {aiMarkers.length} IA
                    </Badge>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={resetAll}>
                  <X className="w-3 h-3" /> Limpar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[50vh] border rounded-md">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="text-[10px] w-8">#</TableHead>
                        <TableHead className="text-[10px] w-16">Status</TableHead>
                        {COLUMNS.map(col => (
                          <TableHead key={col} className="text-[10px] whitespace-nowrap">{FIELD_LABELS[col]}</TableHead>
                        ))}
                        <TableHead className="text-[10px] w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(row => (
                        <TableRow
                          key={row._id}
                          className={
                            criticalRowIds.has(row._id)
                              ? 'bg-destructive/5'
                              : row._aiFields && row._aiFields.size > 0
                                ? 'bg-purple-500/5'
                                : row._matchType !== 'new'
                                  ? 'bg-blue-500/5'
                                  : ''
                          }
                        >
                          <TableCell className="text-[10px] text-muted-foreground font-mono">{row._id}</TableCell>
                          <TableCell className="py-1 px-1">{matchBadge(row)}</TableCell>
                          {COLUMNS.map(col => (
                            <TableCell key={col} className="py-1 px-1">{renderCell(row, col)}</TableCell>
                          ))}
                          <TableCell className="py-1 px-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(row._id)}>
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Importação Concluída
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { n: result.segmentsCreated, l: 'Segmentos criados' },
                    { n: result.providersCreated, l: 'Leads criados' },
                    { n: result.providersLinked, l: 'Merges realizados' },
                    { n: result.servicesCreated, l: 'Serviços criados' },
                    { n: result.productsCreated, l: 'Produtos criados' },
                  ].map(({ n, l }) => (
                    <div key={l} className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{n}</p>
                      <p className="text-[10px] text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>
                {result.errors.length > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3" /> {result.errors.length} erro(s) por linha
                    </p>
                    {result.errors.slice(0, 10).map((err, i) => (
                      <p key={i} className="text-[10px] text-destructive/80">
                        {err.line > 0 ? `Linha ${err.line}: ` : ''}{err.message}
                      </p>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-[10px] text-destructive/60">...e mais {result.errors.length - 10} erro(s)</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {result.fixes.length > 0 && (
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {result.fixes.length} Correção(ões) Automática(s)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {result.fixes.map((fix, i) => {
                      const iconMap: Record<string, React.ReactNode> = {
                        segment: <Badge variant="secondary" className="text-[9px] h-4 bg-primary/10 text-primary">Segmento</Badge>,
                        provider: <Badge variant="secondary" className="text-[9px] h-4 bg-blue-500/10 text-blue-600 dark:text-blue-400">Prestador</Badge>,
                        contact: <Badge variant="secondary" className="text-[9px] h-4 bg-green-500/10 text-green-600 dark:text-green-400">Contato</Badge>,
                        price: <Badge variant="secondary" className="text-[9px] h-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Preço</Badge>,
                        tags: <Badge variant="secondary" className="text-[9px] h-4 bg-purple-500/10 text-purple-600 dark:text-purple-400">Tags</Badge>,
                        document: <Badge variant="secondary" className="text-[9px] h-4 bg-orange-500/10 text-orange-600 dark:text-orange-400">Documento</Badge>,
                        logo: <Badge variant="secondary" className="text-[9px] h-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">Logo IA</Badge>,
                        ai: <Badge variant="secondary" className="text-[9px] h-4 bg-purple-500/10 text-purple-600 dark:text-purple-400">IA</Badge>,
                        merge: <Badge variant="secondary" className="text-[9px] h-4 bg-blue-500/10 text-blue-600 dark:text-blue-400">Merge</Badge>,
                      };
                      return (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-foreground py-1 border-b border-border/50 last:border-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          {iconMap[fix.icon]}
                          <span>{fix.message}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={resetAll}>
              <Upload className="w-3 h-3" /> Nova Importação
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
