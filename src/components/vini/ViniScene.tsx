import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import officeBg from '@/assets/office-bg.png';
import viniFront from '@/assets/vini-avatar.png';
import viniBack from '@/assets/vini-avatar-back.png';

/* ──────────────────────────────────────────────────────────
   Pointer (mouse / touch / gyro) with elastic lerp
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
   Layer 0 — Background (futuristic office) with parallax
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

  // very subtle parallax — background barely moves so the avatar feels grounded in the room
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.x = THREE.MathUtils.lerp(
      ref.current.position.x,
      pointer.smooth.current.x * 0.06,
      0.04
    );
    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y,
      pointer.smooth.current.y * 0.04,
      0.04
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
   Holographic core — pulsing light from the floor ring
   ────────────────────────────────────────────────────────── */
function HolographicCore({
  avatarBreath,
  emotion,
  groundY,
  baseZ,
}: {
  avatarBreath: React.MutableRefObject<number>;
  emotion: React.MutableRefObject<EmotionState>;
  groundY: number;
  baseZ: number;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = avatarBreath.current;
    const emo = emotion.current;
    let color = new THREE.Color('#22d3ee');
    if (emo === 'sad') color = new THREE.Color('#3b82f6');
    else if (emo === 'angry') color = new THREE.Color('#ef4444');
    else if (emo === 'thinking') color = new THREE.Color('#a855f7');
    else if (emo === 'listening') color = new THREE.Color('#10b981');

    if (lightRef.current) {
      lightRef.current.color = color;
      lightRef.current.intensity = 2.4 + Math.sin(t * 2.2) * 0.5 + breath * 1.2;
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.color = color;
      mat.opacity = 0.16 + Math.sin(t * 1.6) * 0.05 + breath * 0.10;
      const s = 1 + Math.sin(t * 1.2) * 0.04 + breath * 0.08;
      haloRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[0, groundY, baseZ + 0.3]}>
      <pointLight ref={lightRef} position={[0, 0.15, 0.4]} intensity={2.4} distance={6} decay={2} />
      <mesh ref={haloRef} rotation={[-Math.PI / 2.05, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.42, 0.78, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   Emotion state shared via refs
   ────────────────────────────────────────────────────────── */
type EmotionState = 'idle' | 'happy' | 'sad' | 'angry' | 'thinking' | 'listening';

/* ──────────────────────────────────────────────────────────
   Drag state shared between DOM listener and R3F frame loop
   ────────────────────────────────────────────────────────── */
type DragState = {
  dragging: boolean;
  lastX: number;
  velocity: number; // angular velocity (rad/frame) — inertia
  manualY: number;  // accumulated manual rotation around Y
};

function useDragRotation() {
  const drag = useRef<DragState>({ dragging: false, lastX: 0, velocity: 0, manualY: 0 });

  useEffect(() => {
    const getX = (e: MouseEvent | TouchEvent) =>
      'touches' in e ? (e.touches[0]?.clientX ?? 0) : (e as MouseEvent).clientX;

    const onDown = (e: MouseEvent | TouchEvent) => {
      drag.current.dragging = true;
      drag.current.lastX = getX(e);
      drag.current.velocity = 0;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!drag.current.dragging) return;
      const x = getX(e);
      const dx = x - drag.current.lastX;
      drag.current.lastX = x;
      // 1px ≈ 0.012 rad — a full screen drag does ~ ±5 rad
      const delta = dx * 0.012;
      drag.current.manualY += delta;
      drag.current.velocity = delta; // newest frame velocity, decays after release
    };
    const onUp = () => {
      drag.current.dragging = false;
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return drag;
}

/* ──────────────────────────────────────────────────────────
   Avatar — volumetric 360° rotation (front + back impostor)

   Two textured planes are crossed perpendicularly:
     • Plane A shows the FRONT texture (visible when facing camera)
     • Plane B shows the BACK texture (rotated 180° around Y)
   Combined with metallic StandardMaterial + a directional rim light,
   the silhouette feels like a 3D body rotating in space.
   ────────────────────────────────────────────────────────── */
function ViniAvatar3D({
  pointer,
  isMobile,
  avatarBreath,
  emotion,
  drag,
  baseY,
  baseZ,
}: {
  pointer: ReturnType<typeof usePointer>;
  isMobile: boolean;
  avatarBreath: React.MutableRefObject<number>;
  emotion: React.MutableRefObject<EmotionState>;
  drag: ReturnType<typeof useDragRotation>;
  baseY: number;
  baseZ: number;
}) {
  const front = useLoader(THREE.TextureLoader, viniFront);
  const back = useLoader(THREE.TextureLoader, viniBack);

  const groupRef = useRef<THREE.Group>(null);   // floats / sways / scales
  const spinRef = useRef<THREE.Group>(null);    // rotates around Y (volumetric)
  const clickPulse = useRef(0);
  const emotionTime = useRef(0);

  useEffect(() => {
    [front, back].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 16;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
    });
  }, [front, back]);

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

  // Avatar dimensions — proportion of the cropped robot (896 x 1200 ≈ 0.747)
  const aspect = 896 / 1200;
  const heightU = isMobile ? 1.95 : 2.25;
  const widthU = heightU * aspect;
  const size: [number, number] = [widthU, heightU];

  useFrame((state) => {
    if (!groupRef.current || !spinRef.current) return;
    const t = state.clock.elapsedTime;
    emotionTime.current += 0.016;
    const emo = emotion.current;

    // Float (breathing)
    const float = Math.sin(t * 1.4) * 0.10;
    avatarBreath.current = (Math.sin(t * 1.4) + 1) / 2;

    // ── Rotation logic ──────────────────────────────────────
    // No auto-spin. Default state: facing forward (rotation.y = 0).
    // User drags to rotate; on release, inertia decays and avatar smoothly
    // returns to face-forward (nearest 0 mod 2π).

    if (!drag.current.dragging) {
      // Inertia decay
      drag.current.manualY += drag.current.velocity;
      drag.current.velocity *= 0.94;
      if (Math.abs(drag.current.velocity) < 0.0005) drag.current.velocity = 0;

      // After inertia stops, smoothly snap back to facing camera
      if (drag.current.velocity === 0 && Math.abs(drag.current.manualY) > 0.001) {
        const twoPi = Math.PI * 2;
        // Find shortest path back to a multiple of 2π (facing forward)
        const wrapped = ((drag.current.manualY % twoPi) + twoPi) % twoPi;
        const target = wrapped > Math.PI ? twoPi : 0;
        const desired = drag.current.manualY + (target - wrapped);
        drag.current.manualY = THREE.MathUtils.lerp(drag.current.manualY, desired, 0.06);
      }
    }

    // Subtle pointer "look" only when idle and near-front
    const nearFront = Math.abs(((drag.current.manualY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) < 0.3;
    const pointerYaw = !drag.current.dragging && nearFront
      ? THREE.MathUtils.clamp(pointer.smooth.current.x * 0.25, -0.35, 0.35)
      : 0;
    spinRef.current.rotation.y = drag.current.manualY + pointerYaw;

    // ── Emotion squash/tilt on the outer group (doesn't affect spin) ──
    let extraRotZ = 0;
    let extraRotX = 0;
    let squash = 1;
    switch (emo) {
      case 'happy':
        extraRotX = -0.05 + Math.sin(t * 4) * 0.04;
        squash = 1 + Math.sin(t * 5) * 0.03;
        break;
      case 'sad':
        extraRotX = 0.16 + Math.sin(t * 0.8) * 0.02;
        extraRotZ = Math.sin(t * 0.5) * 0.04;
        squash = 0.96;
        break;
      case 'angry':
        extraRotZ = Math.sin(t * 18) * 0.05;
        extraRotX = -0.08;
        squash = 1.02 + Math.sin(t * 14) * 0.02;
        break;
      case 'thinking':
        extraRotZ = 0.16 + Math.sin(t * 0.7) * 0.05;
        extraRotX = -0.04;
        break;
      case 'listening':
        extraRotX = -0.05;
        squash = 1 + Math.sin(t * 3) * 0.02;
        break;
    }

    // Position — anchored above the lit ring; very small horizontal drift
    const targetX = pointer.smooth.current.x * 0.03;
    const targetY = baseY + float * 0.55 + pointer.smooth.current.y * 0.015;

    if (clickPulse.current > 0) {
      clickPulse.current = Math.max(0, clickPulse.current - 0.04);
    }
    const bounce = Math.sin(clickPulse.current * Math.PI) * 0.16;
    const baseScale = 1 + bounce;

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.07);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);
    groupRef.current.position.z = baseZ;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, extraRotX, 0.08);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, extraRotZ, 0.1);
    groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, baseScale, 0.15);
    groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, baseScale * squash, 0.15);
  });

  const bottomY = -size[1] / 2;

  return (
    <group ref={groupRef} position={[0, baseY, baseZ]}>
      {/* Shared rim/key lights so reflections shift while the body rotates */}
      <pointLight position={[-1.6, 1.5, 1.4]} intensity={0.9} color="#7dd3fc" distance={5} decay={2} />
      <pointLight position={[1.5, -0.2, 1.2]} intensity={0.8} color="#fbbf24" distance={5} decay={2} />
      <pointLight position={[0, bottomY - 0.15, 0.5]} intensity={1.4} color="#22d3ee" distance={3} decay={2} />
      <pointLight position={[0, 0.3, 1.6]} intensity={0.55} color="#ffffff" distance={3.5} decay={2} />

      {/* Soft elliptical contact shadow on the ground */}
      <mesh position={[0, bottomY - 0.02, -0.02]} rotation={[-Math.PI / 2.05, 0, 0]} renderOrder={17}>
        <circleGeometry args={[0.36, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Cyan contact halo on the ring */}
      <mesh position={[0, bottomY + 0.03, -0.05]} rotation={[-Math.PI / 2.15, 0, 0]} renderOrder={18}>
        <circleGeometry args={[0.46, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.14} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Tiny golden contact spark */}
      <mesh position={[0, bottomY + 0.05, -0.03]} rotation={[-Math.PI / 2.15, 0, 0]} renderOrder={19}>
        <circleGeometry args={[0.12, 48]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.30} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* ── Volumetric body: multiple crossed planes simulate a 3D volume ──
          Front + back textures rendered on planes rotated at 0°, 45°, 90°, 135°.
          The repeated silhouette gives the illusion of a solid body with sides
          when the user spins it. alphaTest keeps edges crisp. */}
      <group ref={spinRef} renderOrder={20}>
        {/* Slab 0° — primary front/back */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={size} />
          <meshStandardMaterial
            map={front}
            transparent
            alphaTest={0.5}
            depthWrite={false}
            side={THREE.FrontSide}
            roughness={0.10}
            metalness={0.90}
            envMapIntensity={1.0}
          />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={size} />
          <meshStandardMaterial
            map={back}
            transparent
            alphaTest={0.5}
            depthWrite={false}
            side={THREE.FrontSide}
            roughness={0.10}
            metalness={0.90}
            envMapIntensity={1.0}
          />
        </mesh>

        {/* Slab 45° — diagonal volume filler (front-ish texture) */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
          <planeGeometry args={[widthU * 0.85, heightU]} />
          <meshStandardMaterial
            map={front}
            transparent
            alphaTest={0.55}
            depthWrite={false}
            side={THREE.FrontSide}
            roughness={0.15}
            metalness={0.85}
            envMapIntensity={0.9}
            opacity={0.85}
          />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI + Math.PI / 4, 0]}>
          <planeGeometry args={[widthU * 0.85, heightU]} />
          <meshStandardMaterial
            map={back}
            transparent
            alphaTest={0.55}
            depthWrite={false}
            side={THREE.FrontSide}
            roughness={0.15}
            metalness={0.85}
            envMapIntensity={0.9}
            opacity={0.85}
          />
        </mesh>

        {/* Slab 90° — pure side profile (compressed silhouette) */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[widthU * 0.55, heightU]} />
          <meshStandardMaterial
            map={front}
            transparent
            alphaTest={0.6}
            depthWrite={false}
            side={THREE.DoubleSide}
            roughness={0.20}
            metalness={0.80}
            envMapIntensity={0.85}
            opacity={0.75}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   Scene content
   ────────────────────────────────────────────────────────── */
function SceneContent({ isMobile }: { isMobile: boolean }) {
  const pointer = usePointer();
  const drag = useDragRotation();
  const avatarBreath = useRef(0);
  const emotion = useRef<EmotionState>('idle');

  // Avatar anchored on the lit floor ring of the office background
  const baseY = isMobile ? -0.05 : -0.10;
  const baseZ = -2.1;
  const groundY = baseY - (isMobile ? 1.10 : 1.20);

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
      {/* Office ambient — cool sky / warm wood floor */}
      <ambientLight intensity={0.6} color="#dce8f5" />
      {/* Key DirectionalLight at 45° — fixed in scene so reflections sweep across the spinning body */}
      <directionalLight position={[5, 5, 5]} intensity={1.4} color="#ffffff" />
      {/* Cool window fill from the upper-left */}
      <directionalLight position={[-4, 3, 3]} intensity={0.6} color="#bfdcff" />
      {/* Warm screen bounce from lower-right */}
      <directionalLight position={[3, -1, 3]} intensity={0.45} color="#f59e0b" />
      {/* Hemisphere — sky + wooden floor */}
      <hemisphereLight args={['#bfdcff', '#7a4a1f', 0.4]} />

      <BackgroundPlane pointer={pointer} />
      <HolographicCore avatarBreath={avatarBreath} emotion={emotion} groundY={groundY} baseZ={baseZ} />
      <ViniAvatar3D
        pointer={pointer}
        isMobile={isMobile}
        avatarBreath={avatarBreath}
        emotion={emotion}
        drag={drag}
        baseY={baseY}
        baseZ={baseZ}
      />
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
    // Canvas itself is pointer-transparent so DOM UI (header, mic, menus) keeps working.
    // The avatar's drag area is provided by the centered hit-area in ViniHome.tsx,
    // which dispatches the same window mouse/touch events the drag hook listens to.
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#0B0E14']} />
          <fog attach="fog" args={['#0B0E14', 9, 22]} />
          <SceneContent isMobile={isMobile} />
          <EffectComposer>
            <Bloom
              intensity={0.85}
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
