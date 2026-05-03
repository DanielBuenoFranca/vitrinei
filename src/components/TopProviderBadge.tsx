import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Selo [Melhor Prestador] — exibido em listas/cards quando providers.is_top_provider = true.
 * Visual compacto, 3D-ish (gradiente + glow), pode ser usado inline ao lado do nome ou logo.
 */
export function TopProviderBadge({
  active,
  size = 'sm',
  label = 'Melhor Prestador',
  className,
}: {
  active?: boolean;
  size?: 'xs' | 'sm' | 'md';
  label?: string;
  className?: string;
}) {
  if (!active) return null;
  const sizes = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  } as const;
  const icon = { xs: 'w-2.5 h-2.5', sm: 'w-3 h-3', md: 'w-3.5 h-3.5' } as const;
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center rounded-full font-bold whitespace-nowrap',
        'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-amber-950',
        'shadow-[0_2px_8px_-2px_rgba(245,158,11,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]',
        'ring-1 ring-amber-300/60',
        sizes[size],
        className,
      )}
    >
      <Crown className={cn(icon[size], 'fill-amber-700/40')} />
      {label}
    </span>
  );
}
