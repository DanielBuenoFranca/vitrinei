import { useEffect, useRef } from 'react';
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
 */
export function ViniScene() {
  const layerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ rx: 0, ry: 0 });
  const currentRef = useRef({ rx: 0, ry: 0 });
  const rafRef = useRef<number | null>(null);

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
      </div>

      {/* Vinheta sutil — direciona o olhar ao centro holográfico */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 55%, transparent 35%, hsl(222 45% 4% / 0.35) 80%, hsl(222 50% 2% / 0.65) 100%)',
        }}
      />

      {/*
        ─── LUZ CENTRAL VOLUMÉTRICA (animada, sutil) ─────────────────────
        Três camadas sincronizadas para simular luz subindo do ponto
        central do círculo holográfico:
          1) Núcleo pulsante (breathing) — foco brilhante na base.
          2) Coluna volumétrica (god-ray) — feixe vertical estreito que
             sobe e se dissipa, com leve oscilação de intensidade.
          3) Halo expansivo — onda concêntrica que nasce do centro e
             se dissipa para cima/fora.
        Tudo usa screen blend + multiply de opacidades baixas (≤0.45)
        para preservar tons, proporções e legibilidade da cena.
        ───────────────────────────────────────────────────────────────── */}
      <div className="vini-central-light pointer-events-none absolute inset-0 mix-blend-screen">
        {/* 1) Núcleo brilhante (breathing) */}
        <div className="vcl-core" />
        {/* 2) Feixe vertical subindo (god-ray) */}
        <div className="vcl-beam" />
        {/* 3) Halo concêntrico expandindo */}
        <div className="vcl-halo" />
        {/* 4) Partículas verticais (mote drift) */}
        <div className="vcl-motes" />
      </div>

      <style>{`
        /* Container — ancorado no mesmo ponto central do círculo holográfico
           (≈ 55% da altura, igual à vinheta), sem alterar nada da cena. */
        .vini-central-light { z-index: 1; }

        /* Reduz drasticamente animações se o usuário pediu */
        @media (prefers-reduced-motion: reduce) {
          .vcl-core, .vcl-beam, .vcl-halo, .vcl-motes { animation: none !important; }
        }

        /* 1) NÚCLEO — leve breathing no ponto exato do círculo */
        .vcl-core {
          position: absolute;
          left: 50%;
          top: 55%;
          width: 38vmin;
          height: 38vmin;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle at center,
            hsl(var(--vini-glow) / 0.45) 0%,
            hsl(var(--vini-glow) / 0.22) 22%,
            hsl(var(--vini-glow) / 0.08) 45%,
            transparent 70%
          );
          filter: blur(8px);
          animation: vcl-breath 4.2s ease-in-out infinite;
          will-change: opacity, transform;
        }

        @keyframes vcl-breath {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.95; transform: translate(-50%, -50%) scale(1.06); }
        }

        /* 2) FEIXE VOLUMÉTRICO — coluna fina subindo do centro */
        .vcl-beam {
          position: absolute;
          left: 50%;
          top: 55%;
          width: 18vmin;
          height: 70vh;
          transform: translate(-50%, -85%);
          background: linear-gradient(
            to top,
            hsl(var(--vini-glow) / 0.30) 0%,
            hsl(var(--vini-glow) / 0.18) 18%,
            hsl(var(--vini-glow) / 0.08) 45%,
            transparent 85%
          );
          filter: blur(14px);
          mask-image: radial-gradient(ellipse 60% 100% at 50% 100%, black 0%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 60% 100% at 50% 100%, black 0%, transparent 80%);
          animation: vcl-beam 5.6s ease-in-out infinite;
          will-change: opacity, transform;
        }

        @keyframes vcl-beam {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -85%) scaleY(0.96); }
          50%      { opacity: 0.70; transform: translate(-50%, -88%) scaleY(1.04); }
        }

        /* 3) HALO — onda concêntrica que nasce e dissipa */
        .vcl-halo {
          position: absolute;
          left: 50%;
          top: 55%;
          width: 18vmin;
          height: 18vmin;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid hsl(var(--vini-glow) / 0.45);
          box-shadow:
            0 0 24px hsl(var(--vini-glow) / 0.25) inset,
            0 0 32px hsl(var(--vini-glow) / 0.18);
          opacity: 0;
          animation: vcl-halo 5.2s ease-out infinite;
          will-change: opacity, transform;
        }

        @keyframes vcl-halo {
          0%   { opacity: 0.55; transform: translate(-50%, -50%) scale(0.6); }
          70%  { opacity: 0.10; transform: translate(-50%, -65%) scale(1.8); }
          100% { opacity: 0;    transform: translate(-50%, -75%) scale(2.2); }
        }

        /* 4) PARTÍCULAS — pequenos motes subindo continuamente */
        .vcl-motes {
          position: absolute;
          left: 50%;
          top: 55%;
          width: 22vmin;
          height: 60vh;
          transform: translate(-50%, -90%);
          background-image:
            radial-gradient(1.5px 1.5px at 20% 90%, hsl(var(--vini-glow) / 0.55), transparent 60%),
            radial-gradient(1px 1px   at 60% 70%, hsl(var(--vini-glow) / 0.45), transparent 60%),
            radial-gradient(1.5px 1.5px at 35% 50%, hsl(var(--vini-glow) / 0.35), transparent 60%),
            radial-gradient(1px 1px   at 75% 30%, hsl(var(--vini-glow) / 0.30), transparent 60%),
            radial-gradient(1.5px 1.5px at 45% 10%, hsl(var(--vini-glow) / 0.20), transparent 60%);
          mask-image: linear-gradient(to top, black 0%, black 30%, transparent 100%);
          -webkit-mask-image: linear-gradient(to top, black 0%, black 30%, transparent 100%);
          animation: vcl-motes 7s linear infinite;
          opacity: 0.7;
          will-change: transform, opacity;
        }

        @keyframes vcl-motes {
          0%   { transform: translate(-50%, -85%); opacity: 0.0; }
          15%  { opacity: 0.7; }
          85%  { opacity: 0.5; }
          100% { transform: translate(-50%, -110%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
