import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  Loader2, Download, Pencil, Trash2, X, Save, ShieldAlert, Sparkles, Search, Users,
  UserCheck, UserPlus, Wrench, Package, ChevronDown, ChevronRight, Link2, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reloadDynamicEntries } from '@/data/searchData';

/* ─── Types ─── */
interface ExistingProvider {
  id: number;
  name: string;
  segment: string[];
  phone: string | null;
  email: string | null;
  cpf_cnpj: string | null;
}

interface ParsedRow {
  _id: number;
  providerName: string;
  segment: string;
  serviceName: string;
  servicePrice: string;
  serviceUnit: string;
  serviceQuantity: string;
  productName: string;
  productPrice: string;
  productUnit: string;
  productStockType: string;
  productQuantity: string;
  phone: string;
  email: string;
  city: string;
  cpfCnpj: string;
  _matchType?: 'email' | 'name' | 'cpf' | 'new';
  _matchedProviderId?: number;
  _matchedProviderName?: string;
  _aiFields?: Set<string>;
  _groupKey?: string;
  _groupKeyType?: 'cpf' | 'email' | 'phone' | 'name';
}

interface EntityGroup {
  key: string;
  keyType: 'cpf' | 'email' | 'phone' | 'name';
  providerName: string;
  rows: ParsedRow[];
  matchType: 'email' | 'name' | 'cpf' | 'new';
  matchedProvider?: ExistingProvider;
  servicesCount: number;
  productsCount: number;
  segments: string[];
  confirmedAction: 'merge' | 'create' | 'pending';
}

