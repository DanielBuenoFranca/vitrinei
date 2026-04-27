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
          Mobile (≤640px): a imagem mobile é vertical (846×1504) — usa object-cover
          posicionado no centro-baixo para mostrar todo o escritório sem cortar a parte
          principal do mascote/cenário. É a experiência principal do produto.
          Desktop (>640px): mantém object-contain para nunca cortar bordas.
        */}
        <picture>
          <source media="(max-width: 640px)" srcSet={officeBgMobile} />
          <img
            src={officeBg}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover sm:object-contain object-center"
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
    </div>
  );
}
