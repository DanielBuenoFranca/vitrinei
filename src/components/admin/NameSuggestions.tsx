import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';

interface NameSuggestionsProps {
  suggestions: { suggestions: string[]; duplicate: boolean; match?: string } | null;
  loading: boolean;
  onSelect: (name: string) => void;
}

export function NameSuggestions({ suggestions, loading, onSelect }: NameSuggestionsProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Analisando padronização...</span>
      </div>
    );
  }

  if (!suggestions || suggestions.suggestions.length === 0) return null;

  return (
    <div className="mt-1 space-y-1">
      {suggestions.duplicate && (
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          <span>Cadastro similar encontrado: <strong>{suggestions.match}</strong></span>
        </div>
      )}
      <div className="flex items-center gap-1 flex-wrap">
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-[11px] text-muted-foreground">Sugestões:</span>
        {suggestions.suggestions.map((s, i) => (
          <Badge
            key={i}
            variant="outline"
            className="cursor-pointer hover:bg-primary/10 text-[11px] transition-colors"
            onClick={() => onSelect(s)}
          >
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}
