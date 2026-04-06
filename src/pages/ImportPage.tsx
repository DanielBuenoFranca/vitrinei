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
  Loader2, Download, Pencil, Trash2, X, Save, ShieldAlert
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
  productName: string;
  productPrice: string;
  productStockType: string;
  phone: string;
  email: string;
  city: string;
}

interface RowError {
  rowId: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface AutoFix {
  icon: 'segment' | 'provider' | 'price' | 'contact' | 'tags';
  message: string;
}

interface ImportResult {
  providersCreated: number;
  providersLinked: number;
  servicesCreated: number;
  productsCreated: number;
  segmentsCreated: number;
  errors: string[];
  fixes: AutoFix[];
}

const STOCK_TYPES = ['fisico', 'drop'];

const FIELD_LABELS: Record<string, string> = {
  providerName: 'Prestador',
  segment: 'Segmento',
  serviceName: 'Serviço',
  servicePrice: 'Preço Serviço',
  productName: 'Produto',
  productPrice: 'Preço Produto',
  productStockType: 'Tipo Estoque',
  phone: 'Telefone',
  email: 'E-mail',
  city: 'Cidade',
};

const COLUMNS: (keyof Omit<ParsedRow, '_id'>)[] = [
  'providerName', 'segment', 'serviceName', 'servicePrice',
  'productName', 'productPrice', 'productStockType',
  'phone', 'email', 'city',
];

/* ─── Template generator ─── */
const generateTemplate = async () => {
  const XLSX = await import('xlsx');
  const headers = ['Prestador', 'Segmento', 'Serviço', 'Preço Serviço', 'Produto', 'Preço Produto', 'Tipo Estoque', 'Telefone', 'E-mail', 'Cidade'];
  const example = ['João Silva', 'Manutenção', 'Instalação Elétrica', '150', 'Tomada 3 pinos', '12.50', 'fisico', '(11) 99999-0000', 'joao@email.com', 'São Paulo'];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Importação');
  XLSX.writeFile(wb, 'modelo_importacao.xlsx');
  toast.success('Modelo baixado!');
};

/* ─── Basic validation (format) ─── */
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

/* ─── Business rules validation (inconsistency rules) ─── */
const validateBusinessRules = (
  rows: ParsedRow[],
  existingSegments: Set<string>,
  existingProviderNames: Set<string>,
): RowError[] => {
  const errors: RowError[] = [];

  rows.forEach(row => {
    // Segment doesn't exist in database
    if (row.segment.trim() && !existingSegments.has(row.segment.trim())) {
      errors.push({
        rowId: row._id, field: 'segment',
        message: `Segmento "${row.segment}" não existe no cadastro — será ignorado na aba Inconsistências`,
        severity: 'warning',
      });
    }

    // Provider without contact info
    if (row.providerName.trim() && !row.phone.trim() && !row.email.trim()) {
      const firstName = row.providerName.toLowerCase().split(' ')[0];
      if (!existingProviderNames.has(firstName)) {
        errors.push({
          rowId: row._id, field: 'phone',
          message: 'Prestador novo sem telefone e sem e-mail',
          severity: 'warning',
        });
      }
    }

    // Service with zero price
    if (row.serviceName.trim()) {
      const p = parseFloat(row.servicePrice);
      if (!row.servicePrice.trim() || p === 0) {
        errors.push({
          rowId: row._id, field: 'servicePrice',
          message: 'Serviço com preço zerado — gerará inconsistência',
          severity: 'warning',
        });
      }
    }

    // Product with zero price
    if (row.productName.trim()) {
      const p = parseFloat(row.productPrice);
      if (!row.productPrice.trim() || p === 0) {
        errors.push({
          rowId: row._id, field: 'productPrice',
          message: 'Produto com preço zerado — gerará inconsistência',
          severity: 'warning',
        });
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
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowId: number; field: string } | null>(null);
  const [existingSegments, setExistingSegments] = useState<Set<string>>(new Set());
  const [existingProviderNames, setExistingProviderNames] = useState<Set<string>>(new Set());
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load existing segments and providers for business rule validation
  useEffect(() => {
    const load = async () => {
      const [segRes, provRes] = await Promise.all([
        supabase.from('segments').select('name'),
        supabase.from('providers').select('name'),
      ]);
      setExistingSegments(new Set((segRes.data || []).map(s => s.name)));
      setExistingProviderNames(new Set((provRes.data || []).map(p => p.name.toLowerCase().split(' ')[0])));
      setDbLoaded(true);
    };
    load();
  }, []);

  /* ─── Full validation ─── */
  const runValidation = useCallback((data: ParsedRow[]) => {
    const formatErrors = validateFormat(data);
    const businessErrors = validateBusinessRules(data, existingSegments, existingProviderNames);
    // Deduplicate by rowId+field (format errors take priority)
    const seen = new Set(formatErrors.map(e => `${e.rowId}:${e.field}`));
    const combined = [...formatErrors, ...businessErrors.filter(e => !seen.has(`${e.rowId}:${e.field}`))];
    return combined;
  }, [existingSegments, existingProviderNames]);

  // Re-validate when DB data loads
  useEffect(() => {
    if (rows.length > 0 && dbLoaded) {
      setErrors(runValidation(rows));
    }
  }, [dbLoaded, existingSegments, existingProviderNames]);

  /* ─── Parse file ─── */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setEditingCell(null);

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
        segment: findCol(['segmento', 'segment', 'categoria', 'area']),
        service: findCol(['servico', 'service', 'serviço']),
        servicePrice: findCol(['preco_servico', 'preço serviço', 'preco servico', 'service_price', 'valor_servico', 'valor servico', 'preço_serviço']),
        product: findCol(['produto', 'product']),
        productPrice: findCol(['preco_produto', 'preço produto', 'preco produto', 'product_price', 'valor_produto', 'valor produto', 'preço_produto']),
        stock: findCol(['estoque', 'stock', 'tipo_estoque', 'tipo estoque']),
        phone: findCol(['telefone', 'phone', 'cel']),
        email: findCol(['email', 'e-mail']),
        city: findCol(['cidade', 'city']),
      };

      const parsed: ParsedRow[] = json.map((r: any, i: number) => ({
        _id: i + 1,
        providerName: String(r[colMap.provider || ''] ?? '').trim(),
        segment: String(r[colMap.segment || ''] ?? 'Geral').trim(),
        serviceName: String(r[colMap.service || ''] ?? '').trim(),
        servicePrice: String(r[colMap.servicePrice || ''] ?? '').trim(),
        productName: String(r[colMap.product || ''] ?? '').trim(),
        productPrice: String(r[colMap.productPrice || ''] ?? '').trim(),
        productStockType: String(r[colMap.stock || ''] ?? 'fisico').trim().toLowerCase(),
        phone: String(r[colMap.phone || ''] ?? '').trim(),
        email: String(r[colMap.email || ''] ?? '').trim(),
        city: String(r[colMap.city || ''] ?? '').trim(),
      })).filter((r: ParsedRow) => r.providerName || r.serviceName || r.productName);

      setRows(parsed);
      const errs = runValidation(parsed);
      setErrors(errs);
      const criticalCount = errs.filter(e => e.severity === 'error').length;
      const warnCount = errs.filter(e => e.severity === 'warning').length;
      toast.success(`${parsed.length} linhas carregadas${criticalCount > 0 ? ` — ${criticalCount} erro(s)` : ''}${warnCount > 0 ? ` · ${warnCount} aviso(s)` : ''}`);
    } catch (err: any) {
      toast.error('Erro ao ler planilha: ' + err.message);
    }
  };

  /* ─── Cell editing ─── */
  const updateCell = useCallback((rowId: number, field: string, value: string) => {
    setRows(prev => {
      const updated = prev.map(r => r._id === rowId ? { ...r, [field]: value } : r);
      setErrors(runValidation(updated));
      return updated;
    });
  }, [runValidation]);

  const removeRow = useCallback((rowId: number) => {
    setRows(prev => {
      const updated = prev.filter(r => r._id !== rowId);
      setErrors(runValidation(updated));
      return updated;
    });
  }, [runValidation]);

  /* ─── Get error for cell ─── */
  const getCellError = (rowId: number, field: string) =>
    errors.find(e => e.rowId === rowId && e.field === field);

  const criticalErrors = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning');
  const hasCriticalErrors = criticalErrors.length > 0;
  const hasWarnings = warnings.length > 0;
  const errorRowIds = new Set(errors.map(e => e.rowId));
  const criticalRowIds = new Set(criticalErrors.map(e => e.rowId));

  /* ─── Import ─── */
  const executeImport = async () => {
    if (rows.length === 0 || hasCriticalErrors) return;
    setImporting(true);
    const res: ImportResult = {
      providersCreated: 0, providersLinked: 0, servicesCreated: 0,
      productsCreated: 0, segmentsCreated: 0, errors: [], fixes: [],
    };

    // --- Step 1: Auto-create missing segments ---
    const { data: dbSegments } = await supabase.from('segments').select('id, name, suggested_tags');
    const segMap = new Map<string, number>();
    (dbSegments || []).forEach((s: any) => segMap.set(s.name, s.id));

    const uniqueSegments = new Set(rows.map(r => r.segment.trim()).filter(Boolean));
    for (const segName of uniqueSegments) {
      if (!segMap.has(segName)) {
        const tags = [segName.toLowerCase()];
        const { data: newSeg, error } = await supabase.from('segments').insert({
          name: segName,
          suggested_tags: tags,
        }).select().single();
        if (error) {
          res.errors.push(`Erro ao criar segmento "${segName}": ${error.message}`);
        } else if (newSeg) {
          segMap.set(segName, (newSeg as any).id);
          res.segmentsCreated++;
          res.fixes.push({ icon: 'segment', message: `Segmento "${segName}" criado automaticamente com tag "${segName.toLowerCase()}"` });
        }
      }
    }

    // --- Step 2: Load providers ---
    const { data: existingProviders } = await supabase.from('providers').select('id, name, segment, phone, email');
    const provMap = new Map<string, { id: number; name: string; segment: string[]; phone: string | null; email: string | null }>();
    (existingProviders || []).forEach((p: any) => provMap.set(p.name.toLowerCase().split(' ')[0], p));

    const { data: maxSvc } = await supabase.from('dynamic_services').select('service_id').order('service_id', { ascending: false }).limit(1);
    const { data: maxProd } = await supabase.from('dynamic_products').select('product_id').order('product_id', { ascending: false }).limit(1);
    let nextServiceId = ((maxSvc?.[0]?.service_id) || 2000) + 1;
    let nextProductId = ((maxProd?.[0]?.product_id) || 2000) + 1;

    const byProvider = new Map<string, ParsedRow[]>();
    rows.forEach(row => {
      const key = row.providerName;
      if (!byProvider.has(key)) byProvider.set(key, []);
      byProvider.get(key)!.push(row);
    });

    for (const [provName, provRows] of byProvider) {
      let providerId: number;
      const firstName = provName.toLowerCase().split(' ')[0];
      const existing = provMap.get(firstName);

      if (existing) {
        providerId = existing.id;
        res.providersLinked++;

        // --- Auto-fix: add missing segments to existing provider ---
        const rowSegments = new Set(provRows.map(r => r.segment.trim()).filter(Boolean));
        const currentSegments = new Set(existing.segment || []);
        const newSegments = [...rowSegments].filter(s => !currentSegments.has(s));
        if (newSegments.length > 0) {
          const merged = [...currentSegments, ...newSegments];
          await supabase.from('providers').update({ segment: merged }).eq('id', providerId);
          res.fixes.push({ icon: 'provider', message: `Prestador "${provName}": segmento(s) "${newSegments.join(', ')}" vinculado(s)` });
        }

        // --- Auto-fix: fill missing contact on existing provider ---
        const firstRow = provRows[0];
        const updates: Record<string, string> = {};
        if (!existing.phone && firstRow.phone.trim()) {
          updates.phone = firstRow.phone;
        }
        if (!existing.email && firstRow.email.trim()) {
          updates.email = firstRow.email;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('providers').update(updates).eq('id', providerId);
          res.fixes.push({ icon: 'contact', message: `Prestador "${provName}": contato atualizado (${Object.keys(updates).join(', ')})` });
        }
      } else {
        // --- Create new provider with all segments from rows ---
        const firstRow = provRows[0];
        const allSegments = [...new Set(provRows.map(r => r.segment.trim()).filter(Boolean))];
        const { data: newProv, error } = await supabase.from('providers').insert({
          name: provName,
          segment: allSegments.length > 0 ? allSegments : ['Geral'],
          type: 'mei',
          phone: firstRow.phone || '',
          email: firstRow.email || '',
          city: firstRow.city || '',
        }).select().single();
        if (error || !newProv) { res.errors.push(`Erro ao criar ${provName}: ${error?.message}`); continue; }
        providerId = (newProv as any).id;
        provMap.set(firstName, { id: providerId, name: provName, segment: allSegments, phone: firstRow.phone, email: firstRow.email });
        res.providersCreated++;

        if (!firstRow.phone.trim() && !firstRow.email.trim()) {
          res.fixes.push({ icon: 'contact', message: `Prestador "${provName}" criado sem contato — corrija no painel Admin` });
        }
      }

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
          });
          if (error) {
            res.errors.push(`Serviço ${row.serviceName}: ${error.message}`);
          } else {
            res.servicesCreated++;
            if (price === 0) {
              res.fixes.push({ icon: 'price', message: `Serviço "${row.serviceName}" importado com preço R$ 0 — ajuste no Admin` });
            }
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
          });
          if (error) {
            res.errors.push(`Produto ${row.productName}: ${error.message}`);
          } else {
            res.productsCreated++;
            if (tags.length > 0) {
              res.fixes.push({ icon: 'tags', message: `Produto "${row.productName}": tag "${tags[0]}" adicionada automaticamente` });
            }
            if (price === 0) {
              res.fixes.push({ icon: 'price', message: `Produto "${row.productName}" importado com preço R$ 0 — ajuste no Admin` });
            }
          }
        }
      }
    }

    await reloadDynamicEntries();
    setResult(res);
    setImporting(false);
    toast.success('Importação concluída!');
  };

  const resetAll = () => {
    setRows([]);
    setErrors([]);
    setResult(null);
    setFileName('');
    setEditingCell(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ─── Render cell ─── */
  const renderCell = (row: ParsedRow, field: keyof Omit<ParsedRow, '_id'>) => {
    const isEditing = editingCell?.rowId === row._id && editingCell?.field === field;
    const cellError = getCellError(row._id, field);
    const value = row[field] as string;

    if (isEditing) {
      if (field === 'productStockType') {
        return (
          <Select value={value} onValueChange={(v) => { updateCell(row._id, field, v); setEditingCell(null); }}>
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
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

    return (
      <div
        className={`cursor-pointer px-1 py-0.5 rounded text-xs min-h-[24px] flex items-center ${
          isError
            ? 'bg-destructive/15 text-destructive ring-1 ring-destructive/30'
            : isWarning
              ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30'
              : 'hover:bg-muted/50'
        }`}
        onClick={() => setEditingCell({ rowId: row._id, field })}
        title={cellError?.message}
      >
        {value || <span className="text-muted-foreground italic">—</span>}
        {isError && <AlertTriangle className="w-3 h-3 ml-1 shrink-0" />}
        {isWarning && <ShieldAlert className="w-3 h-3 ml-1 shrink-0" />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center h-14 px-4 gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">Importação Inteligente</span>
        </div>
      </nav>

      <div className="pt-20 px-4 container mx-auto max-w-5xl space-y-4">
        {/* Actions row */}
        <div className="flex flex-wrap gap-3">
          <Card className="flex-1 min-w-[200px]">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-primary" /> 1. Baixe o Modelo
              </p>
              <p className="text-[10px] text-muted-foreground">Planilha com cabeçalhos e linha de exemplo.</p>
              <Button variant="outline" size="sm" className="gap-1.5 mt-auto" onClick={generateTemplate}>
                <Download className="w-3 h-3" /> Modelo para Importação
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[200px]">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-primary" /> 2. Faça Upload
              </p>
              <p className="text-[10px] text-muted-foreground">Excel (.xlsx) ou CSV. Colunas identificadas automaticamente.</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
              <Button variant="outline" size="sm" className="gap-1.5 mt-auto" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3 h-3" /> {fileName || 'Selecionar Arquivo'}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[200px]">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-primary" /> 3. Corrija e Salve
              </p>
              <p className="text-[10px] text-muted-foreground">Corrija erros (vermelho) e avisos (amarelo) antes de importar.</p>
              <Button
                size="sm"
                className="gap-1.5 mt-auto"
                disabled={rows.length === 0 || hasCriticalErrors || importing}
                onClick={executeImport}
              >
                {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {importing ? 'Importando...' : hasWarnings ? 'Importar com Avisos' : 'Importar Dados'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Error summary - critical errors */}
        <AnimatePresence>
          {rows.length > 0 && hasCriticalErrors && !result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-destructive/40 bg-destructive/5">
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <span className="text-xs font-medium text-destructive">
                      {criticalErrors.length} erro(s) crítico(s) em {criticalRowIds.size} linha(s) — importação bloqueada
                    </span>
                  </div>
                  <p className="text-[10px] text-destructive/70 pl-6">Clique nas células vermelhas para corrigir</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warning summary - business rule issues */}
        <AnimatePresence>
          {rows.length > 0 && hasWarnings && !hasCriticalErrors && !result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-yellow-500/40 bg-yellow-500/5">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldAlert className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      {warnings.length} aviso(s) de inconsistência detectados
                    </span>
                  </div>
                  <p className="text-[10px] text-yellow-600/80 dark:text-yellow-400/70 pl-6">
                    Esses dados gerarão inconsistências no painel após importação. Corrija agora ou importe assim mesmo.
                  </p>
                  <div className="pl-6 space-y-1 max-h-32 overflow-y-auto">
                    {warnings.slice(0, 10).map((w, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-yellow-700 dark:text-yellow-400">
                        <Badge variant="secondary" className="text-[9px] px-1 h-4">{FIELD_LABELS[w.field]}</Badge>
                        <span>Linha {w.rowId}: {w.message}</span>
                      </div>
                    ))}
                    {warnings.length > 10 && (
                      <p className="text-[10px] text-yellow-600/60">...e mais {warnings.length - 10} aviso(s)</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Both warnings and errors */}
        <AnimatePresence>
          {rows.length > 0 && hasWarnings && hasCriticalErrors && !result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-yellow-500/40 bg-yellow-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      + {warnings.length} aviso(s) de regra de negócio (células amarelas)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation passed */}
        <AnimatePresence>
          {rows.length > 0 && !hasCriticalErrors && !hasWarnings && !result && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-green-500/40 bg-green-500/5">
                <CardContent className="p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    ✓ Todas as {rows.length} linhas validadas sem erros e sem inconsistências — pronto para importar
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
                  {rows.length} linhas
                  {criticalErrors.length > 0 && (
                    <Badge variant="destructive" className="text-[10px]">{criticalErrors.length} erro(s)</Badge>
                  )}
                  {warnings.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                      {warnings.length} aviso(s)
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
                              : errorRowIds.has(row._id)
                                ? 'bg-yellow-500/5'
                                : ''
                          }
                        >
                          <TableCell className="text-[10px] text-muted-foreground font-mono">{row._id}</TableCell>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Importação Concluída
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { n: result.providersCreated, l: 'Prestadores criados' },
                    { n: result.providersLinked, l: 'Prestadores vinculados' },
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
                      <AlertTriangle className="w-3 h-3" /> {result.errors.length} erro(s)
                    </p>
                    {result.errors.slice(0, 5).map((err, i) => <p key={i} className="text-[10px] text-destructive/80">{err}</p>)}
                  </div>
                )}
                <Button variant="outline" className="w-full gap-2" onClick={resetAll}>
                  <Upload className="w-3 h-3" /> Nova Importação
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
