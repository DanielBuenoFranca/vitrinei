import { useEffect, useRef, useState } from 'react';
import officeBg from '@/assets/office-bg.jpg';
import officeBgMobile from '@/assets/office-bg-mobile.jpg';

/**
 * ViniScene — Background only (anti-crop + parallax + vignette).
 *
 * Regras:
 *  • A imagem deve ser exibida POR INTEIRO (object-fit: contain) em qualquer
 *    proporção de tela — Mobile (vertical) e Desktop (widescreen).
 *  • As barras pretas que sobrariam ao redor são preenchidas por um gradiente
 *    radial suave que imita o tom escuro do escritório, sem cortar nada.
 *  • Paralaxe 3D reativa ao mouse / orientação do device (3–5 graus máx),
 *    com `perspective(1200px)` no container pai, reforçando profundidade.
 *  • Vinheta interna sutil para guiar o olhar ao centro holográfico.
 *  • A LUZ VOLUMÉTRICA é ancorada DENTRO do círculo holográfico no chão,
 *    no ponto exato de maior brilho da imagem (não no centro do viewport).
 */

// Coordenadas do "ponto mais forte de luz" dentro do círculo holográfico,
// medidas como porcentagens da própria imagem (não do viewport).
const FOCAL_DESKTOP = { x: 50, y: 73 }; // office-bg.jpg (1920x1024 aprox.)
const FOCAL_MOBILE  = { x: 50, y: 67 }; // office-bg-mobile.jpg (portrait)

// Proporção (aspect-ratio) das imagens — usada para calcular a "caixa pintada"
// quando object-fit: contain letterboxa a imagem dentro da viewport.
const ASPECT_DESKTOP = 1920 / 1024;
const ASPECT_MOBILE  = 9 / 16; // portrait approximation (mobile asset)

