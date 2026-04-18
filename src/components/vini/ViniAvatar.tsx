import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import viniImg from '@/assets/vini-avatar.png';

/* ──────────────────────────────────────────────────────────
   Holographic rings around the avatar base (Three.js)
   ────────────────────────────────────────────────────────── */
function HoloRings() {
  const { theme } = useTheme();
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.4;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.6;
    if (halo.current) {
      const s = 1 + Math.sin(performance.now() * 0.002) * 0.04;
      halo.current.scale.set(s, s, s);
    }
  });

  const cyan = theme === 'espacial' ? '#22d3ee' : '#94a3b8';
  const magenta = theme === 'espacial' ? '#e879f9' : '#cbd5e1';

  return (
    <group position={[0, -1.05, 0]} rotation={[Math.PI / 2.1, 0, 0]}>
      {/* outer halo glow */}
      <mesh ref={halo}>
        <ringGeometry args={[1.05, 1.55, 64]} />
        <meshBasicMaterial color={cyan} transparent opacity={theme === 'espacial' ? 0.18 : 0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* ring 1 — cyan */}
      <mesh ref={ring1}>
        <torusGeometry args={[1.15, 0.022, 16, 128]} />
        <meshBasicMaterial color={cyan} transparent opacity={theme === 'espacial' ? 0.95 : 0.6} />
      </mesh>
      {/* ring 2 — magenta / silver */}
      <mesh ref={ring2} position={[0, 0, 0.05]}>
        <torusGeometry args={[1.32, 0.014, 16, 128]} />
        <meshBasicMaterial color={magenta} transparent opacity={theme === 'espacial' ? 0.85 : 0.45} />
      </mesh>
      {/* lights */}
      <pointLight position={[0, 0.5, 1.5]} intensity={1} color={cyan} />
      <pointLight position={[1, 0.5, 0.5]} intensity={0.5} color={magenta} />
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   ViniAvatar — image + 3D rings + tilt + float
   ────────────────────────────────────────────────────────── */
interface ViniAvatarProps {
  onClick?: () => void;
  size?: number; // px
}

export function ViniAvatar({ onClick, size = 280 }: ViniAvatarProps) {
  const { theme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Tilt towards mouse / touch
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      const r = wrapperRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      setTilt({ x: Math.max(-1, Math.min(1, dx)) * 8, y: Math.max(-1, Math.min(1, dy)) * 6 });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <motion.div
      ref={wrapperRef}
      onClick={onClick}
      role="button"
      aria-label="Falar com o Vini"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      className="relative cursor-pointer select-none outline-none"
      style={{ width: size, height: size, perspective: 800 }}
      // Float vertical + leve balanço lateral (vivo, não robótico)
      animate={{ y: [0, -10, 0, -6, 0], rotate: [0, 1.2, 0, -1.2, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.04 }}
    >
      {/* Pulsing glow halo (breathing light) */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            theme === 'espacial'
              ? 'radial-gradient(circle at 50% 55%, hsl(var(--vini-glow) / 0.45), transparent 65%)'
              : 'radial-gradient(circle at 50% 55%, hsl(var(--vini-glow) / 0.25), transparent 70%)',
          filter: 'blur(12px)',
        }}
        animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Holographic rings (3D, behind avatar) */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas
          dpr={[1, 1.6]}
          camera={{ position: [0, 0, 3.2], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <HoloRings />
          </Suspense>
        </Canvas>
      </div>

      {/* Floating sparkle particles around the avatar */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {[
          { left: '12%', top: '22%', delay: 0, dur: 4.2, color: 'hsl(190 95% 65%)' },
          { left: '85%', top: '30%', delay: 0.8, dur: 5.0, color: 'hsl(295 85% 70%)' },
          { left: '78%', top: '70%', delay: 1.6, dur: 4.6, color: 'hsl(190 95% 65%)' },
          { left: '18%', top: '78%', delay: 2.2, dur: 5.4, color: 'hsl(295 85% 70%)' },
          { left: '50%', top: '8%', delay: 1.2, dur: 4.0, color: 'hsl(190 95% 75%)' },
        ].map((p, i) => (
          <motion.span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: p.left,
              top: p.top,
              background: p.color,
              boxShadow: `0 0 8px ${p.color}`,
              opacity: theme === 'espacial' ? 1 : 0.55,
            }}
            animate={{
              y: [0, -14, 0],
              opacity: [0, 1, 0],
              scale: [0.6, 1.2, 0.6],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Avatar PNG — breathing scale + parallax tilt towards mouse */}
      <motion.img
        src={viniImg}
        alt="Vini — assistente Vitrinei"
        width={1024}
        height={1024}
        loading="eager"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          filter:
            theme === 'espacial'
              ? 'drop-shadow(0 0 28px hsl(var(--vini-glow) / 0.6)) drop-shadow(0 0 10px hsl(var(--vini-glow) / 0.45))'
              : 'drop-shadow(0 8px 22px hsl(var(--vini-glow) / 0.3))',
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateY: tilt.x,
          rotateX: -tilt.y,
          scale: [1, 1.025, 1], // respiração
        }}
        transition={{
          rotateY: { type: 'spring', stiffness: 80, damping: 15 },
          rotateX: { type: 'spring', stiffness: 80, damping: 15 },
          scale: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Subtle holographic shimmer sweeping across the avatar */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-screen rounded-[40%]"
        style={{
          background:
            'linear-gradient(115deg, transparent 30%, hsl(var(--vini-glow) / 0.18) 50%, transparent 70%)',
          opacity: theme === 'espacial' ? 0.55 : 0.3,
        }}
        animate={{ backgroundPositionX: ['-150%', '150%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />
    </motion.div>
  );
}

