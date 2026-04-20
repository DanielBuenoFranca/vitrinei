import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
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
   ────────────────────────────────────────────────────────── */
function BackgroundPlane({ pointer }: { pointer: ReturnType<typeof usePointer> }) {
  const tex = useLoader(THREE.TextureLoader, officeBg);
  const ref = useRef<THREE.Mesh>(null);
  const { camera, size: viewSize } = useThree();
  const Z = -3;

  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
  }, [tex]);

  const dims = useMemo(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const dist = Math.abs(persp.position.z - Z);
    const visibleH = 2 * Math.tan((persp.fov * Math.PI) / 360) * dist;
    const screenAspect = viewSize.width / viewSize.height;
    const visibleW = visibleH * screenAspect;
    const overscan = 1.18;

    const img = tex.image as HTMLImageElement | undefined;
    const imgAspect = img && img.width ? img.width / img.height : 16 / 9;

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
   Holographic light source — pulses with avatar movement
   ────────────────────────────────────────────────────────── */
function HolographicCore({
  avatarBreath,
  emotion,
}: {
  avatarBreath: React.MutableRefObject<number>;
  emotion: React.MutableRefObject<EmotionState>;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = avatarBreath.current; // 0..1 normalized float
    const emo = emotion.current;
    // Color shifts by emotion
    let color = new THREE.Color('#22d3ee'); // happy/idle = cyan
    if (emo === 'sad') color = new THREE.Color('#3b82f6');
    else if (emo === 'angry') color = new THREE.Color('#ef4444');
    else if (emo === 'thinking') color = new THREE.Color('#a855f7');
    else if (emo === 'listening') color = new THREE.Color('#10b981');

    if (lightRef.current) {
      lightRef.current.color = color;
      lightRef.current.intensity = 3.5 + Math.sin(t * 2.2) * 0.6 + breath * 1.5;
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.color = color;
      mat.opacity = 0.18 + Math.sin(t * 1.6) * 0.06 + breath * 0.12;
      const s = 1 + Math.sin(t * 1.2) * 0.05 + breath * 0.1;
      haloRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[0, -0.55, -0.6]}>
      <pointLight ref={lightRef} position={[0, 0.2, 0.4]} intensity={3.5} distance={7} decay={2} />
      <mesh ref={haloRef} position={[0, 0, 0]}>
        <ringGeometry args={[0.55, 0.95, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   Emotion state shared via refs
   ────────────────────────────────────────────────────────── */
type EmotionState = 'idle' | 'happy' | 'sad' | 'angry' | 'thinking' | 'listening';

/* ──────────────────────────────────────────────────────────
   Layer 1 — Vini avatar plane (positioned over light core)
   ────────────────────────────────────────────────────────── */
function ViniAvatarPlane({
  pointer,
  isMobile,
  avatarBreath,
  emotion,
}: {
  pointer: ReturnType<typeof usePointer>;
  isMobile: boolean;
  avatarBreath: React.MutableRefObject<number>;
  emotion: React.MutableRefObject<EmotionState>;
}) {
  const tex = useLoader(THREE.TextureLoader, viniAvatar);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const clickPulse = useRef(0);
  const emotionTime = useRef(0);

  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.premultiplyAlpha = false;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }, [tex]);

  useEffect(() => {
    const handler = () => { clickPulse.current = 1; };
    const emoHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as EmotionState;
      if (detail) {
        emotion.current = detail;
        emotionTime.current = 0;
      }
    };
    window.addEventListener('vini:click', handler);
    window.addEventListener('vini:emotion', emoHandler as EventListener);
    return () => {
      window.removeEventListener('vini:click', handler);
      window.removeEventListener('vini:emotion', emoHandler as EventListener);
    };
  }, [emotion]);

  // Avatar sits deeper into the scene — its lower tip should land on the
  // visible center of the office's holographic ring (≈ scene center).
  // Geometry origin is at the avatar's center; baseY is offset so the bottom
  // edge (= -size/2) hits the background center (~y = 0).
  const size: [number, number] = isMobile ? [1.6, 1.6] : [2.1, 2.1];
  const baseY = (isMobile ? 1.6 : 2.1) / 2 - 0.05; // bottom tip ≈ y=0 (ring center)
  const baseZ = -1.2; // deep inside the scene → real perspective integration

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;
    emotionTime.current += 0.016;
    const emo = emotion.current;

    // Base float
    const float = Math.sin(t * 1.4) * 0.10;
    avatarBreath.current = (Math.sin(t * 1.4) + 1) / 2; // 0..1 for the light to follow

    // Emotion-driven head/face animation (rotation = "head", scale.y squash = "face")
    let extraRotZ = 0;
    let extraRotX = 0;
    let squash = 1;
    let nodSpeed = 0.6;
    let swaySpeed = 0.6;

    switch (emo) {
      case 'happy':
        // gentle bouncy nod + slight upward tilt
        extraRotX = -0.06 + Math.sin(t * 4) * 0.05;
        squash = 1 + Math.sin(t * 5) * 0.04;
        nodSpeed = 1.2;
        break;
      case 'sad':
        // head down, slow droop
        extraRotX = 0.18 + Math.sin(t * 0.8) * 0.02;
        extraRotZ = Math.sin(t * 0.5) * 0.04;
        squash = 0.96;
        nodSpeed = 0.3;
        break;
      case 'angry':
        // quick shakes + slight forward lean
        extraRotZ = Math.sin(t * 18) * 0.06;
        extraRotX = -0.08;
        squash = 1.02 + Math.sin(t * 14) * 0.02;
        nodSpeed = 0.6;
        break;
      case 'thinking':
        // tilt to the side, slow
        extraRotZ = 0.18 + Math.sin(t * 0.7) * 0.05;
        extraRotX = -0.04;
        nodSpeed = 0.4;
        break;
      case 'listening':
        // attentive: lean slightly forward + subtle pulse
        extraRotX = -0.05;
        squash = 1 + Math.sin(t * 3) * 0.02;
        nodSpeed = 0.8;
        break;
    }

    const idleRotY = Math.sin(t * swaySpeed) * 0.06;
    const targetRotY = THREE.MathUtils.clamp(pointer.smooth.current.x * 0.35, -0.21, 0.21) + idleRotY;
    const targetRotX = THREE.MathUtils.clamp(-pointer.smooth.current.y * 0.25, -0.18, 0.18) + extraRotX;

    // Smaller positional drift — avatar stays anchored over the ring
    const targetX = pointer.smooth.current.x * 0.12;
    const targetY = baseY + float + pointer.smooth.current.y * 0.06;

    if (clickPulse.current > 0) {
      clickPulse.current = Math.max(0, clickPulse.current - 0.04);
    }
    const bounce = Math.sin(clickPulse.current * Math.PI) * 0.18;
    const baseScale = 1 + bounce;

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.07);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);
    groupRef.current.position.z = baseZ;

    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 0.08);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 0.08);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, extraRotZ, 0.1);
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, baseScale, 0.15);
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, baseScale * squash, 0.15);
  });

  // Bottom of the avatar in local coords (origin at center)
  const bottomY = -size[1] / 2;

  return (
    <group ref={groupRef} position={[0, baseY, baseZ]}>
      {/* warm rim light to integrate with office accents */}
      <pointLight position={[1.2, 0.8, 1.2]} intensity={0.7} color="#fb923c" distance={5} decay={2} />
      {/* cyan key light from the holographic ring below — kisses the avatar */}
      <pointLight position={[0, bottomY - 0.3, 0.4]} intensity={1.4} color="#22d3ee" distance={3.5} decay={2} />

      {/* Soft cyan contact glow at the avatar's feet — sells depth integration */}
      <mesh position={[0, bottomY + 0.02, -0.05]} rotation={[-Math.PI / 2.2, 0, 0]} renderOrder={18}>
        <circleGeometry args={[0.55, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, bottomY + 0.01, -0.04]} rotation={[-Math.PI / 2.2, 0, 0]} renderOrder={18}>
        <circleGeometry args={[0.95, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Avatar — solid silhouette, integrated in 3D with proper depth */}
      <mesh ref={meshRef} renderOrder={20} position={[0, 0, 0]}>
        <planeGeometry args={size} />
        <meshBasicMaterial
          map={tex}
          transparent
          alphaTest={0.5}
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
  const avatarBreath = useRef(0);
  const emotion = useRef<EmotionState>('idle');

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
      <ViniAvatarPlane pointer={pointer} isMobile={isMobile} avatarBreath={avatarBreath} emotion={emotion} />
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
