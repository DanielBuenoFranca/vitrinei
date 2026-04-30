import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Cena 3D estilo radar marítimo/espacial.
 * - Disco/grid no chão com anéis pulsantes
 * - Sweep arc rotativo (como sonar)
 * - Pins flutuantes representando prestadores encontrados
 * - Estrelas no fundo (atmosfera espacial)
 *
 * Props:
 *  - phase: 'searching' | 'found' | 'zooming'
 *  - foundCount: número de prestadores detectados
 *  - zoom: 0..1 (controla o "mergulho" para o mapa real)
 */
interface Radar3DSceneProps {
  phase: 'searching' | 'found' | 'zooming';
  foundCount?: number;
  zoom?: number;
}

function PulseRings() {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const phase = (t * 0.5 + i * 0.3) % 1;
      ring.scale.setScalar(0.3 + phase * 4);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - phase) * 0.6;
    });
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(el) => el && (ringsRef.current[i] = el)}
        >
          <ringGeometry args={[0.95, 1, 64]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Grid lines */}
      <mesh>
        <ringGeometry args={[0.99, 1, 128]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[1.99, 2, 128]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[2.99, 3, 128]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SweepArc() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = -state.clock.getElapsedTime() * 1.2;
    }
  });
  // Build a triangular wedge in XY then lay it flat
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(3.2, 0);
    s.absarc(0, 0, 3.2, 0, Math.PI / 4, false);
    s.lineTo(0, 0);
    return s;
  }, []);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CenterBeacon() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const s = 1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.15;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.05, 0]}>
      <sphereGeometry args={[0.12, 24, 24]} />
      <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} />
    </mesh>
  );
}

function ProviderPin({ position, color = '#f97316', delay = 0 }: { position: [number, number, number]; color?: string; delay?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime() + delay;
      ref.current.position.y = position[1] + Math.sin(t * 2) * 0.08;
      ref.current.rotation.y = t * 0.5;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <coneGeometry args={[0.15, 0.5, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function CameraController({ phase, zoom = 0 }: { phase: string; zoom?: number }) {
  useFrame((state) => {
    const cam = state.camera;
    if (phase === 'searching') {
      const t = state.clock.getElapsedTime() * 0.08;
      cam.position.x = Math.sin(t) * 0.5;
      cam.position.y = 4.5;
      cam.position.z = 4.5;
    } else if (phase === 'found') {
      cam.position.lerp(new THREE.Vector3(0, 3.5, 3.5), 0.05);
    } else if (phase === 'zooming') {
      // Zoom progressivo: descer e mergulhar no centro
      const target = new THREE.Vector3(0, 0.5 + (1 - zoom) * 3, 0.3 + (1 - zoom) * 3);
      cam.position.lerp(target, 0.08);
    }
    cam.lookAt(0, 0, 0);
  });
  return null;
}

export function Radar3DScene({ phase, foundCount = 3, zoom = 0 }: Radar3DSceneProps) {
  // Posições estáveis dos pins
  const pins = useMemo(() => {
    const arr: { pos: [number, number, number]; delay: number }[] = [];
    const seed = [0.6, 0.2, 0.85, 0.4, 0.7];
    for (let i = 0; i < Math.min(foundCount, 5); i++) {
      const angle = seed[i] * Math.PI * 2;
      const radius = 1.2 + seed[i] * 1.5;
      arr.push({
        pos: [Math.cos(angle) * radius, 0.3, Math.sin(angle) * radius],
        delay: i * 0.7,
      });
    }
    return arr;
  }, [foundCount]);

  return (
    <Canvas
      camera={{ position: [0, 4.5, 4.5], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'radial-gradient(circle at 50% 50%, hsl(220 60% 8%) 0%, hsl(230 70% 4%) 70%, #000 100%)' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 5, 0]} intensity={1.2} color="#22d3ee" />
        <pointLight position={[3, 2, 3]} intensity={0.6} color="#f97316" />

        <Stars radius={50} depth={30} count={1500} factor={3} fade speed={0.5} />

        <PulseRings />
        <SweepArc />
        <CenterBeacon />

        {(phase === 'found' || phase === 'zooming') &&
          pins.map((p, i) => (
            <ProviderPin
              key={i}
              position={p.pos}
              color={i === 0 ? '#22c55e' : '#f97316'}
              delay={p.delay}
            />
          ))}

        <CameraController phase={phase} zoom={zoom} />
      </Suspense>
    </Canvas>
  );
}

export default Radar3DScene;
