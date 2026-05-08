import { useNavigate } from 'react-router-dom';
import { Heart, Store, Wrench, Package, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const KIND_META: Record<string, { icon: any; label: string; color: string }> = {
  provider: { icon: Store,   label: 'Loja',     color: 'text-violet-300' },
  service:  { icon: Wrench,  label: 'Serviço',  color: 'text-sky-300' },
  product:  { icon: Package, label: 'Produto',  color: 'text-emerald-300' },
};

export function FavoritesModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { favorites, remove, clear } = useFavorites();

  const openItem = (item: typeof favorites[number]) => {
    onOpenChange(false);
    if (item.kind === 'provider' && item.slug) {
      navigate(`/loja/${item.slug}`);
      return;
    }
    // service/product — abre /buscar com filtro pré-aplicado
    const params = new URLSearchParams();
    params.set('q', item.name);
    params.set('type', item.kind === 'service' ? 'service' : 'product');
    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black border-rose-500/20">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            Favoritos
            <span className="text-xs text-white/50 font-normal">({favorites.length})</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-white/55">
            Toque para abrir a loja ou ver o item na busca.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-3 space-y-2">
          {favorites.length === 0 ? (
            <div className="py-10 text-center text-sm text-white/55">
              <Heart className="w-8 h-8 mx-auto mb-2 text-white/20" />
              Nenhum favorito ainda.
              <p className="text-[11px] text-white/40 mt-1">Toque no ❤ ao lado de um item ou prestador.</p>
            </div>
          ) : favorites.map((f) => {
            const meta = KIND_META[f.kind];
            const Icon = meta.icon;
            return (
              <div
                key={`${f.kind}-${f.id}`}
                className="flex items-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 p-2 transition-all"
              >
                <button onClick={() => openItem(f)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                    {f.image ? (
                      <img src={f.image} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{f.name}</p>
                    <p className="text-[10px] text-white/50 truncate">
                      <span className={meta.color}>{meta.label}</span>
                      {f.provider && f.kind !== 'provider' ? ` · ${f.provider}` : ''}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => remove(f.kind, f.id)}
                  className="shrink-0 p-1.5 rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                  aria-label="Remover"
                  title="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {favorites.length > 0 && (
          <div className="px-3 py-2 border-t border-white/10 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-white/60 hover:text-rose-400 hover:bg-rose-500/10 text-xs h-7"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Limpar tudo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
