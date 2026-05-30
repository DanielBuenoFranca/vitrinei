import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const CrmPanel = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar solicitações do CRM');
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    
    // Subscribe to changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes' as any, { event: '*', table: 'support_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('support_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Status atualizado');
      fetchRequests();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Em Atendimento</Badge>;
      case 'resolved': return <Badge variant="outline" className="bg-green-100 text-green-800">Resolvido</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const modifier = sortConfig.direction === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    
    return (aVal < bVal ? -1 : 1) * modifier;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>CRM - Solicitações de Itens Não Encontrados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('created_at')}>
                <div className="flex items-center">Data <SortIcon column="created_at" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('requested_item')}>
                <div className="flex items-center">Item Solicitado <SortIcon column="requested_item" /></div>
              </TableHead>
              <TableHead>Contexto (Análise Vini)</TableHead>
              <TableHead>Explicação do Cliente</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                <div className="flex items-center">Status <SortIcon column="status" /></div>
              </TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {req.created_at ? format(new Date(req.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                </TableCell>
                <TableCell className="font-medium">{req.requested_item || req.query}</TableCell>
                <TableCell className="max-w-[200px] text-xs">
                  {req.context_analysis || (req.context_analyzed && (
                    <div className="space-y-1">
                      {req.context_analyzed.analyzed_intent && (
                        <div><span className="font-bold opacity-60">Intenção:</span> {req.context_analyzed.analyzed_intent}</div>
                      )}
                      {req.context_analyzed.tags?.length > 0 && (
                        <div><span className="font-bold opacity-60">Tags:</span> {req.context_analyzed.tags.join(', ')}</div>
                      )}
                    </div>
                  )) || <span className="text-muted-foreground italic">Sem análise</span>}
                </TableCell>
                <TableCell className="max-w-xs text-sm italic">
                  {req.explanation || req.details || <span className="text-muted-foreground">Sem explicação</span>}
                </TableCell>
                <TableCell>{getStatusBadge(req.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {req.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(req.id, 'in_progress')}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Atender
                      </button>
                    )}
                    {req.status !== 'resolved' && (
                      <button 
                        onClick={() => updateStatus(req.id, 'resolved')}
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Resolver
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação encontrada no momento.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