export function ViniScene() {
  const layerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ rx: 0, ry: 0 });
  const currentRef = useRef({ rx: 0, ry: 0 });
  const rafRef = useRef<number | null>(null);

  // Mantemos o layout fluido — o ponto focal e o tamanho da "caixa contida"
  // são calculados a cada resize para que a luz acompanhe exatamente a
  // posição do brilho da imagem em qualquer viewport.
  const [box, setBox] = useState(() => computeContainBox());

  useEffect(() => {
    const onResize = () => setBox(computeContainBox());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  useEffect(() => {
    const MAX = 4; // graus

    const tick = () => {
      const t = targetRef.current;
      const c = currentRef.current;
      // lerp suave — apenas eixo Y (horizontal). rx fica travado em 0.
      c.ry += (t.ry - c.ry) * 0.08;
      c.rx = 0;
      if (layerRef.current) {
        layerRef.current.style.transform =
          `rotateY(${c.ry.toFixed(3)}deg) scale(1.02)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const dx = (e.clientX / w) * 2 - 1; // -1..1
      targetRef.current.ry = dx * MAX;
      // rx permanece 0 — sem movimento vertical
    };

    const onOrient = (e: DeviceOrientationEvent) => {
      // gamma: ~ -90..90 (esq/dir) — apenas inclinação horizontal
      if (e.gamma == null) return;
      const gx = Math.max(-MAX, Math.min(MAX, e.gamma / 12));
      targetRef.current.ry = gx;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('deviceorientation', onOrient, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
      style={{
        // Fundo externo (preenche o espaço fora da imagem contida)
        background:
          'radial-gradient(ellipse at 50% 55%, hsl(220 40% 8%) 0%, hsl(222 45% 5%) 55%, hsl(225 50% 3%) 100%)',
        perspective: '1200px',
      }}
    >
      <div
        ref={layerRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.05s linear' }}
      >
        {/*
          Em qualquer breakpoint a imagem é exibida POR INTEIRO (object-contain),
          centralizada — nunca corta as bordas, mesmo na vertical do mobile.
          As áreas vazias ao redor são preenchidas pelo gradiente radial do
          container pai, mantendo a continuidade visual do escritório escuro.
        */}
        <picture>
          <source media="(max-width: 640px)" srcSet={officeBgMobile} />
          <img
            src={officeBg}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain object-center"
            style={{ imageRendering: 'auto' }}
          />
        </picture>

        {/*
          ─── LUZ CENTRAL VOLUMÉTRICA ───────────────────────────────────────
          Posicionada DENTRO da caixa pintada da imagem (object-contain),
          alinhada ao ponto mais forte de luz do círculo holográfico no chão.
          A caixa é recalculada a cada resize/orientationchange.
        */}
        <div
          className="vini-central-light absolute pointer-events-none mix-blend-screen"
          style={{
            left: `${box.left}px`,
            top: `${box.top}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
            // Variáveis CSS com a posição focal RELATIVA à caixa pintada.
            ['--vcl-x' as any]: `${box.isMobile ? FOCAL_MOBILE.x : FOCAL_DESKTOP.x}%`,
            ['--vcl-y' as any]: `${box.isMobile ? FOCAL_MOBILE.y : FOCAL_DESKTOP.y}%`,
          }}
        >
          <div className="vcl-core" />
          <div className="vcl-beam" />
          <div className="vcl-halo" />
          <div className="vcl-motes" />
        </div>
      </div>

      {/* Vinheta sutil — direciona o olhar ao centro holográfico */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 55%, transparent 35%, hsl(222 45% 4% / 0.35) 80%, hsl(222 50% 2% / 0.65) 100%)',
        }}
      />

      <style>{`
        .vini-central-light { z-index: 1; }

        /* Reduz drasticamente animações se o usuário pediu */
        @media (prefers-reduced-motion: reduce) {
          .vcl-core, .vcl-beam, .vcl-halo, .vcl-motes { animation: none !important; }
        }

        /* 1) NÚCLEO — breathing exatamente sobre o ponto de brilho do círculo */
        .vcl-core {
          position: absolute;
          left: var(--vcl-x);
          top: var(--vcl-y);
          width: 14%;
          aspect-ratio: 1 / 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle at center,
            hsl(var(--vini-glow) / 0.55) 0%,
            hsl(var(--vini-glow) / 0.28) 22%,
            hsl(var(--vini-glow) / 0.10) 45%,
            transparent 70%
          );
          filter: blur(6px);
          animation: vcl-breath 4.2s ease-in-out infinite;
          will-change: opacity, transform;
        }

        @keyframes vcl-breath {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.95; transform: translate(-50%, -50%) scale(1.08); }
        }

        /* 2) FEIXE VOLUMÉTRICO — coluna fina subindo do centro do círculo */
        .vcl-beam {
          position: absolute;
          left: var(--vcl-x);
          top: var(--vcl-y);
          width: 7%;
          height: 55%;
          transform: translate(-50%, -100%);
          background: linear-gradient(
            to top,
            hsl(var(--vini-glow) / 0.35) 0%,
            hsl(var(--vini-glow) / 0.20) 18%,
            hsl(var(--vini-glow) / 0.08) 45%,
            transparent 90%
          );
          filter: blur(10px);
          mask-image: radial-gradient(ellipse 60% 100% at 50% 100%, black 0%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 60% 100% at 50% 100%, black 0%, transparent 80%);
          animation: vcl-beam 5.6s ease-in-out infinite;
          will-change: opacity, transform;
        }

        @keyframes vcl-beam {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -100%) scaleY(0.95); }
          50%      { opacity: 0.75; transform: translate(-50%, -102%) scaleY(1.06); }
        }

        /* 3) HALO — onda concêntrica que nasce do disco e sobe */
        .vcl-halo {
          position: absolute;
          left: var(--vcl-x);
          top: var(--vcl-y);
          width: 10%;
          aspect-ratio: 1 / 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid hsl(var(--vini-glow) / 0.5);
          box-shadow:
            0 0 22px hsl(var(--vini-glow) / 0.28) inset,
            0 0 28px hsl(var(--vini-glow) / 0.20);
          opacity: 0;
          animation: vcl-halo 5.2s ease-out infinite;
          will-change: opacity, transform;
        }

        @keyframes vcl-halo {
          0%   { opacity: 0.55; transform: translate(-50%, -50%) scale(0.6); }
          70%  { opacity: 0.10; transform: translate(-50%, -120%) scale(1.9); }
          100% { opacity: 0;    transform: translate(-50%, -150%) scale(2.3); }
        }

        /* 4) PARTÍCULAS — pequenos motes subindo continuamente do disco */
        .vcl-motes {
          position: absolute;
          left: var(--vcl-x);
          top: var(--vcl-y);
          width: 12%;
          height: 50%;
          transform: translate(-50%, -100%);
          background-image:
            radial-gradient(1.5px 1.5px at 20% 90%, hsl(var(--vini-glow) / 0.6), transparent 60%),
            radial-gradient(1px 1px   at 60% 70%, hsl(var(--vini-glow) / 0.5), transparent 60%),
            radial-gradient(1.5px 1.5px at 35% 50%, hsl(var(--vini-glow) / 0.4), transparent 60%),
            radial-gradient(1px 1px   at 75% 30%, hsl(var(--vini-glow) / 0.32), transparent 60%),
            radial-gradient(1.5px 1.5px at 45% 10%, hsl(var(--vini-glow) / 0.22), transparent 60%);
          mask-image: linear-gradient(to top, black 0%, black 30%, transparent 100%);
          -webkit-mask-image: linear-gradient(to top, black 0%, black 30%, transparent 100%);
          animation: vcl-motes 7s linear infinite;
          opacity: 0.7;
          will-change: transform, opacity;
        }

        @keyframes vcl-motes {
          0%   { transform: translate(-50%, -100%); opacity: 0.0; }
          15%  { opacity: 0.7; }
          85%  { opacity: 0.5; }
          100% { transform: translate(-50%, -130%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Helper: caixa "pintada" da imagem com object-contain ─────────────
function computeContainBox() {
  if (typeof window === 'undefined') {
    return { left: 0, top: 0, width: 0, height: 0, isMobile: false };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw <= 640;
  const aspect = isMobile ? ASPECT_MOBILE : ASPECT_DESKTOP;
  // object-contain: a caixa cabe inteira respeitando a proporção da imagem
  let width: number, height: number;
  if (vw / vh > aspect) {
    // viewport mais larga que a imagem -> altura = vh
    height = vh;
    width = vh * aspect;
  } else {
    width = vw;
    height = vw / aspect;
  }
  const left = (vw - width) / 2;
  const top = (vh - height) / 2;
  return { left, top, width, height, isMobile };
}
