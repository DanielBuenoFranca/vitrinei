import { useEffect, useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Search, Sparkles, Star } from 'lucide-react';
import {
  Wrench, Scissors, Droplets, Sprout, Truck, Hammer, Stethoscope,
  GraduationCap, Car, Home, Brush, ShoppingBag,
} from 'lucide-react';
import viniAvatar from '@/assets/vini-avatar.png';
import { supabase } from '@/integrations/supabase/client';
import { TopProviderBadge } from '@/components/TopProviderBadge';

interface SegmentItem { id: string; label: string; name: string; image_url?: string | null }

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearch: () => void;
  onMic: () => void;
  micListening?: boolean;
  micSupported?: boolean;
  segments: SegmentItem[];
  activeSegments: string[];
  toggleSegment: (id: string) => void;
  children?: ReactNode;
}

const DEFAULT_ICONS: Record<string, any> = {
  serviços: Wrench, servicos: Wrench, doméstico: Home, domestico: Home,
  beleza: Scissors, encanador: Droplets, jardinagem: Sprout, frete: Truck, fretes: Truck,
  reforma: Hammer, saúde: Stethoscope, saude: Stethoscope, educação: GraduationCap, educacao: GraduationCap,
  auto: Car, automotivo: Car, limpeza: Brush, varejo: ShoppingBag, alimentação: ShoppingBag,
  alimentacao: ShoppingBag, manutenção: Wrench, manutencao: Wrench, música: Sparkles,
  musica: Sparkles, negócio: BarChartLike, utensílios: ShoppingBag, utensilios: ShoppingBag,
};

function BarChartLike(props: any) { return <Sparkles {...props} />; }

function pickIcon(label: string) {
  const k = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const key of Object.keys(DEFAULT_ICONS)) {
    if (k.includes(key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      return DEFAULT_ICONS[key];
    }
  }
  return Sparkles;
}

interface Top {
  id: number;
  name: string;
  logo_url: string | null;
  rating: number;
  is_top_provider: boolean;
  segment: string[];
}

