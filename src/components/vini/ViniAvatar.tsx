/* ──────────────────────────────────────────────────────────
   ViniAvatar — DOM hit-area overlay
   The avatar is now rendered inside the 3D Canvas (ViniScene).
   This component provides only the clickable region centered
   over the 3D avatar, plus an optional soft halo for depth.
   ────────────────────────────────────────────────────────── */
import { motion } from 'framer-motion';

interface ViniAvatarProps {
  onClick?: () => void;
  size?: number; // px — must match the visual footprint of the 3D avatar
}

export function ViniAvatar({ onClick, size = 320 }: ViniAvatarProps) {
  return (
    <motion.div
      onClick={onClick}
      role="button"
      aria-label="Falar com o Vini"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      className="relative cursor-pointer select-none outline-none"
      style={{ width: size, height: size }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Soft halo to integrate the 3D avatar with the DOM UI layer */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 55%, hsl(var(--vini-glow) / 0.18), transparent 65%)',
          filter: 'blur(14px)',
        }}
      />
    </motion.button>
  );
}
