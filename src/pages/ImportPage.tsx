import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { reloadDynamicEntries } from '@/data/searchData';

interface ParsedRow {
  providerName: string;
  segment: string;
  serviceName?: string;
  servicePrice?: number;
  productName?: string;
  productPrice?: number;
  productStockType?: string;
  phone?: string;
  email?: string;
  city?: string;
  [key: string]: any;
}

interface ImportResult {
  providersCreated: number;
  providersLinked: number;
  servicesCreated: number;
  productsCreated: number;
  errors: string[];
}

const ImportPage = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

      if (json.length === 0) { toast.error('Planilha vazia'); return; }

      const rawHeaders = Object.keys(json[0]);
      setHeaders(rawHeaders);

      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      const findCol = (patterns: string[]) => rawHeaders.find(h => patterns.some(p => normalize(h).includes(p)));
      const providerCol = findCol(['prestador', 'provider', 'nome', 'name', 'profissional']);
      const segmentCol = findCol(['segmento', 'segment', 'categoria', 'area']);
      const serviceCol = findCol(['servico', 'service', 'serviço']);
      const servicePriceCol = findCol(['preco_servico', 'preço_serviço', 'service_price', 'valor_servico']);
      const productCol = findCol(['produto', 'product']);
      const productPriceCol = findCol(['preco_produto', 'preço_produto', 'product_price', 'valor_produto']);
      const stockCol = findCol(['estoque', 'stock', 'tipo_estoque']);
      const phoneCol = findCol(['telefone', 'phone', 'cel']);
      const emailCol = findCol(['email', 'e-mail']);
      const cityCol = findCol(['cidade', 'city']);

      const rows: ParsedRow[] = json.map((row: any) => ({
        providerName: row[providerCol || ''] || '',
        segment: row[segmentCol || ''] || 'Geral',
        serviceName: row[serviceCol || ''] || undefined,
        servicePrice: servicePriceCol ? parseFloat(row[servicePriceCol]) || 0 : undefined,
        productName: row[productCol || ''] || undefined,
        productPrice: productPriceCol ? parseFloat(row[productPriceCol]) || 0 : undefined,
        productStockType: row[stockCol || ''] || 'fisico',
        phone: row[phoneCol || ''] || undefined,
        email: row[emailCol || ''] || undefined,
        city: row[cityCol || ''] || undefined,
      })).filter((r: ParsedRow) => r.providerName);

      setParsedData(rows);
      toast.success(`${rows.length} linhas encontradas`);
    } catch (err: any) {
      toast.error('Erro ao ler planilha: ' + err.message);
    }
  };

  const executeImport = async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    const res: ImportResult = { providersCreated: 0, providersLinked: 0, servicesCreated: 0, productsCreated: 0, errors: [] };

    // Get existing providers
    const { data: existingProviders } = await supabase.from('providers').select('id, name');
    const provMap = new Map<string, number>();
    (existingProviders || []).forEach((p: any) => provMap.set(p.name.toLowerCase().split(' ')[0], p.id));

    // Get max IDs for service_id and product_id
    const { data: maxSvc } = await supabase.from('dynamic_services').select('service_id').order('service_id', { ascending: false }).limit(1);
    const { data: maxProd } = await supabase.from('dynamic_products').select('product_id').order('product_id', { ascending: false }).limit(1);
    let nextServiceId = ((maxSvc?.[0]?.service_id) || 2000) + 1;
    let nextProductId = ((maxProd?.[0]?.product_id) || 2000) + 1;

    // Group by provider
    const byProvider = new Map<string, ParsedRow[]>();
    parsedData.forEach(row => {
      const key = row.providerName;
      if (!byProvider.has(key)) byProvider.set(key, []);
      byProvider.get(key)!.push(row);
    });

    for (const [provName, rows] of byProvider) {
      let providerId: number;
      const firstName = provName.toLowerCase().split(' ')[0];
      const existingId = provMap.get(firstName);

      if (existingId) {
        providerId = existingId;
        res.providersLinked++;
      } else {
        const firstRow = rows[0];
        const { data: newProv, error } = await supabase.from('providers').insert({
          name: provName,
          segment: [firstRow.segment || 'Geral'],
          type: 'mei',
          phone: firstRow.phone || '',
          email: firstRow.email || '',
          city: firstRow.city || '',
        }).select().single();
        if (error || !newProv) { res.errors.push(`Erro ao criar ${provName}: ${error?.message}`); continue; }
        providerId = (newProv as any).id;
        provMap.set(firstName, providerId);
        res.providersCreated++;
      }

      // Create services and products
      for (const row of rows) {
        if (row.serviceName) {
          const { error } = await supabase.from('dynamic_services').insert({
            service_id: nextServiceId++,
            name: row.serviceName,
            segment: row.segment || 'Geral',
            provider: provName,
            provider_id: providerId,
            price: row.servicePrice || 0,
          });
          if (error) res.errors.push(`Serviço ${row.serviceName}: ${error.message}`);
          else res.servicesCreated++;
        }
        if (row.productName) {
          const { error } = await supabase.from('dynamic_products').insert({
            product_id: nextProductId++,
            name: row.productName,
            provider: provName,
            provider_id: providerId,
            price: row.productPrice || 0,
            stock_type: (row.productStockType || 'fisico').toLowerCase().includes('drop') ? 'drop' : 'fisico',
          });
          if (error) res.errors.push(`Produto ${row.productName}: ${error.message}`);
          else res.productsCreated++;
        }
      }
    }

    await reloadDynamicEntries();
    setResult(res);
    setImporting(false);
    toast.success('Importação concluída!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center h-14 px-4 gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">Importação de Planilha</span>
        </div>
      </nav>

      <div className="pt-20 px-4 container mx-auto max-w-3xl space-y-4">
        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Upload className="w-4 h-4" /> Selecionar Planilha</CardTitle>
            <CardDescription className="text-xs">
              Faça upload de um arquivo Excel (.xlsx). O sistema identifica automaticamente as colunas por nome (Prestador, Segmento, Serviço, Produto, Preço, etc.).
              O primeiro nome do prestador é usado como chave de vinculação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" className="w-full gap-2 h-20 border-dashed" onClick={() => fileRef.current?.click()}>
              <Upload className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm font-medium">{fileName || 'Clique para selecionar'}</p>
                <p className="text-xs text-muted-foreground">Excel (.xlsx, .xls) ou CSV</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        {parsedData.length > 0 && !result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Preview ({parsedData.length} linhas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Prestador</TableHead>
                        <TableHead className="text-xs">Segmento</TableHead>
                        <TableHead className="text-xs">Serviço</TableHead>
                        <TableHead className="text-xs">Produto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{row.providerName}</TableCell>
                          <TableCell className="text-xs">{row.segment}</TableCell>
                          <TableCell className="text-xs">{row.serviceName || '-'}</TableCell>
                          <TableCell className="text-xs">{row.productName || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 10 && <p className="text-xs text-muted-foreground text-center py-2">... e mais {parsedData.length - 10} linhas</p>}
                </div>
                <Button className="w-full mt-4 gap-2" onClick={executeImport} disabled={importing}>
                  {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</> : <><Upload className="w-4 h-4" /> Importar {parsedData.length} linhas</>}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Resultado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{result.providersCreated}</p>
                    <p className="text-xs text-muted-foreground">Prestadores criados</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{result.providersLinked}</p>
                    <p className="text-xs text-muted-foreground">Prestadores vinculados</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{result.servicesCreated}</p>
                    <p className="text-xs text-muted-foreground">Serviços criados</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{result.productsCreated}</p>
                    <p className="text-xs text-muted-foreground">Produtos criados</p>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> {result.errors.length} erro(s)</p>
                    {result.errors.slice(0, 5).map((err, i) => <p key={i} className="text-[10px] text-destructive/80">{err}</p>)}
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={() => { setParsedData([]); setResult(null); setFileName(''); }}>
                  Nova Importação
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