export function Search3DHero({
  searchQuery, setSearchQuery, onSearch, onMic, micListening, micSupported,
  segments, activeSegments, toggleSegment, children,
}: Props) {
  const [top, setTop] = useState<Top[]>([]);
  const [thought, setThought] = useState<string | null>(null);
  const thoughtTimer = useRef<number | null>(null);

  useEffect(() => {
    supabase.from('providers')
      .select('id,name,logo_url,rating,is_top_provider,segment')
      .eq('active', true)
      .order('ranking_score', { ascending: false })
      .order('rating', { ascending: false })
      .limit(6)
      .then(({ data }) => setTop((data as any) || []));
  }, []);

  // Pensamentos do Vini — discretos, somem só na interação do usuário
  const thoughts = [
    'Posso encontrar um prestador próximo ✨',
    'Diga ou digite o que precisa',
    '+2.450 profissionais agora',
    'Quer economizar? Pergunte sobre combos',
    'Estou aqui — só falar comigo',
    'Vou organizar tudo na sua agenda',
  ];
  useEffect(() => {
    setThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dismissThought = () => {
    if (!thought) return;
    setThought(null);
    // próximo pensamento aparece após nova interação ociosa
    if (thoughtTimer.current) window.clearTimeout(thoughtTimer.current);
    thoughtTimer.current = window.setTimeout(() => {
      setThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
    }, 8000);
  };

  // Mostra até 6 segmentos no grid principal (igual mockup: 5 + scroll horizontal)
  const segs = segments.slice(0, 10);

  return (
    <div
      className="relative h-full overflow-y-auto px-3 pt-3 pb-8"
      onScroll={dismissThought}
      onPointerDown={dismissThought}
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, hsl(255 60% 22%) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 80% 80%, hsl(220 70% 14%) 0%, transparent 60%),' +
          'linear-gradient(180deg, hsl(228 50% 6%) 0%, hsl(225 55% 4%) 100%)',
      }}
    >
      {/* ===================== HERO CARD: VINI + BUSCA ===================== */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto max-w-2xl rounded-[28px] p-3 sm:p-4"
        style={{
          background:
            'linear-gradient(160deg, hsl(255 55% 28% / 0.85), hsl(228 60% 14% / 0.92))',
          boxShadow:
            '0 22px 60px -22px hsl(265 90% 45% / 0.6),' +
            'inset 0 1px 0 hsl(0 0% 100% / 0.12),' +
            'inset 0 -3px 14px hsl(265 80% 30% / 0.3)',
          border: '1px solid hsl(265 70% 60% / 0.35)',
        }}
      >
        <div className="flex items-center gap-3">
          <motion.img
            src={viniAvatar}
            alt="Vini"
            className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 drop-shadow-[0_6px_22px_rgba(168,140,255,0.65)]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-display font-bold text-lg sm:text-2xl leading-tight text-center">
              Descreva o que <span className="text-violet-200">você precisa</span>
            </h2>
            <div className="mt-2 flex gap-2">
              <button
                onClick={onMic}
                disabled={!micSupported}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold transition-all
                  ${micListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/95 text-violet-700 hover:bg-white shadow-[0_8px_22px_-8px_rgba(168,140,255,0.8)]'}
                  ${!micSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={micSupported ? 'Falar' : 'Reconhecimento de voz indisponível'}
              >
                <Mic className="w-4 h-4" /> Falar
              </button>
              <button
                onClick={onSearch}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold bg-white/95 text-violet-700 hover:bg-white shadow-[0_8px_22px_-8px_rgba(168,140,255,0.8)]"
              >
                <Search className="w-4 h-4" /> BUSCAR
              </button>
            </div>
          </div>
        </div>

        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Digite ou fale: 'preciso de uma manicure...'"
          className="mt-2 w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-violet-400/60"
        />
      </motion.div>

      {/* ===================== TOP 3 PRESTADORES (faixa fotográfica grande) ===================== */}
      {top.length > 0 && (
        <div className="mt-3 mx-auto max-w-2xl rounded-[24px] overflow-hidden p-1.5"
          style={{
            background: 'linear-gradient(160deg, hsl(225 50% 18% / 0.7), hsl(225 55% 8% / 0.85))',
            border: '1px solid hsl(225 40% 35% / 0.4)',
            boxShadow: '0 14px 40px -18px hsl(265 80% 40% / 0.45)',
          }}
        >
          <div className="grid grid-cols-3 gap-1.5">
            {top.slice(0, 3).map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ y: -2 }}
                onClick={onSearch}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden"
                style={{
                  boxShadow:
                    '0 10px 24px -12px rgba(0,0,0,.7),' +
                    'inset 0 1px 0 rgba(255,255,255,.15),' +
                    'inset 0 -2px 0 rgba(0,0,0,.5)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-900 to-slate-900 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-violet-300/40" />
                  </div>
                )}
                {/* Microfone decorativo no topo (lembra mockup) */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full bg-white/20 backdrop-blur-sm" />
                {p.is_top_provider && (
                  <div className="absolute top-1.5 right-1.5">
                    <TopProviderBadge active size="xs" label="TOP" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* (bolha estática removida — sugestões agora aparecem como pensamento do Vini perto do avatar) */}

      {/* ===================== SEGMENTOS 3D ===================== */}
      <div className="mt-3 mx-auto max-w-2xl">
        <div className="grid grid-cols-5 gap-2">
          {segs.slice(0, 5).map((seg) => (
            <SegmentCard
              key={seg.id}
              seg={seg}
              active={activeSegments.includes(seg.id)}
              onClick={() => toggleSegment(seg.id)}
            />
          ))}
        </div>
        {segs.length > 5 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            {segs.slice(5).map((seg) => (
              <div key={seg.id} className="snap-start shrink-0 w-[19%] min-w-[80px]">
                <SegmentCard
                  seg={seg}
                  active={activeSegments.includes(seg.id)}
                  onClick={() => toggleSegment(seg.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================== MAIS PROCURADOS PERTO DE VOCÊ ===================== */}
      {top.length > 0 && (
        <div
          className="mt-4 mx-auto max-w-2xl rounded-[24px] p-3"
          style={{
            background: 'linear-gradient(160deg, hsl(225 40% 18% / 0.85), hsl(225 50% 9% / 0.92))',
            border: '1px solid hsl(225 35% 40% / 0.35)',
            boxShadow: '0 16px 44px -20px hsl(265 80% 40% / 0.5), inset 0 1px 0 rgba(255,255,255,.06)',
          }}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-white text-sm font-bold">Mais procurados perto de você</h3>
            <button onClick={onSearch} className="text-[11px] text-violet-300 hover:text-violet-200">
              Ver todos
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {top.slice(0, 3).map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ y: -2 }}
                onClick={onSearch}
                className="rounded-xl overflow-hidden text-left"
                style={{
                  background: 'hsl(225 30% 14%)',
                  border: '1px solid rgba(255,255,255,.06)',
                  boxShadow: '0 8px 20px -10px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.05)',
                }}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-violet-900/40 to-slate-900 overflow-hidden">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-violet-300/40" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1">
                    <p className="text-[12px] font-bold text-white truncate flex-1">{p.name}</p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-300">
                      <Star className="w-2.5 h-2.5 fill-amber-300" /> {(p.rating ?? 4.5).toFixed(1)}
                    </span>
                    <TopProviderBadge active={p.is_top_provider} size="xs" label="TOP" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {children && (
        <div className="mt-4 mx-auto max-w-2xl">
          {children}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Card de segmento 3D (igual mockup)
   ============================================================ */
function SegmentCard({
  seg, active, onClick,
}: {
  seg: SegmentItem; active: boolean; onClick: () => void;
}) {
  const Icon = pickIcon(seg.label);
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="group relative flex flex-col items-center justify-end overflow-hidden rounded-2xl aspect-[3/4] p-1.5"
      style={{
        background: active
          ? 'linear-gradient(160deg, hsl(28 95% 55%), hsl(20 85% 42%))'
          : 'linear-gradient(160deg, hsl(225 30% 22%), hsl(225 40% 11%))',
        boxShadow: active
          ? '0 10px 24px -10px hsl(28 95% 55% / 0.75), inset 0 1px 0 hsl(0 0% 100% / 0.35), inset 0 -2px 6px hsl(20 85% 30% / 0.5)'
          : '0 8px 20px -10px hsl(225 50% 0% / 0.7), inset 0 1px 0 hsl(0 0% 100% / 0.1), inset 0 -2px 6px hsl(225 60% 5% / 0.6)',
        border: '1px solid ' + (active ? 'hsl(28 95% 70% / 0.55)' : 'hsl(225 30% 40% / 0.4)'),
      }}
    >
      {/* Imagem 3D do segmento (ocupa quase todo o card) */}
      <div className="absolute inset-1 top-1 bottom-7 rounded-xl overflow-hidden flex items-center justify-center">
        {seg.image_url ? (
          <img
            src={seg.image_url}
            alt={seg.label}
            className="w-full h-full object-cover drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
          />
        ) : (
          <Icon className="w-8 h-8 text-white/85 drop-shadow-[0_3px_6px_rgba(0,0,0,.5)]" />
        )}
      </div>
      {/* Label */}
      <span
        className="relative z-10 w-full text-center text-[9px] sm:text-[10px] font-bold leading-tight truncate px-0.5"
        style={{ color: active ? 'white' : 'hsl(225 20% 90%)' }}
      >
        {seg.label}
      </span>
    </motion.button>
  );
}
