import { Heart } from 'lucide-react';
import { useFavorites, type FavoriteKind } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface Props {
  kind: FavoriteKind;
  id: string | number;
  name: string;
  slug?: string;
  image?: string | null;
  provider?: string;
  className?: string;
  size?: number;
  stop?: boolean;
}

export function FavoriteButton({
  kind, id, name, slug, image, provider,
  className, size = 14, stop = true,
}: Props) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(kind, id);
  return (
    <button
      type="button"
      onClick={(e) => {
        if (stop) { e.stopPropagation(); e.preventDefault(); }
        toggle({ kind, id, name, slug, image, provider });
      }}
      aria-label={active ? `Remover ${name} dos favoritos` : `Favoritar ${name}`}
      title={active ? 'Remover dos favoritos' : 'Favoritar'}
      className={cn(
        'rounded-full bg-black/65 backdrop-blur p-1.5 border border-white/15 hover:border-white/40 transition-all hover:scale-110 active:scale-95',
        className,
      )}
    >
      <Heart
        size={size}
        className={cn(
          'transition-colors',
          active ? 'text-rose-400 fill-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]' : 'text-white/85',
        )}
        strokeWidth={2}
      />
    </button>
  );
}
