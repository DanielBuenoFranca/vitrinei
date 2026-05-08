import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Search, Sparkles, Star, Store, Wrench as WrenchIcon, Package as PackageIcon, LayoutGrid } from 'lucide-react';
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
  typeFilter?: 'all' | 'service' | 'product';
  setTypeFilter?: (v: 'all' | 'service' | 'product') => void;
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
  segments, activeSegments, toggleSegment, typeFilter = 'all', setTypeFilter, children,
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
      className="relative h-full overflow-y-auto px-3 pt-3 pb-20"
      onScroll={dismissThought}
      onPointerDown={dismissThought}
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, hsl(255 60% 22%) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 80% 80%, hsl(220 70% 14%) 0%, transparent 60%),' +
          'linear-gradient(180deg, hsl(228 50% 6%) 0%, hsl(225 55% 4%) 100%)',
      }}
    >
      {/* Pensamento discreto do Vini — canto superior esquerdo, transparente */}
      <AnimatePresence>
        {thought && (
          <motion.div
            key={thought}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.4 }}
            className="fixed top-1.5 left-2 z-30 max-w-[60%] pointer-events-none select-none"
          >
            <span className="text-[10.5px] italic text-white/55 leading-tight tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              💭 {thought}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== HERO CARD COMPACTO: VINI + BUSCA ===================== */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto max-w-2xl rounded-2xl p-2"
        style={{
          background:
            'linear-gradient(160deg, hsl(255 55% 28% / 0.85), hsl(228 60% 14% / 0.92))',
          boxShadow:
            '0 14px 36px -18px hsl(265 90% 45% / 0.55),' +
            'inset 0 1px 0 hsl(0 0% 100% / 0.1)',
          border: '1px solid hsl(265 70% 60% / 0.32)',
        }}
      >
        <div className="flex items-center gap-2">
          <motion.img
            src={viniAvatar}
            alt="Vini"
            className="w-10 h-10 shrink-0 drop-shadow-[0_4px_14px_rgba(168,140,255,0.6)]"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Digite ou fale o que precisa…"
            className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:border-violet-400/60"
          />
          <button
            onClick={onMic}
            disabled={!micSupported}
            className={`shrink-0 flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-all
              ${micListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-white/95 text-violet-700 hover:bg-white'}
              ${!micSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={micSupported ? 'Falar' : 'Reconhecimento de voz indisponível'}
          >
            <Mic className="w-3.5 h-3.5" /> Falar
          </button>
          <button
            onClick={onSearch}
            className="shrink-0 flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-bold bg-white/95 text-violet-700 hover:bg-white"
          >
            <Search className="w-3.5 h-3.5" /> Buscar
          </button>
        </div>
      </motion.div>

      {/* ===================== SEGMENTOS — carrossel horizontal compacto ===================== */}
      <div className="mt-3 mx-auto max-w-2xl">
        <SectionTitle>Segmentos</SectionTitle>
        <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-1 -mx-1 px-1">
          {setTypeFilter && (
            <>
              <CarouselTile>
                <TypeFilterCard label="Tudo" icon={LayoutGrid}
                  gradient="linear-gradient(160deg, hsl(255 60% 35%), hsl(225 65% 18%))"
                  active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
              </CarouselTile>
              <CarouselTile>
                <TypeFilterCard label="Serviços" icon={WrenchIcon}
                  gradient="linear-gradient(160deg, hsl(210 80% 45%), hsl(220 70% 22%))"
                  active={typeFilter === 'service'} onClick={() => setTypeFilter('service')} />
              </CarouselTile>
              <CarouselTile>
                <TypeFilterCard label="Produtos" icon={PackageIcon}
                  gradient="linear-gradient(160deg, hsl(160 70% 40%), hsl(170 75% 20%))"
                  active={typeFilter === 'product'} onClick={() => setTypeFilter('product')} />
              </CarouselTile>
            </>
          )}
          {segs.map((seg) => (
            <CarouselTile key={seg.id}>
              <SegmentCard seg={seg} active={activeSegments.includes(seg.id)}
                onClick={() => toggleSegment(seg.id)} />
            </CarouselTile>
          ))}
        </div>
      </div>

      {/* ===================== MAIS PROCURADOS — carrossel compacto ===================== */}
      {top.length > 0 && (
        <div className="mt-4 mx-auto max-w-2xl">
          <SectionTitle action={<button onClick={onSearch} className="text-[10px] text-violet-300/80 hover:text-violet-200">Ver todos</button>}>
            Mais procurados perto de você
          </SectionTitle>
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-1 -mx-1 px-1">
            {top.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ y: -2 }}
                onClick={onSearch}
                className="snap-start shrink-0 w-[96px] rounded-xl overflow-hidden text-left"
                style={{
                  background: 'hsl(225 30% 14%)',
                  border: '1px solid rgba(255,255,255,.06)',
                  boxShadow: '0 8px 20px -10px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.05)',
                }}
              >
                <div className="aspect-square bg-gradient-to-br from-violet-900/40 to-slate-900 overflow-hidden relative">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-violet-300/40" />
                    </div>
                  )}
                  {p.is_top_provider && (
                    <div className="absolute top-1 right-1">
                      <TopProviderBadge active size="xs" label="TOP" />
                    </div>
                  )}
                </div>
                <div className="px-1.5 py-1">
                  <p className="text-[10px] font-bold text-white truncate leading-tight">{p.name}</p>
                  <span className="flex items-center gap-0.5 text-[9px] text-amber-300 mt-0.5">
                    <Star className="w-2 h-2 fill-amber-300" /> {(p.rating ?? 4.5).toFixed(1)}
                  </span>
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

/* Título discreto de seção */
function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-1.5 px-1">
      <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/55">{children}</h3>
      {action}
    </div>
  );
}

/* Wrapper para manter tamanho fixo dentro do carrossel */
function CarouselTile({ children }: { children: ReactNode }) {
  return <div className="snap-start shrink-0 w-[84px]">{children}</div>;
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
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl aspect-square w-full"
      style={{
        boxShadow: active
          ? '0 12px 28px -10px hsl(28 95% 55% / 0.7), inset 0 0 0 2px hsl(28 95% 65% / 0.9)'
          : '0 8px 20px -10px hsl(225 50% 0% / 0.7), inset 0 1px 0 hsl(0 0% 100% / 0.08)',
        border: '1px solid ' + (active ? 'hsl(28 95% 70% / 0.7)' : 'hsl(225 30% 35% / 0.45)'),
        background: 'hsl(225 35% 14%)',
      }}
    >
      {/* Imagem cobre todo o card */}
      {seg.image_url ? (
        <img
          src={seg.image_url}
          alt={seg.label}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900/40 to-slate-900">
          <Icon className="w-9 h-9 text-white/85 drop-shadow-[0_3px_6px_rgba(0,0,0,.5)]" />
        </div>
      )}
      {/* Overlay gradiente para legibilidade do label */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      {active && (
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 via-transparent to-transparent" />
      )}
      {/* Label */}
      <span
        className="absolute inset-x-0 bottom-0 px-1.5 py-1.5 text-center text-[10px] sm:text-[11px] font-bold leading-tight truncate"
        style={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        {seg.label}
      </span>
    </motion.button>
  );
}


/* ============================================================
   Card de filtro de tipo (Tudo / Serviços / Produtos)
   Mesmo padrão visual dos cards de segmento.
   ============================================================ */
function TypeFilterCard({
  label, icon: Icon, gradient, active, onClick,
}: {
  label: string;
  icon: any;
  gradient: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl aspect-square w-full"
      style={{
        background: gradient,
        boxShadow: active
          ? '0 12px 28px -10px hsl(28 95% 55% / 0.7), inset 0 0 0 2px hsl(28 95% 65% / 0.9)'
          : '0 8px 20px -10px hsl(225 50% 0% / 0.7), inset 0 1px 0 hsl(0 0% 100% / 0.12)',
        border: '1px solid ' + (active ? 'hsl(28 95% 70% / 0.7)' : 'hsl(225 30% 40% / 0.45)'),
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="w-10 h-10 text-white/90 drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-110" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      {active && (
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 via-transparent to-transparent" />
      )}
      <span
        className="absolute inset-x-0 bottom-0 px-1.5 py-1.5 text-center text-[10px] sm:text-[11px] font-bold leading-tight truncate"
        style={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        {label}
      </span>
    </motion.button>
  );
}
