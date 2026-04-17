import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, MeshTransmissionMaterial, Sphere, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';

/* ──────────────────────────────────────────────────────────
   Pointer parallax (mouse / gyro) with lerp smoothing
   ────────────────────────────────────────────────────────── */
function usePointer() {
  const target = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      target.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      target.current.y = -((e.touches[0].clientY / window.innerHeight) * 2 - 1);
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      target.current.x = Math.max(-1, Math.min(1, e.gamma / 30));
      target.current.y = Math.max(-1, Math.min(1, -e.beta / 60));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('deviceorientation', onOrient);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, []);

  return { target, smooth };
}

/* ──────────────────────────────────────────────────────────
   Holographic Vini sphere — Espacial
   ────────────────────────────────────────────────────────── */
function ViniHologram({ pointer }: { pointer: ReturnType<typeof usePointer> }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    pointer.smooth.current.x = THREE.MathUtils.lerp(pointer.smooth.current.x, pointer.target.current.x, 0.05);
    pointer.smooth.current.y = THREE.MathUtils.lerp(pointer.smooth.current.y, pointer.target.current.y, 0.05);
    group.current.rotation.y = pointer.smooth.current.x * 0.35;
    group.current.rotation.x = pointer.smooth.current.y * 0.2;
    group.current.position.x = pointer.smooth.current.x * 0.25;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.12 + pointer.smooth.current.y * 0.15;
    if (inner.current) inner.current.rotation.y += delta * 0.4;
    if (ring.current) ring.current.rotation.z += delta * 0.25;
  });

  return (
    <group ref={group}>
      {/* outer aura */}
      <Sphere args={[1.35, 48, 48]}>
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} />
      </Sphere>
      {/* core sphere */}
      <Sphere ref={inner} args={[1, 64, 64]}>
        <meshPhysicalMaterial
          color="#0ea5b7"
          emissive="#22d3ee"
          emissiveIntensity={0.6}
          metalness={0.3}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transmission={0.4}
          thickness={0.8}
          ior={1.4}
        />
      </Sphere>
      {/* holographic ring */}
      <mesh ref={ring} rotation={[Math.PI / 2.2, 0, 0]} position={[0, -0.05, 0]}>
        <torusGeometry args={[1.7, 0.015, 16, 128]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0.4, 0]} position={[0, -0.02, 0]}>
        <torusGeometry args={[1.95, 0.008, 16, 128]} />
        <meshBasicMaterial color="#e879f9" transparent opacity={0.45} />
      </mesh>
      <pointLight position={[0, 0, 2]} intensity={1.2} color="#22d3ee" />
      <pointLight position={[1.5, 1, 1]} intensity={0.6} color="#e879f9" />
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   Frosted-glass Vini sphere — Comercial
   ────────────────────────────────────────────────────────── */
function ViniGlass({ pointer }: { pointer: ReturnType<typeof usePointer> }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    pointer.smooth.current.x = THREE.MathUtils.lerp(pointer.smooth.current.x, pointer.target.current.x, 0.04);
    pointer.smooth.current.y = THREE.MathUtils.lerp(pointer.smooth.current.y, pointer.target.current.y, 0.04);
    group.current.rotation.y = pointer.smooth.current.x * 0.3;
    group.current.rotation.x = pointer.smooth.current.y * 0.18;
    group.current.position.x = pointer.smooth.current.x * 0.2;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.0) * 0.1 + pointer.smooth.current.y * 0.12;
  });

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
        <Sphere args={[1.05, 96, 96]}>
          <MeshTransmissionMaterial
            backside
            samples={6}
            thickness={1.4}
            roughness={0.05}
            chromaticAberration={0.04}
            anisotropy={0.3}
            distortion={0.15}
            distortionScale={0.3}
            temporalDistortion={0.05}
            ior={1.45}
            color="#dbeafe"
            attenuationColor="#cffafe"
            attenuationDistance={1.5}
          />
        </Sphere>
      </Float>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-2, -1, 2]} intensity={0.4} color="#67e8f9" />
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   Background — parallax stars (espacial) or particles (comercial)
   ────────────────────────────────────────────────────────── */
function ParallaxBackground({ pointer }: { pointer: ReturnType<typeof usePointer> }) {
  const { theme } = useTheme();
  const starsRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!starsRef.current) return;
    // background moves slower than foreground (parallax depth)
    starsRef.current.position.x = pointer.smooth.current.x * 0.4;
    starsRef.current.position.y = pointer.smooth.current.y * 0.3;
    starsRef.current.rotation.y += 0.0003;
  });

  if (theme === 'espacial') {
    return (
      <group ref={starsRef}>
        <Stars radius={60} depth={50} count={2500} factor={3} saturation={0.4} fade speed={0.6} />
        <Sparkles count={80} scale={[14, 8, 8]} size={3} speed={0.3} color="#22d3ee" />
        <Sparkles count={40} scale={[14, 8, 8]} size={4} speed={0.2} color="#e879f9" />
      </group>
    );
  }

  return (
    <group ref={starsRef}>
      <Sparkles count={120} scale={[14, 8, 8]} size={2.5} speed={0.2} color="#94a3b8" opacity={0.6} />
      <Sparkles count={60} scale={[10, 6, 6]} size={3.5} speed={0.15} color="#67e8f9" opacity={0.5} />
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   Vini orchestrator (chooses material by theme)
   ────────────────────────────────────────────────────────── */
function ViniContent() {
  const { theme } = useTheme();
  const pointer = usePointer();

  return (
    <>
      <ParallaxBackground pointer={pointer} />
      {theme === 'espacial' ? <ViniHologram pointer={pointer} /> : <ViniGlass pointer={pointer} />}
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Public Canvas wrapper
   ────────────────────────────────────────────────────────── */
export function ViniScene() {
  const { theme } = useTheme();
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const handler = () => setReduced(m.matches);
    m.addEventListener?.('change', handler);
    return () => m.removeEventListener?.('change', handler);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          <color attach="background" args={[theme === 'espacial' ? '#0B0E14' : '#F8FAFC']} />
          <fog attach="fog" args={[theme === 'espacial' ? '#0B0E14' : '#F8FAFC', 8, 18]} />
          <ViniContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