interface RowError {
  rowId: number;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'ai' | 'info';
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

const STOCK_TYPES = ['fisico', 'drop'];

const FIELD_LABELS: Record<string, string> = {
  providerName: 'Prestador',
  cpfCnpj: 'CPF/CNPJ',
  segment: 'Segmento',
  serviceName: 'Serviço',
  servicePrice: 'Preço Serviço',
  serviceUnit: 'Un. Serviço',
  serviceQuantity: 'Qtd Serviço',
  productName: 'Produto',
  productPrice: 'Preço Produto',
  productUnit: 'Un. Produto',
  productStockType: 'Tipo Estoque',
  productQuantity: 'Qtd Produto',
  phone: 'Telefone',
  email: 'E-mail',
  city: 'Cidade',
};

const COLUMNS: (keyof Omit<ParsedRow, '_id' | '_matchType' | '_matchedProviderId' | '_matchedProviderName' | '_aiFields' | '_groupKey' | '_groupKeyType'>)[] = [
  'providerName', 'cpfCnpj', 'segment',
  'serviceName', 'servicePrice', 'serviceUnit', 'serviceQuantity',
  'productName', 'productPrice', 'productUnit', 'productStockType', 'productQuantity',
  'phone', 'email', 'city',
];

/* ─── Schema definition: drives both the template and parsing ───
   Mantém o modelo gerado SEMPRE sincronizado com os campos obrigatórios atuais
   do sistema (usuário/prestador, serviços e produtos). */
interface TemplateField {
  key: keyof Omit<ParsedRow, '_id' | '_matchType' | '_matchedProviderId' | '_matchedProviderName' | '_aiFields' | '_groupKey' | '_groupKeyType'>;
  header: string;
  required: boolean;
  group: 'prestador' | 'servico' | 'produto';
  example: string;
  hint?: string;
  matchPatterns: string[];
}

const TEMPLATE_SCHEMA: TemplateField[] = [
  // Prestador / Usuário
  { key: 'providerName', header: 'Prestador *', required: true, group: 'prestador', example: 'João Silva', matchPatterns: ['prestador', 'provider', 'nome do prestador', 'profissional', 'usuario', 'usuário'] },
  { key: 'cpfCnpj',      header: 'CPF/CNPJ *',  required: true, group: 'prestador', example: '123.456.789-09', hint: 'Use ISENTO se não houver', matchPatterns: ['cpf', 'cnpj', 'cpf/cnpj', 'cpf_cnpj', 'documento'] },
  { key: 'phone',        header: 'Telefone *',  required: true, group: 'prestador', example: '(11) 99999-0000', matchPatterns: ['telefone', 'phone', 'cel'] },
  { key: 'email',        header: 'E-mail *',    required: true, group: 'prestador', example: 'joao@email.com', matchPatterns: ['email', 'e-mail'] },
  { key: 'city',         header: 'Cidade',      required: false, group: 'prestador', example: 'São Paulo', matchPatterns: ['cidade', 'city'] },
  { key: 'segment',      header: 'Segmento *',  required: true, group: 'prestador', example: 'Manutenção', matchPatterns: ['segmento', 'segment', 'categoria', 'area'] },
  // Serviço (opcional, mas se houver nome → preço/qtd recomendados)
  { key: 'serviceName',     header: 'Serviço',          required: false, group: 'servico', example: 'Instalação Elétrica', matchPatterns: ['servico', 'service', 'serviço'] },
  { key: 'servicePrice',    header: 'Preço Serviço',    required: false, group: 'servico', example: '150', matchPatterns: ['preco_servico', 'preço serviço', 'preco servico', 'service_price', 'valor_servico', 'valor servico', 'preço_serviço'] },
  { key: 'serviceUnit',     header: 'Un. Serviço',      required: false, group: 'servico', example: 'hr', matchPatterns: ['un. servico', 'un. serviço', 'unidade servico', 'unidade serviço', 'service_unit'] },
  { key: 'serviceQuantity', header: 'Qtd Serviço',      required: false, group: 'servico', example: '1', hint: 'Capacidade/quantidade disponível', matchPatterns: ['qtd servico', 'qtd serviço', 'quantidade servico', 'quantidade serviço', 'qtd_servico', 'service_quantity'] },
  // Produto (opcional, mas se houver nome → preço/qtd recomendados)
  { key: 'productName',     header: 'Produto',          required: false, group: 'produto', example: 'Tomada 3 pinos', matchPatterns: ['produto', 'product'] },
  { key: 'productPrice',    header: 'Preço Produto',    required: false, group: 'produto', example: '12.50', matchPatterns: ['preco_produto', 'preço produto', 'preco produto', 'product_price', 'valor_produto', 'valor produto', 'preço_produto'] },
  { key: 'productUnit',     header: 'Un. Produto',      required: false, group: 'produto', example: 'un', matchPatterns: ['un. produto', 'unidade produto', 'product_unit'] },
  { key: 'productStockType',header: 'Tipo Estoque',     required: false, group: 'produto', example: 'fisico', hint: 'fisico ou drop', matchPatterns: ['estoque', 'stock', 'tipo_estoque', 'tipo estoque'] },
  { key: 'productQuantity', header: 'Qtd Produto',      required: false, group: 'produto', example: '10', hint: 'Quantidade em estoque', matchPatterns: ['qtd produto', 'quantidade produto', 'qtd_produto', 'product_quantity', 'estoque qtd', 'qtd', 'quantidade'] },
];

/* ─── Template generator ───
   Gera o arquivo modelo de importação a partir do TEMPLATE_SCHEMA. Sempre
   reflete o conjunto atual de campos obrigatórios do sistema (usuário/prestador,
   serviços e produtos), validando antes da geração se há campo no schema que
   ainda não está representado em coluna do arquivo. */
const generateTemplate = async (
  onProgress?: (step: string, percent: number) => void,
) => {
  const tick = (s: string, p: number) => onProgress?.(s, p);
  tick('Iniciando geração do modelo...', 5);

  const XLSX = await import('xlsx');
  tick('Carregando configurações do sistema...', 15);

  const [unitsRes, segmentsRes] = await Promise.all([
    supabase.from('units').select('name, label').order('name'),
    supabase.from('segments').select('name').order('name'),
  ]);
  const unitsData = unitsRes.data || [];
  const segmentsData = segmentsRes.data || [];
  const unitsList = unitsData.map((u: any) => u.name).join(', ');
  const segList = segmentsData.map((s: any) => s.name).slice(0, 8).join(', ');
  tick('Validando campos obrigatórios do sistema...', 35);

  // Validação: garante que todos os campos do ParsedRow têm representação no schema
  const schemaKeys = new Set(TEMPLATE_SCHEMA.map(f => f.key));
  const required: (keyof ParsedRow)[] = [
    'providerName', 'cpfCnpj', 'segment',
    'serviceName', 'servicePrice', 'serviceUnit', 'serviceQuantity',
    'productName', 'productPrice', 'productUnit', 'productStockType', 'productQuantity',
    'phone', 'email', 'city',
  ];
  const missing = required.filter(k => !schemaKeys.has(k as any));
  if (missing.length > 0) {
    toast.error(`Campos faltantes no modelo: ${missing.join(', ')}`);
    return;
  }
  tick('Montando colunas...', 55);

  // Linha 1: cabeçalhos com sufixo " *" para obrigatórios
  const headers = TEMPLATE_SCHEMA.map(f => f.header);
  // Linha 2: exemplo de preenchimento
  const example = TEMPLATE_SCHEMA.map(f => f.example);
  // Linha 3: dicas/observações
  const hintRow = TEMPLATE_SCHEMA.map(f => {
    if (f.key === 'serviceUnit' || f.key === 'productUnit') return `Unidades: ${unitsList || 'hr, un, m, kg'}`;
    if (f.key === 'segment') return segList ? `Existentes: ${segList}` : 'Ex: Saúde, Automotivo';
    return f.hint || '';
  });
  const aoa = [headers, example, hintRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Larguras adaptativas
  ws['!cols'] = TEMPLATE_SCHEMA.map(f => ({
    wch: Math.max(f.header.length + 2, f.example.length + 2, 14),
  }));
  tick('Aplicando estilos visuais (obrigatórias)...', 70);

  // Marcar visualmente colunas obrigatórias com fill amarelo + negrito vermelho;
  // opcionais ficam com fill cinza claro. (Aplica via cellStyles do xlsx-js-style fallback básico)
  TEMPLATE_SCHEMA.forEach((f, idx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: idx });
    const cell = ws[cellAddr];
    if (!cell) return;
    cell.s = f.required
      ? {
          font: { bold: true, color: { rgb: 'B91C1C' } },
          fill: { fgColor: { rgb: 'FEF3C7' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'B91C1C' } },
            bottom: { style: 'thin', color: { rgb: 'B91C1C' } },
            left: { style: 'thin', color: { rgb: 'B91C1C' } },
            right: { style: 'thin', color: { rgb: 'B91C1C' } },
          },
        }
      : {
          font: { bold: true, color: { rgb: '475569' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
  });

  // Freeze header
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Importação');

  // Aba Legenda — explica obrigatórios vs opcionais e o agrupamento
  tick('Adicionando aba "Instruções"...', 80);
  const legendRows: any[][] = [
    ['CAMPO', 'OBRIGATÓRIO', 'GRUPO', 'EXEMPLO', 'DICA'],
    ...TEMPLATE_SCHEMA.map(f => [
      f.header.replace(' *', ''),
      f.required ? 'SIM' : 'Não',
      f.group === 'prestador' ? 'Prestador / Usuário' : f.group === 'servico' ? 'Serviço' : 'Produto',
      f.example,
      f.hint || '',
    ]),
    [],
    ['Cores no cabeçalho:'],
    ['Amarelo + texto vermelho = OBRIGATÓRIO'],
    ['Cinza = Opcional (preencher se aplicável)'],
    [],
    ['Regras de unificação:'],
    ['Linhas com mesmo CPF/CNPJ, e-mail ou telefone serão tratadas como o MESMO prestador.'],
    ['Os serviços e produtos serão somados ao estoque desse prestador.'],
  ];
  const wsLegend = XLSX.utils.aoa_to_sheet(legendRows);
  wsLegend['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsLegend, 'Instruções');

  if (unitsData.length > 0) {
    const unitsHeaders = ['Sigla', 'Descrição'];
    const unitsRows = unitsData.map((u: any) => [u.name, u.label]);
    const wsUnits = XLSX.utils.aoa_to_sheet([unitsHeaders, ...unitsRows]);
    wsUnits['!cols'] = [{ wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsUnits, 'Unidades de Medida');
  }
  if (segmentsData.length > 0) {
    const segHeaders = ['Segmento'];
    const segRows = segmentsData.map((s: any) => [s.name]);
    const wsSeg = XLSX.utils.aoa_to_sheet([segHeaders, ...segRows]);
    wsSeg['!cols'] = [{ wch: 28 }];
    XLSX.utils.book_append_sheet(wb, wsSeg, 'Segmentos');
  }

  tick('Gravando arquivo .xlsx...', 95);
  XLSX.writeFile(wb, 'modelo_importacao.xlsx');
  tick('Modelo pronto!', 100);
  toast.success(`Modelo atualizado baixado — ${TEMPLATE_SCHEMA.filter(f => f.required).length} colunas obrigatórias`);
};

/* ─── Heuristic enrichment (modo IA OFF) ─── */
function heuristicEnrich(r: any, existingSegments: string[]): any {
  const out: any = { _id: r._id };
  const isEmpty = (v: any) => !String(v || '').trim();
  // Segmento — pega 1º existente ou "Geral"
  if (isEmpty(r.segment)) out.segment = existingSegments[0] || 'Geral';
  // Telefone fictício consistente por providerName
  if (isEmpty(r.phone) && r.providerName) {
    const seed = String(r.providerName).split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const n = (90000 + (seed % 9999)).toString().padStart(5, '0');
    const last = (1000 + (seed % 8999)).toString();
    out.phone = `(11) 9${n.slice(0, 4)}-${last}`;
  }
  // Email a partir do nome
  if (isEmpty(r.email) && r.providerName) {
    const slug = String(r.providerName).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
    out.email = `${slug || 'contato'}@email.com`;
  }
  if (isEmpty(r.city)) out.city = 'São Paulo';
  // Preços base
  if (r.serviceName && isEmpty(r.servicePrice)) out.servicePrice = '120';
  if (r.serviceName && isEmpty(r.serviceUnit)) out.serviceUnit = 'hr';
  if (r.productName && isEmpty(r.productPrice)) out.productPrice = '49';
  if (r.productName && isEmpty(r.productUnit)) out.productUnit = 'un';
  if (r.productName && isEmpty(r.productStockType)) out.productStockType = 'fisico';
  return out;
}


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

/* ─── Entity grouping (intra-spreadsheet dedup) ───
   Treat rows sharing the same canonical key (CPF > email > phone > normalized name)
   as the SAME provider; their services/products are aggregated into a single record. */
const computeGroupKey = (row: ParsedRow): { key: string; type: 'cpf' | 'email' | 'phone' | 'name' } => {
  const cpf = row.cpfCnpj.replace(/\D/g, '').trim();
  if (cpf && cpf.length >= 11) return { key: `cpf:${cpf}`, type: 'cpf' };
  const email = row.email.trim().toLowerCase();
  if (email) return { key: `email:${email}`, type: 'email' };
  const phone = row.phone.replace(/\D/g, '').trim();
  if (phone && phone.length >= 8) return { key: `phone:${phone.slice(-8)}`, type: 'phone' };
  const name = row.providerName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return { key: `name:${name}`, type: 'name' };
};

const annotateGroups = (rows: ParsedRow[]): ParsedRow[] => {
  return rows.map(r => {
    const { key, type } = computeGroupKey(r);
    return { ...r, _groupKey: key, _groupKeyType: type };
  });
};

const buildEntityGroups = (
  rows: ParsedRow[],
  providers: ExistingProvider[],
  resolvedDecisions: Map<string, { action: 'merge' | 'create'; providerId?: number }>,
): EntityGroup[] => {
  const map = new Map<string, EntityGroup>();
  for (const row of rows) {
    const key = row._groupKey || computeGroupKey(row).key;
    const keyType = row._groupKeyType || 'name';
    if (!map.has(key)) {
      const matchResult = cascadeMatch(row, providers);
      map.set(key, {
        key,
        keyType,
        providerName: row.providerName.trim() || '(sem nome)',
        rows: [],
        matchType: matchResult.type,
        matchedProvider: matchResult.provider,
        servicesCount: 0,
        productsCount: 0,
        segments: [],
        confirmedAction: matchResult.type !== 'new' ? 'pending' : 'create',
      });
    }
    const g = map.get(key)!;
    g.rows.push(row);
    if (row.serviceName.trim()) g.servicesCount++;
    if (row.productName.trim()) g.productsCount++;
    if (row.segment.trim() && !g.segments.includes(row.segment.trim())) g.segments.push(row.segment.trim());
    if (row.providerName.trim().length > g.providerName.length) g.providerName = row.providerName.trim();
  }
  for (const g of map.values()) {
    const dec = resolvedDecisions.get(g.key);
    if (dec) {
      g.confirmedAction = dec.action;
      if (dec.action === 'merge' && dec.providerId) {
        const found = providers.find(p => p.id === dec.providerId);
        if (found) {
          g.matchedProvider = found;
          g.matchType = g.matchType === 'new' ? 'name' : g.matchType;
        }
      }
    }
  }
  return [...map.values()];
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

  // Intra-spreadsheet duplicates are NOT errors anymore — they form an entity group.
  // We surface them as informational hints so the user understands the merge.
  const cpfMap = new Map<string, number>();
  const emailMap = new Map<string, number>();
  const phoneMap = new Map<string, number>();

  rows.forEach(row => {
    const cpf = row.cpfCnpj.replace(/\D/g, '').trim();
    const email = row.email.trim().toLowerCase();
    const phone = row.phone.replace(/\D/g, '').trim();

    if (cpf && cpf.length >= 11) {
      if (cpfMap.has(cpf)) {
        errors.push({ rowId: row._id, field: 'cpfCnpj', message: `Mesmo CPF/CNPJ da linha ${cpfMap.get(cpf)} — itens serão unificados`, severity: 'info' });
      } else {
        cpfMap.set(cpf, row._id);
      }
    }
    if (email) {
      if (emailMap.has(email)) {
        errors.push({ rowId: row._id, field: 'email', message: `Mesmo e-mail da linha ${emailMap.get(email)} — itens serão unificados`, severity: 'info' });
      } else {
        emailMap.set(email, row._id);
      }
    }
    if (phone && phone.length >= 8) {
      const phoneKey = phone.slice(-8);
      if (phoneMap.has(phoneKey)) {
        errors.push({ rowId: row._id, field: 'phone', message: `Mesmo telefone da linha ${phoneMap.get(phoneKey)} — itens serão unificados`, severity: 'info' });
      } else {
        phoneMap.set(phoneKey, row._id);
      }
    }
  });
  
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

  /* ── Cross-group conflicts ──
     Same phone/email in DIFFERENT entity groups (different person)
     = real error, blocks import until corrected. */
  const phoneToGroup = new Map<string, string>();
  const emailToGroup = new Map<string, string>();
  rows.forEach(row => {
    const groupKey = row._groupKey || computeGroupKey(row).key;
    const phone = row.phone.replace(/\D/g, '').trim();
    const email = row.email.trim().toLowerCase();
    if (phone && phone.length >= 8) {
      const key = phone.slice(-8);
      const existing = phoneToGroup.get(key);
      if (existing && existing !== groupKey) {
        errors.push({ rowId: row._id, field: 'phone', message: 'Telefone usado por outro prestador (corrija para evitar conflito)', severity: 'error' });
      } else if (!existing) {
        phoneToGroup.set(key, groupKey);
      }
    }
    if (email) {
      const existing = emailToGroup.get(email);
      if (existing && existing !== groupKey) {
        errors.push({ rowId: row._id, field: 'email', message: 'E-mail usado por outro prestador (corrija para evitar conflito)', severity: 'error' });
      } else if (!existing) {
        emailToGroup.set(email, groupKey);
      }
    }
  });

  /* ── Item duplication within same provider group ──
     Same name + unit for product/service in the same group = error. */
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const itemKeySeen = new Map<string, number>();
  rows.forEach(row => {
    const groupKey = row._groupKey || computeGroupKey(row).key;
    if (row.serviceName.trim()) {
      const k = `${groupKey}|service|${norm(row.serviceName)}|${norm(row.serviceUnit || 'hr')}`;
      if (itemKeySeen.has(k)) {
        errors.push({ rowId: row._id, field: 'serviceName', message: `Serviço duplicado no mesmo prestador (linha ${itemKeySeen.get(k)}). Renomeie ou ajuste a unidade.`, severity: 'error' });
      } else itemKeySeen.set(k, row._id);
    }
    if (row.productName.trim()) {
      const k = `${groupKey}|product|${norm(row.productName)}|${norm(row.productUnit || 'un')}`;
      if (itemKeySeen.has(k)) {
        errors.push({ rowId: row._id, field: 'productName', message: `Produto duplicado no mesmo prestador (linha ${itemKeySeen.get(k)}). Renomeie ou ajuste a unidade.`, severity: 'error' });
      } else itemKeySeen.set(k, row._id);
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
  const [templateProgress, setTemplateProgress] = useState<{ step: string; percent: number } | null>(null);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  const handleGenerateTemplate = useCallback(async () => {
    setGeneratingTemplate(true);
    setTemplateProgress({ step: 'Iniciando...', percent: 0 });
    try {
      await generateTemplate((step, percent) => setTemplateProgress({ step, percent }));
    } catch (e: any) {
      toast.error('Erro ao gerar modelo: ' + (e?.message || 'erro desconhecido'));
    } finally {
      setGeneratingTemplate(false);
      setTimeout(() => setTemplateProgress(null), 1800);
    }
  }, []);
  // Provider dedup confirmation
  const [dedupPending, setDedupPending] = useState<{
    rowId: number;
    providerName: string;
    matches: ExistingProvider[];
    resolved: boolean;
  }[]>([]);
  const [showDedupModal, setShowDedupModal] = useState(false);
  // Group decisions: groupKey -> { action, providerId? }
  const [groupDecisions, setGroupDecisions] = useState<Map<string, { action: 'merge' | 'create'; providerId?: number }>>(new Map());
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(new Set());

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
    const annotated = annotateGroups(parsed);
    return annotated.map(row => {
      const result = cascadeMatch(row, existingProviders);
      return {
        ...row,
        _matchType: result.type,
        _matchedProviderId: result.provider?.id,
        _matchedProviderName: result.provider?.name,
      };
    });
  }, [existingProviders]);

  /* ─── Derived: entity groups (mesmo prestador = mesmas chaves) ─── */
  const groups = useMemo<EntityGroup[]>(() => {
    if (rows.length === 0) return [];
    return buildEntityGroups(rows, existingProviders, groupDecisions);
  }, [rows, existingProviders, groupDecisions]);

  const groupsNeedingDecision = groups.filter(g => g.matchType !== 'new' && g.confirmedAction === 'pending');
  const groupsWithIntraDup = groups.filter(g => g.rows.length > 1);

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
        provider: findCol(['prestador', 'provider', 'nome do prestador', 'profissional', 'usuario', 'usuário']),
        cpfCnpj: findCol(['cpf', 'cnpj', 'cpf/cnpj', 'cpf_cnpj', 'documento']),
        segment: findCol(['segmento', 'segment', 'categoria', 'area']),
        service: findCol(['servico', 'service', 'serviço']),
        servicePrice: findCol(['preco_servico', 'preço serviço', 'preco servico', 'service_price', 'valor_servico', 'valor servico', 'preço_serviço']),
        serviceUnit: findCol(['un. servico', 'un. serviço', 'unidade servico', 'unidade serviço', 'service_unit']),
        serviceQuantity: findCol(['qtd servico', 'qtd serviço', 'quantidade servico', 'quantidade serviço', 'qtd_servico', 'service_quantity']),
        product: findCol(['produto', 'product']),
        productPrice: findCol(['preco_produto', 'preço produto', 'preco produto', 'product_price', 'valor_produto', 'valor produto', 'preço_produto']),
        productUnit: findCol(['un. produto', 'unidade produto', 'product_unit']),
        stock: findCol(['tipo_estoque', 'tipo estoque', 'estoque tipo', 'stock_type']),
        productQuantity: findCol(['qtd produto', 'quantidade produto', 'qtd_produto', 'product_quantity', 'estoque qtd', 'qtd', 'quantidade']),
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
        serviceQuantity: String(r[colMap.serviceQuantity || ''] ?? '').trim(),
        productName: String(r[colMap.product || ''] ?? '').trim(),
        productPrice: String(r[colMap.productPrice || ''] ?? '').trim(),
        productUnit: String(r[colMap.productUnit || ''] ?? '').trim().toLowerCase(),
        productStockType: String(r[colMap.stock || ''] ?? '').trim().toLowerCase(),
        productQuantity: String(r[colMap.productQuantity || ''] ?? '').trim(),
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

  /* ─── AI Enrichment (respeita governance OFF) ─── */
  const enrichWithAI = async () => {
    if (rows.length === 0) return;
    setEnriching(true);

    // Verifica modo IA — se OFF, usa fallback heurístico local (sem créditos)
    const { getAiModeAsync, logAiSavings } = await import('@/hooks/useAiMode');
    const aiMode = await getAiModeAsync();
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

        let data: any = null;
        let error: any = null;

        if (aiMode === 'off') {
          // Fallback heurístico local — sem chamar IA paga
          data = { enriched: simplifiedRows.map((r: any) => heuristicEnrich(r, segNames)) };
        } else {
          const resp = await supabase.functions.invoke('enrich-import-data', {
            body: { rows: simplifiedRows, existingSegments: segNames },
          });
          data = resp.data;
          error = resp.error;
          // Se IA falhou (créditos/limite), cai para heurística silenciosamente
          const status = (resp as any)?.error?.context?.status;
          if (error || status === 402 || status === 429) {
            toast.warning('IA indisponível — usando preenchimento heurístico local.');
            data = { enriched: simplifiedRows.map((r: any) => heuristicEnrich(r, segNames)) };
            error = null;
            try { await logAiSavings('import_enrich', 'heuristic_local', simplifiedRows.length, { batch: i / batchSize }); } catch {}
          }
        }

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
      // Re-run cascade matching + group key if key fields change
      if (['email', 'providerName', 'cpfCnpj', 'phone'].includes(field)) {
        const reMatched = updated.map(row => {
          if (row._id !== rowId) return row;
          const result = cascadeMatch(row, existingProviders);
          const { key, type } = computeGroupKey(row);
          return { ...row, _matchType: result.type, _matchedProviderId: result.provider?.id, _matchedProviderName: result.provider?.name, _groupKey: key, _groupKeyType: type };
        });
        setErrors(runValidation(reMatched));
        return reMatched;
      }
      setErrors(runValidation(updated));
      return updated;
    });
  }, [runValidation, existingProviders]);

  /* Apply a field change to ALL rows of an entity group (provider-level fields) */
  const updateGroupField = useCallback((groupKey: string, field: keyof ParsedRow, value: string) => {
    setRows(prev => {
      const updated = prev.map(r => {
        const rk = r._groupKey || computeGroupKey(r).key;
        if (rk !== groupKey) return r;
        const next: ParsedRow = { ...r, [field]: value } as ParsedRow;
        if (r._aiFields?.has(field as string)) {
          const newAi = new Set(r._aiFields);
          newAi.delete(field as string);
          next._aiFields = newAi;
        }
        return next;
      });
      // Recompute matching/groupKey when key fields change
      if (['email', 'providerName', 'cpfCnpj', 'phone'].includes(field as string)) {
        const reMatched = updated.map(row => {
          const rk0 = row._groupKey || '';
          if (rk0 !== groupKey) return row;
          const result = cascadeMatch(row, existingProviders);
          const { key, type } = computeGroupKey(row);
          return { ...row, _matchType: result.type, _matchedProviderId: result.provider?.id, _matchedProviderName: result.provider?.name, _groupKey: key, _groupKeyType: type };
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
  const infoMarkers = errors.filter(e => e.severity === 'info');
  const hasCriticalErrors = criticalErrors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasAiData = aiMarkers.length > 0;
  const criticalRowIds = new Set(criticalErrors.map(e => e.rowId));

  /* ─── Import (atomic) with progress tracking ─── */
  const executeImport = async () => {
    if (rows.length === 0 || hasCriticalErrors) return;
    // Block if any group with existing-base coincidence is still pending decision
    if (groupsNeedingDecision.length > 0) {
      toast.error(`${groupsNeedingDecision.length} cadastro(s) aguardando confirmação (Vincular ou Criar novo).`);
      const el = document.getElementById('entity-groups-panel');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      // Group by canonical key (CPF > email > phone > name) so duplicate rows
      // in the spreadsheet are unified into a single provider with multiple items.
      const byGroup = new Map<string, ParsedRow[]>();
      rows.forEach(row => {
        const key = row._groupKey || computeGroupKey(row).key;
        if (!row.providerName.trim() && !row.serviceName.trim() && !row.productName.trim()) return;
        if (!byGroup.has(key)) byGroup.set(key, []);
        byGroup.get(key)!.push(row);
      });

      // Reload providers for fresh data
      setImportProgress({ step: 'Carregando prestadores...', percent: 25 });
      const { data: freshProviders } = await supabase.from('providers').select('id, name, segment, phone, email, cpf_cnpj');
      const providerList = (freshProviders || []) as ExistingProvider[];

      const totalProviders = byGroup.size;
      let processedProviders = 0;

      for (const [groupKey, provRows] of byGroup) {
        processedProviders++;
        const progressPercent = 25 + Math.round((processedProviders / totalProviders) * 50);
        // Pick the most complete provider name across the group
        const provName = provRows.reduce((best, r) => r.providerName.trim().length > best.length ? r.providerName.trim() : best, '') || '(sem nome)';
        setImportProgress({ step: `Processando: ${provName}...`, percent: progressPercent });

        const firstRow = provRows[0];
        let providerId: number;

        // Honor user decision (merge vs create) if any
        const decision = groupDecisions.get(groupKey);
        let matchResult = cascadeMatch(firstRow, providerList);
        if (decision?.action === 'create') {
          matchResult = { type: 'new' };
        } else if (decision?.action === 'merge' && decision.providerId) {
          const target = providerList.find(p => p.id === decision.providerId);
          if (target) matchResult = { type: 'name', provider: target };
        }

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

        // STEP A — primeiro insere PRODUTOS do grupo (precisamos dos ids para vincular aos serviços)
        const createdProducts: { id: number; name: string; price: number }[] = [];
        for (const row of provRows) {
          if (!row.productName.trim()) continue;
          const price = parseFloat(row.productPrice) || 0;
          const tags = row.segment ? [row.segment.toLowerCase()] : [];
          const qtyRaw = parseInt(row.productQuantity, 10);
          const quantity = Number.isFinite(qtyRaw) && qtyRaw >= 0 ? qtyRaw : 0;
          const unit = row.productUnit || 'un';
          try {
            const { data: dup } = await (supabase as any).rpc('check_item_duplicate', {
              _provider_id: providerId, _kind: 'product', _name: row.productName, _unit: unit,
            });
            if (dup?.duplicate) {
              // já existe — usa o id existente para vincular
              createdProducts.push({ id: dup.id, name: row.productName, price });
              res.errors.push({ line: row._id, message: `Produto "${row.productName}" já existia (id ${dup.id}) — reutilizado para vínculos.` });
              continue;
            }
          } catch {}
          const { data: ins, error } = await supabase.from('dynamic_products').insert({
            product_id: nextProductId++,
            name: row.productName,
            provider: provName,
            provider_id: providerId,
            price,
            stock_type: row.productStockType === 'drop' ? 'drop' : 'fisico',
            tags,
            unit,
            quantity,
          }).select('id, name, price').single();
          if (error) {
            res.errors.push({ line: row._id, message: `Produto "${row.productName}": ${error.message}` });
          } else if (ins) {
            createdProducts.push({ id: (ins as any).id, name: (ins as any).name, price: Number((ins as any).price || 0) });
            res.productsCreated++;
          }
        }

        // STEP B — agora insere SERVIÇOS, vinculando TODOS os produtos do prestador (criados acima + pré-existentes)
        // Carrega produtos já existentes do prestador para vínculo completo
        const { data: existingProds } = await supabase
          .from('dynamic_products')
          .select('id, name, price')
          .eq('provider_id', providerId);
        const allProviderProducts = new Map<number, { name: string; price: number }>();
        (existingProds || []).forEach((p: any) => allProviderProducts.set(p.id, { name: p.name, price: Number(p.price || 0) }));
        createdProducts.forEach(p => allProviderProducts.set(p.id, { name: p.name, price: p.price }));
        const linkedIds = Array.from(allProviderProducts.keys());
        const linkedNames = linkedIds.map(id => allProviderProducts.get(id)!.name);
        const productsCost = linkedIds.reduce((s, id) => s + (allProviderProducts.get(id)?.price || 0), 0);

        for (const row of provRows) {
          if (!row.serviceName.trim()) continue;
          const labor = parseFloat(row.servicePrice) || 0;
          const totalPrice = labor + productsCost;
          const qtyRaw = parseInt(row.serviceQuantity, 10);
          const quantity = Number.isFinite(qtyRaw) && qtyRaw >= 0 ? qtyRaw : 0;
          const unit = row.serviceUnit || 'hr';
          try {
            const { data: dup } = await (supabase as any).rpc('check_item_duplicate', {
              _provider_id: providerId, _kind: 'service', _name: row.serviceName, _unit: unit,
            });
            if (dup?.duplicate) {
              res.errors.push({ line: row._id, message: `Serviço "${row.serviceName}" já existe no estoque deste prestador (id ${dup.id}). Renomeie para importar.` });
              continue;
            }
          } catch {}
          const { error } = await supabase.from('dynamic_services').insert({
            service_id: nextServiceId++,
            name: row.serviceName,
            segment: row.segment || 'Geral',
            provider: provName,
            provider_id: providerId,
            price: totalPrice,
            labor_cost: labor,
            unit,
            quantity,
            products: linkedNames,
            linked_product_ids: linkedIds,
          });
          if (error) {
            res.errors.push({ line: row._id, message: `Serviço "${row.serviceName}": ${error.message}` });
          } else {
            res.servicesCreated++;
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
    const isInfo = cellError?.severity === 'info';

    return (
      <div
        className={`cursor-pointer px-1 py-0.5 rounded text-xs min-h-[24px] flex items-center gap-1 ${
          isError
            ? 'bg-destructive/15 text-destructive ring-1 ring-destructive/30'
            : isAi
              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 ring-1 ring-purple-500/30'
              : isWarning
                ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30'
                : isInfo
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/20'
                  : 'hover:bg-muted/50'
        }`}
        onClick={() => setEditingCell({ rowId: row._id, field })}
        title={cellError?.message || (isAiField ? 'Gerado por IA — clique para editar' : undefined)}
      >
        {value || <span className="text-muted-foreground italic">—</span>}
        {isError && <AlertTriangle className="w-3 h-3 shrink-0" />}
        {isAi && <Sparkles className="w-3 h-3 shrink-0" />}
        {isWarning && !isAi && <ShieldAlert className="w-3 h-3 shrink-0" />}
        {isInfo && <Users className="w-3 h-3 shrink-0" />}
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
        {/* Import Progress Bar */}
        {importProgress && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Loader2 className={`w-4 h-4 ${importProgress.percent < 100 ? 'animate-spin' : ''} text-primary`} />
                    {importProgress.step}
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">{importProgress.percent}%</span>
                </div>
                <Progress value={importProgress.percent} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Segmentos</span>
                  <span>Prestadores</span>
                  <span>Estoque</span>
                  <span>Imagens IA</span>
                  <span>Finalização</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions row */}
        <div className="flex flex-wrap gap-3">
          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-primary" /> 1. Modelo
              </p>
              <p className="text-[10px] text-muted-foreground">
                Modelo dinâmico — sempre com todos os campos obrigatórios atuais.
              </p>
              {templateProgress && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Loader2 className={`w-3 h-3 ${templateProgress.percent < 100 ? 'animate-spin' : ''} text-primary`} />
                      {templateProgress.step}
                    </span>
                    <span className="font-mono text-muted-foreground">{templateProgress.percent}%</span>
                  </div>
                  <Progress value={templateProgress.percent} className="h-1.5" />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 mt-auto"
                onClick={handleGenerateTemplate}
                disabled={generatingTemplate}
              >
                {generatingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {generatingTemplate ? 'Gerando...' : 'Baixar Modelo'}
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

        {/* Cadastros Consolidados (entity groups) — Painel principal de revisão */}
        {rows.length > 0 && !result && (() => {
          const pendingGroups = groups.filter(g => g.matchType !== 'new' && g.confirmedAction === 'pending');
          const mergeGroups = groups.filter(g => (g.matchType !== 'new' && g.confirmedAction === 'merge'));
          const newGroups = groups.filter(g => g.matchType === 'new' || g.confirmedAction === 'create');

          const sectionMeta = [
            { key: 'pending', label: 'Aguardando sua decisão', icon: AlertTriangle, items: pendingGroups, tone: 'amber' },
            { key: 'merge',   label: 'Vincular a cadastros existentes', icon: Link2, items: mergeGroups, tone: 'blue' },
            { key: 'new',     label: 'Novos cadastros que serão criados', icon: UserPlus, items: newGroups, tone: 'emerald' },
          ] as const;

          return (
            <motion.div id="entity-groups-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={pendingGroups.length > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                    <Users className="w-4 h-4 text-primary" />
                    Cadastros detectados — {groups.length} prestador(es) único(s)
                    {mergeGroups.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-400">
                        <Link2 className="w-3 h-3 mr-1" />{mergeGroups.length} a vincular
                      </Badge>
                    )}
                    {newGroups.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                        <UserPlus className="w-3 h-3 mr-1" />{newGroups.length} a criar
                      </Badge>
                    )}
                    {pendingGroups.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        {pendingGroups.length} aguardando decisão
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">
                    Revise cada prestador. Os <strong>dados do cadastro</strong> ficam no topo (editáveis) e os <strong>itens</strong> (serviços e produtos) no rodapé. Edições no topo se aplicam a todas as linhas do mesmo prestador.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sectionMeta.filter(s => s.items.length > 0).map(section => {
                    const Icon = section.icon;
                    const toneClasses = {
                      amber: { ring: 'ring-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
                      blue: { ring: 'ring-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
                      emerald: { ring: 'ring-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
                    }[section.tone];
                    return (
                      <div key={section.key}>
                        <div className={`flex items-center gap-2 mb-2 px-2 py-1 rounded ${toneClasses.bg} ring-1 ${toneClasses.ring}`}>
                          <Icon className={`w-3.5 h-3.5 ${toneClasses.text}`} />
                          <span className={`text-[11px] font-semibold ${toneClasses.text}`}>
                            {section.label} · {section.items.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {section.items.map(g => {
                            const keyTypeLabel = { cpf: 'CPF/CNPJ', email: 'E-mail', phone: 'Telefone', name: 'Nome' }[g.keyType];
                            const isMergeBase = g.matchType !== 'new' && !!g.matchedProvider;
                            const needsDecision = isMergeBase && g.confirmedAction === 'pending';
                            const isExpanded = expandedGroupKeys.has(g.key);
                            // Take first row as the canonical provider data source
                            const headRow = g.rows[0];
                            return (
                              <div
                                key={g.key}
                                className={`rounded-lg border ${
                                  needsDecision
                                    ? 'border-amber-500/40 bg-amber-500/5'
                                    : g.confirmedAction === 'merge'
                                      ? 'border-blue-500/30 bg-blue-500/5'
                                      : 'border-emerald-500/30 bg-emerald-500/5'
                                }`}
                              >
                                {/* HEADER: provider info + decision buttons */}
                                <div className="p-3 border-b border-border/50">
                                  <div className="flex flex-wrap items-start gap-2 justify-between mb-2">
                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                      {isMergeBase ? (
                                        <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                      ) : (
                                        <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      )}
                                      <span className="text-xs font-bold text-foreground truncate max-w-[260px]">{g.providerName}</span>
                                      <Badge variant="outline" className="text-[9px] h-4">
                                        {g.rows.length} linha{g.rows.length > 1 ? 's' : ''}
                                      </Badge>
                                      <Badge variant="outline" className="text-[9px] h-4 border-blue-500/40 text-blue-600 dark:text-blue-400">
                                        chave: {keyTypeLabel}
                                      </Badge>
                                      {g.servicesCount > 0 && (
                                        <Badge variant="secondary" className="text-[9px] h-4">
                                          <Wrench className="w-2.5 h-2.5 mr-0.5" />{g.servicesCount}
                                        </Badge>
                                      )}
                                      {g.productsCount > 0 && (
                                        <Badge variant="secondary" className="text-[9px] h-4">
                                          <Package className="w-2.5 h-2.5 mr-0.5" />{g.productsCount}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {isMergeBase ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant={g.confirmedAction === 'merge' ? 'default' : 'outline'}
                                            className="h-7 text-[10px]"
                                            onClick={() => setGroupDecisions(prev => {
                                              const next = new Map(prev);
                                              next.set(g.key, { action: 'merge', providerId: g.matchedProvider!.id });
                                              return next;
                                            })}
                                          >
                                            <Link2 className="w-3 h-3 mr-1" />
                                            {g.confirmedAction === 'merge' ? '✓ Vincular' : 'Vincular ao existente'}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={g.confirmedAction === 'create' ? 'default' : 'outline'}
                                            className="h-7 text-[10px]"
                                            onClick={() => setGroupDecisions(prev => {
                                              const next = new Map(prev);
                                              next.set(g.key, { action: 'create' });
                                              return next;
                                            })}
                                          >
                                            <UserPlus className="w-3 h-3 mr-1" />
                                            {g.confirmedAction === 'create' ? '✓ Criar novo' : 'Criar novo'}
                                          </Button>
                                        </>
                                      ) : (
                                        <Badge variant="outline" className="text-[9px] h-5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">NOVO CADASTRO</Badge>
                                      )}
                                    </div>
                                  </div>

                                  {isMergeBase && g.matchedProvider && (
                                    <div className="text-[10px] text-muted-foreground mb-2 px-2 py-1 rounded bg-blue-500/5 border border-blue-500/20">
                                      ↳ Coincide com cadastro existente: <span className="font-medium text-foreground">{g.matchedProvider.name}</span>
                                      {g.matchedProvider.email && <> · {g.matchedProvider.email}</>}
                                      {g.matchedProvider.cpf_cnpj && <> · {g.matchedProvider.cpf_cnpj}</>}
                                    </div>
                                  )}

                                  {/* Editable provider fields (apply to ALL rows of this group) */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Nome do prestador</label>
                                      <Input
                                        value={headRow.providerName}
                                        onChange={(e) => updateGroupField(g.key, 'providerName', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="Nome"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">CPF / CNPJ</label>
                                      <Input
                                        value={headRow.cpfCnpj}
                                        onChange={(e) => updateGroupField(g.key, 'cpfCnpj', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="000.000.000-00 ou ISENTO"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">E-mail</label>
                                      <Input
                                        value={headRow.email}
                                        onChange={(e) => updateGroupField(g.key, 'email', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="contato@exemplo.com"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Telefone</label>
                                      <Input
                                        value={headRow.phone}
                                        onChange={(e) => updateGroupField(g.key, 'phone', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="(00) 00000-0000"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Cidade</label>
                                      <Input
                                        value={headRow.city}
                                        onChange={(e) => updateGroupField(g.key, 'city', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="Cidade"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">Segmento principal</label>
                                      <Input
                                        value={headRow.segment}
                                        onChange={(e) => updateGroupField(g.key, 'segment', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="Ex: Saúde, Automotivo"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* FOOTER: items (services + products) per row, editable */}
                                <div className="p-2">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedGroupKeys(prev => {
                                      const next = new Set(prev);
                                      if (next.has(g.key)) next.delete(g.key); else next.add(g.key);
                                      return next;
                                    })}
                                    className="w-full flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                                  >
                                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    Itens do estoque ({g.servicesCount} serviço{g.servicesCount !== 1 ? 's' : ''} + {g.productsCount} produto{g.productsCount !== 1 ? 's' : ''})
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-2 space-y-1.5">
                                      {g.rows.map((r, idx) => (
                                        <div key={r._id} className="grid grid-cols-12 gap-1 items-center px-2 py-1 rounded bg-background/50 border border-border/40">
                                          <span className="col-span-1 text-[9px] text-muted-foreground">L{r._id}</span>
                                          {/* Service */}
                                          <div className="col-span-5 flex items-center gap-1">
                                            <Wrench className="w-3 h-3 text-blue-500 shrink-0" />
                                            <Input
                                              value={r.serviceName}
                                              onChange={(e) => updateCell(r._id, 'serviceName', e.target.value)}
                                              className="h-6 text-[10px] flex-1"
                                              placeholder="Serviço"
                                            />
                                            <Input
                                              value={r.servicePrice}
                                              onChange={(e) => updateCell(r._id, 'servicePrice', e.target.value)}
                                              className="h-6 text-[10px] w-16"
                                              placeholder="R$"
                                            />
                                          </div>
                                          {/* Product */}
                                          <div className="col-span-5 flex items-center gap-1">
                                            <Package className="w-3 h-3 text-amber-500 shrink-0" />
                                            <Input
                                              value={r.productName}
                                              onChange={(e) => updateCell(r._id, 'productName', e.target.value)}
                                              className="h-6 text-[10px] flex-1"
                                              placeholder="Produto"
                                            />
                                            <Input
                                              value={r.productPrice}
                                              onChange={(e) => updateCell(r._id, 'productPrice', e.target.value)}
                                              className="h-6 text-[10px] w-16"
                                              placeholder="R$"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removeRow(r._id)}
                                            className="col-span-1 h-6 w-6 rounded hover:bg-destructive/10 text-destructive flex items-center justify-center"
                                            title="Remover linha"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

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
                <div
                  className="border rounded-md import-preview-scroll"
                  style={{
                    overflow: 'scroll',
                    maxHeight: '50vh',
                    scrollbarGutter: 'stable both-edges',
                  }}
                >
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
                            row._aiFields && row._aiFields.size > 0
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

      {/* Provider Deduplication Modal */}
      <Dialog open={showDedupModal} onOpenChange={setShowDedupModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Prestadores Coincidentes
            </DialogTitle>
            <DialogDescription>
              Encontramos prestadores na planilha que podem já existir na base de dados. 
              Confirme se deseja vincular a um existente ou criar um novo registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dedupPending.map((item) => (
              <Card key={item.providerName} className={`${item.resolved ? 'border-green-500/40 bg-green-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">📋 {item.providerName}</p>
                      <p className="text-[10px] text-muted-foreground">Planilha</p>
                    </div>
                    {item.resolved && (
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                        ✓ Resolvido
                      </Badge>
                    )}
                  </div>
                  
                  {!item.resolved && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground">Coincidências encontradas:</p>
                      <div className="space-y-2">
                        {item.matches.map((match) => (
                          <div key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">{match.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {match.email && `📧 ${match.email}`}
                                {match.phone && ` 📱 ${match.phone}`}
                                {match.cpf_cnpj && ` 📄 ${match.cpf_cnpj}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Segmentos: {(match.segment || []).join(', ')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 ml-2 text-xs"
                              onClick={() => resolveDedupAsExisting(item.providerName, match)}
                            >
                              Vincular
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => resolveDedupAsNew(item.providerName)}
                      >
                        Criar como novo prestador
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={dedupPending.some(d => !d.resolved)}
              onClick={() => setShowDedupModal(false)}
            >
              {dedupPending.some(d => !d.resolved)
                ? `${dedupPending.filter(d => !d.resolved).length} pendente(s)`
                : 'Confirmar e Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportPage;
