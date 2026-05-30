import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Pencil, Trash2, ArrowRight, Loader2, Sparkles, ShieldOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Provider {
  id: number; name: string; type: string; segment: string[];
  phone: string | null; email: string | null; address: string | null; city: string | null;
  distance: string; rating: number; active: boolean; cpf_cnpj: string | null;
  created_at: string;
  user_id?: string | null;
}

interface DynamicService {
  id: number; service_id: number; name: string; segment: string;
  provider: string; provider_id: number | null; price: number; rating: number;
  distance: string; time: string; products: string[]; created_at: string;
  labor_cost?: number; linked_product_ids?: number[];
}

interface DynamicProduct {
  id: number; product_id: number; name: string; price: number;
  provider: string; provider_id: number | null; stock_type: string;
  rating: number; distance: string; tags: string[]; related_service_ids: number[];
  created_at: string;
}

interface Segment {
  id: number; name: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Issue {
  type: 'error' | 'warning';
  entity: 'Prestador' | 'Serviço' | 'Produto';
  entityId: number;
  entityName: string;
  message: string;
  action: 'edit' | 'delete' | 'auto_fix';
  tab: string;
  fieldName?: string;
  autoFixAction?: () => Promise<void>;
}

interface InconsistencyPanelProps {
  providers: Provider[];
  services: DynamicService[];
  products: DynamicProduct[];
  segments: Segment[];
  userRoles?: UserRole[];
  onEditProvider: (p: Provider, field?: string) => void;
  onEditService: (s: DynamicService, field?: string) => void;
  onEditProduct: (p: DynamicProduct, field?: string) => void;
  onDeleteService: (id: number) => void;
  onDeleteProduct: (id: number) => void;
  onRefresh?: () => void;
}

export function InconsistencyPanel({
  providers, services, products, segments, userRoles = [],
  onEditProvider, onEditService, onEditProduct,
  onDeleteService, onDeleteProduct, onRefresh
}: InconsistencyPanelProps) {
  const segmentNames = new Set(segments.map(s => s.name));
  const providerIds = new Set(providers.map(p => p.id));
  const providerNames = new Set(providers.map(p => p.name));

  const issues: Issue[] = [];

  // Providers without segments
  providers.forEach(p => {
    // New rule: Admins/Masters shouldn't have a personal store (provider record)
    if (p.user_id) {
      const isPrivileged = userRoles.some(r => r.user_id === p.user_id && ['admin', 'master'].includes(r.role));
      if (isPrivileged) {
        issues.push({ 
          type: 'error', 
          entity: 'Prestador', 
          entityId: p.id, 
          entityName: p.name, 
          message: 'Usuário Admin/Master não pode ter loja pessoal. Remova o vínculo de prestador.', 
          action: 'auto_fix', 
          tab: 'providers',
          fieldName: 'adminLevel',
          autoFixAction: async () => {
            const { error } = await supabase
              .from('providers')
              .update({ user_id: null })
              .eq('id', p.id);
            if (error) throw error;
            if (onRefresh) onRefresh();
          }
        });
      }
    }

    if (!p.segment || p.segment.length === 0) {
      issues.push({ 
        type: 'error', 
        entity: 'Prestador', 
        entityId: p.id, 
        entityName: p.name, 
        message: 'Sem segmento vinculado. É obrigatório selecionar ao menos um segmento.', 
        action: segments.length === 1 ? 'auto_fix' : 'edit', 
        tab: 'providers', 
        fieldName: 'segments',
        autoFixAction: segments.length === 1 ? async () => {
          const { error } = await supabase
            .from('providers')
            .update({ segment: [segments[0].name] })
            .eq('id', p.id);
          if (error) throw error;
          if (onRefresh) onRefresh();
        } : undefined
      });
    } else {
      p.segment.forEach(seg => {
        if (!segmentNames.has(seg)) {
          issues.push({ type: 'warning', entity: 'Prestador', entityId: p.id, entityName: p.name, message: `Segmento "${seg}" não existe no cadastro`, action: 'edit', tab: 'providers', fieldName: 'segments' });
        }
      });
    }
    if (!p.cpf_cnpj) {
      issues.push({ 
        type: 'warning', 
        entity: 'Prestador', 
        entityId: p.id, 
        entityName: p.name, 
        message: 'Sem CPF/CNPJ cadastrado. Marcar como ISENTO ou informar documento.', 
        action: 'auto_fix', 
        tab: 'providers', 
        fieldName: 'cpfCnpj',
        autoFixAction: async () => {
          const { error } = await supabase
            .from('providers')
            .update({ cpf_cnpj: 'ISENTO' })
            .eq('id', p.id);
          if (error) throw error;
          if (onRefresh) onRefresh();
        }
      });
    }
    if (!p.phone && !p.email) {
      issues.push({ type: 'warning', entity: 'Prestador', entityId: p.id, entityName: p.name, message: 'Sem telefone e sem email', action: 'edit', tab: 'providers', fieldName: 'phone' });
    }
  });

  // Services issues
  services.forEach(s => {
    if (!s.provider_id || !providerIds.has(s.provider_id)) {
      if (!providerNames.has(s.provider)) {
        issues.push({ type: 'error', entity: 'Serviço', entityId: s.id, entityName: s.name, message: `Prestador "${s.provider}" não encontrado na base`, action: 'edit', tab: 'services', fieldName: 'provider' });
      }
    }
    if (!s.segment) {
      issues.push({ type: 'error', entity: 'Serviço', entityId: s.id, entityName: s.name, message: 'Sem segmento definido', action: 'edit', tab: 'services', fieldName: 'segment' });
    } else if (!segmentNames.has(s.segment)) {
      issues.push({ type: 'warning', entity: 'Serviço', entityId: s.id, entityName: s.name, message: `Segmento "${s.segment}" não existe no cadastro`, action: 'edit', tab: 'services', fieldName: 'segment' });
    }
    if (s.price <= 0) {
      issues.push({ type: 'warning', entity: 'Serviço', entityId: s.id, entityName: s.name, message: 'Preço zerado ou negativo', action: 'edit', tab: 'services', fieldName: 'labor_cost' });
    }
  });

  // Products issues
  products.forEach(p => {
    if (!p.provider_id || !providerIds.has(p.provider_id)) {
      if (!providerNames.has(p.provider)) {
        issues.push({ type: 'error', entity: 'Produto', entityId: p.id, entityName: p.name, message: `Prestador "${p.provider}" não encontrado na base`, action: 'edit', tab: 'products', fieldName: 'provider' });
      }
    }
    if (!p.tags || p.tags.length === 0) {
      issues.push({ type: 'warning', entity: 'Produto', entityId: p.id, entityName: p.name, message: 'Sem tags (dificulta busca)', action: 'edit', tab: 'products', fieldName: 'tags' });
    }
    if (p.price <= 0) {
      issues.push({ type: 'warning', entity: 'Produto', entityId: p.id, entityName: p.name, message: 'Preço zerado ou negativo', action: 'edit', tab: 'products', fieldName: 'price' });
    }
  });

  // Orphan services (provider_id points to non-existent provider)
  services.forEach(s => {
    if (s.provider_id && !providerIds.has(s.provider_id)) {
      issues.push({ type: 'error', entity: 'Serviço', entityId: s.id, entityName: s.name, message: `provider_id=${s.provider_id} não existe (prestador excluído?)`, action: 'delete', tab: 'services' });
    }
  });

  // Orphan products
  products.forEach(p => {
    if (p.provider_id && !providerIds.has(p.provider_id)) {
      issues.push({ type: 'error', entity: 'Produto', entityId: p.id, entityName: p.name, message: `provider_id=${p.provider_id} não existe (prestador excluído?)`, action: 'delete', tab: 'products' });
    }
  });

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');

  const [fixingId, setFixingId] = useState<string | null>(null);

  const handleAction = async (issue: Issue) => {
    if (issue.action === 'auto_fix' && issue.autoFixAction) {
      const id = `${issue.entity}-${issue.entityId}`;
      setFixingId(id);
      try {
        await issue.autoFixAction();
        toast.success(`Correção automática aplicada para: ${issue.entityName}`);
      } catch (error: any) {
        toast.error(`Falha na correção automática: ${error.message}`);
      } finally {
        setFixingId(null);
      }
      return;
    }

    if (issue.entity === 'Prestador') {
      const p = providers.find(x => x.id === issue.entityId);
      if (p) onEditProvider(p, issue.fieldName);
    } else if (issue.entity === 'Serviço') {
      if (issue.action === 'delete') {
        onDeleteService(issue.entityId);
      } else {
        const s = services.find(x => x.id === issue.entityId);
        if (s) onEditService(s, issue.fieldName);
      }
    } else if (issue.entity === 'Produto') {
      if (issue.action === 'delete') {
        onDeleteProduct(issue.entityId);
      } else {
        const p = products.find(x => x.id === issue.entityId);
        if (p) onEditProduct(p, issue.fieldName);
      }
    }
  };

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Nenhuma inconsistência encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">Todos os relacionamentos e dados estão válidos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Inconsistências Detectadas
        </CardTitle>
        <CardDescription>
          {errors.length} erro(s) crítico(s) e {warnings.length} aviso(s) encontrados nos cadastros.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <div className="admin-scroll-area max-h-[60vh] p-6 space-y-2 border-t">
        {/* Errors first, then warnings */}
        {[...errors, ...warnings].map((issue, idx) => (
          <div
            key={`${issue.entity}-${issue.entityId}-${idx}`}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              issue.type === 'error'
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-yellow-500/30 bg-yellow-500/5'
            }`}
          >
            <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${
              issue.type === 'error' ? 'text-destructive' : 'text-yellow-500'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={issue.type === 'error' ? 'destructive' : 'secondary'} className="text-[10px]">
                  {issue.entity}
                </Badge>
                <span className="text-sm font-medium text-foreground truncate">{issue.entityName}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{issue.message}</p>
            </div>
            <Button
              variant={issue.action === 'delete' ? 'destructive' : issue.action === 'auto_fix' ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 gap-1 text-xs h-7"
              onClick={() => handleAction(issue)}
              disabled={fixingId === `${issue.entity}-${issue.entityId}`}
            >
              {fixingId === `${issue.entity}-${issue.entityId}` ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Processando</>
              ) : issue.action === 'delete' ? (
                <><Trash2 className="w-3 h-3" /> Excluir</>
              ) : issue.action === 'auto_fix' ? (
                <><Sparkles className="w-3 h-3" /> Auto-Corrigir</>
              ) : (
                <><Pencil className="w-3 h-3" /> Corrigir</>
              )}
            </Button>
          </div>
        ))}
        </div>
      </CardContent>
    </Card>
  );
}
