import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import officeBg from '@/assets/office-bg.png';
import viniAvatar from '@/assets/vini-avatar.png';

/* ──────────────────────────────────────────────────────────
   Pointer parallax (mouse / gyro) with elastic lerp
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
   Layer 0 — Background (futuristic office)
   parallax intensity 0.05
   ────────────────────────────────────────────────────────── */
function BackgroundPlane({ pointer }: { pointer: ReturnType<typeof usePointer> }) {
  const tex = useLoader(THREE.TextureLoader, officeBg);
  const ref = useRef<THREE.Mesh>(null);
  const { camera, size: viewSize } = useThree();
  const Z = -3; // background depth

  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
  }, [tex]);

  // Compute plane dimensions to fully COVER the viewport (no distortion, no empty space).
  // Visible height at depth Z = 2 * tan(fov/2) * |cameraZ - Z|; add a small overscan for parallax.
  const dims = useMemo(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const dist = Math.abs(persp.position.z - Z);
    const visibleH = 2 * Math.tan((persp.fov * Math.PI) / 360) * dist;
    const screenAspect = viewSize.width / viewSize.height;
    const visibleW = visibleH * screenAspect;
    const overscan = 1.18; // headroom for parallax shift

    const img = tex.image as HTMLImageElement | undefined;
    const imgAspect = img && img.width ? img.width / img.height : 16 / 9;

    // COVER fit: plane >= screen, preserving image aspect (no stretch)
    let planeW = visibleW * overscan;
    let planeH = planeW / imgAspect;
    if (planeH < visibleH * overscan) {
      planeH = visibleH * overscan;
      planeW = planeH * imgAspect;
    }
    return { planeW, planeH };
  }, [tex, camera, viewSize.width, viewSize.height]);

  useFrame(() => {
    if (!ref.current) return;
    // subtle parallax (intensity 0.05) — overscan ensures no edge ever shows
    ref.current.position.x = THREE.MathUtils.lerp(
      ref.current.position.x,
      pointer.smooth.current.x * 0.25,
      0.06
    );
    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y,
      pointer.smooth.current.y * 0.18,
      0.06
    );
  });

  return (
    <mesh ref={ref} position={[0, 0, Z]}>
      <planeGeometry args={[dims.planeW, dims.planeH]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/* ──────────────────────────────────────────────────────────
   Layer 0.5 — Glass refraction panel (left side)
   ────────────────────────────────────────────────────────── */
function StocksGlassPanel() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = -0.2 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
  });
  return (
    <mesh ref={ref} position={[-2.6, -0.2, -1.2]} rotation={[0, 0.18, 0]}>
      <boxGeometry args={[1.4, 2.2, 0.08]} />
      <MeshTransmissionMaterial
        ior={1.5}
        transmission={1}
        chromaticAberration={0.06}
        roughness={0.05}
        thickness={0.4}
        backside
        samples={6}
        anisotropy={0.2}
        distortion={0.1}
        distortionScale={0.2}
        color="#cffafe"
      />
    </mesh>
  );
}

/* ──────────────────────────────────────────────────────────
   Layer 1 — Vini avatar plane (centered, levitating)
   parallax intensity 0.15
   ────────────────────────────────────────────────────────── */
function ViniAvatarPlane({
  pointer,
  isMobile,
}: {
  pointer: ReturnType<typeof usePointer>;
  isMobile: boolean;
}) {
  const tex = useLoader(THREE.TextureLoader, viniAvatar);
  const ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.premultiplyAlpha = false;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }, [tex]);

  useFrame((state) => {
    if (!ref.current) return;
    // Parallax intensity 0.15 (3x background) + organic levitation
    const targetX = pointer.smooth.current.x * 0.45;
    const float = Math.sin(state.clock.elapsedTime * 2) * 0.08;
    const targetY = pointer.smooth.current.y * 0.25 + float;

    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.06);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.08);

    // tilt towards pointer
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      pointer.smooth.current.x * 0.18,
      0.06
    );
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      -pointer.smooth.current.y * 0.12,
      0.06
    );

    // breathing pulse on backlight
    if (lightRef.current) {
      lightRef.current.intensity = 2.4 + Math.sin(state.clock.elapsedTime * 1.6) * 0.6;
    }
  });

  // Sized to sit perfectly inside the holographic rings of the office background
  const size: [number, number] = isMobile ? [1.7, 1.7] : [2.2, 2.2];
  // The rings of the office bg are slightly below screen center → offset Y down
  const baseY = isMobile ? -0.35 : -0.45;

  return (
    <group position={[0, baseY, 0.5]}>
      {/* Cyan portal backlight on Vini's back — emerges from the rings */}
      <pointLight
        ref={lightRef}
        position={[0, 0.1, -0.8]}
        intensity={2.6}
        color="#22d3ee"
        distance={5}
        decay={2}
      />
      <mesh ref={ref} renderOrder={10}>
        <planeGeometry args={size} />
        <meshBasicMaterial
          map={tex}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   Scene content
   ────────────────────────────────────────────────────────── */
function SceneContent({ isMobile }: { isMobile: boolean }) {
  const pointer = usePointer();

  // Smooth pointer once per frame (shared across consumers)
  useFrame(() => {
    pointer.smooth.current.x = THREE.MathUtils.lerp(
      pointer.smooth.current.x,
      pointer.target.current.x,
      0.05
    );
    pointer.smooth.current.y = THREE.MathUtils.lerp(
      pointer.smooth.current.y,
      pointer.target.current.y,
      0.05
    );
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color="#ffffff" />
      <BackgroundPlane pointer={pointer} />
      <ViniAvatarPlane pointer={pointer} isMobile={isMobile} />
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Public Canvas wrapper
   ────────────────────────────────────────────────────────── */
export function ViniScene() {
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const handler = () => setReduced(m.matches);
    m.addEventListener?.('change', handler);

    const mob = window.matchMedia('(max-width: 640px)');
    setIsMobile(mob.matches);
    const mobHandler = () => setIsMobile(mob.matches);
    mob.addEventListener?.('change', mobHandler);

    return () => {
      m.removeEventListener?.('change', handler);
      mob.removeEventListener?.('change', mobHandler);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 5], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#0B0E14']} />
          <fog attach="fog" args={['#0B0E14', 9, 22]} />
          <SceneContent isMobile={isMobile} />
          <EffectComposer>
            <Bloom
              intensity={0.9}
              luminanceThreshold={0.85}
              luminanceSmoothing={0.2}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
