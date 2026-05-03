import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Search, Sparkles, Star } from 'lucide-react';
import { Wrench, Scissors, Droplets, Sprout, Truck, Hammer, Stethoscope, GraduationCap, Car, Home, Brush, ShoppingBag } from 'lucide-react';
import viniAvatar from '@/assets/vini-avatar.png';
import { supabase } from '@/integrations/supabase/client';
import { TopProviderBadge } from '@/components/TopProviderBadge';

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearch: () => void;
  onMic: () => void;
  micListening?: boolean;
  micSupported?: boolean;
  segments: { id: string; label: string; name: string }[];
  activeSegments: string[];
  toggleSegment: (id: string) => void;
}

const DEFAULT_ICONS: Record<string, any> = {
  serviços: Wrench, servicos: Wrench, doméstico: Home, domestico: Home,
  beleza: Scissors, encanador: Droplets, jardinagem: Sprout, frete: Truck, fretes: Truck,
  reforma: Hammer, saúde: Stethoscope, saude: Stethoscope, educação: GraduationCap, educacao: GraduationCap,
  auto: Car, automotivo: Car, limpeza: Brush, varejo: ShoppingBag,
};

function pickIcon(label: string) {
  const k = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const key of Object.keys(DEFAULT_ICONS)) {
    if (k.includes(key)) return DEFAULT_ICONS[key];
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
  segments, activeSegments, toggleSegment,
}: Props) {
  const [top, setTop] = useState<Top[]>([]);

  useEffect(() => {
    supabase.from('providers')
      .select('id,name,logo_url,rating,is_top_provider,segment')
      .eq('active', true)
      .order('ranking_score', { ascending: false })
      .order('rating', { ascending: false })
      .limit(6)
      .then(({ data }) => setTop((data as any) || []));
  }, []);

  return (
    <div className="relative px-3 pt-2 pb-3 overflow-y-auto h-full">
      {/* Background ambiente 3D */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, hsl(265 60% 25% / 0.35) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, hsl(220 70% 18% / 0.4) 0%, transparent 55%), linear-gradient(180deg, hsl(225 45% 6%) 0%, hsl(225 50% 4%) 100%)',
        }}
      />

      {/* Hero card 3D — Vini + busca */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto max-w-2xl rounded-3xl p-4 sm:p-5"
        style={{
          background:
            'linear-gradient(145deg, hsl(250 50% 22% / 0.85), hsl(225 55% 14% / 0.9))',
          boxShadow:
            '0 18px 50px -20px hsl(265 80% 40% / 0.55), inset 0 1px 0 hsl(0 0% 100% / 0.08), inset 0 -2px 12px hsl(265 80% 30% / 0.25)',
          border: '1px solid hsl(265 60% 50% / 0.25)',
        }}
      >
        <div className="flex items-start gap-3">
          <motion.img
            src={viniAvatar}
            alt="Vini"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 drop-shadow-[0_4px_18px_rgba(168,140,255,0.55)]"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-display font-bold text-base sm:text-xl leading-tight">
              Descreva o que <span className="text-violet-300">você precisa</span>
            </h2>
            <div className="mt-2 flex gap-2">
              <button
                onClick={onMic}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-all
                  ${micListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/95 text-violet-700 hover:bg-white shadow-[0_6px_18px_-6px_rgba(168,140,255,0.7)]'}
                  ${!micSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!micSupported}
                title={micSupported ? 'Falar' : 'Reconhecimento de voz indisponível'}
              >
                <Mic className="w-4 h-4" /> Falar
              </button>
              <button
                onClick={onSearch}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-[0_6px_18px_-6px_rgba(124,58,237,0.8)] hover:from-violet-300 hover:to-violet-500"
              >
                <Search className="w-4 h-4" /> BUSCAR
              </button>
            </div>
          </div>
        </div>

        {/* Input visível abaixo (acessibilidade + digitação) */}
        <div className="mt-3">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Digite ou fale: 'preciso de uma manicure...'"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-violet-400/60"
          />
        </div>

        {/* "Posso te ajudar..." Vini bubble */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-md">
          <img src={viniAvatar} alt="" className="w-5 h-5 rounded-full" />
          <span className="text-[12px] text-violet-900/90">
            Posso te ajudar a encontrar um prestador de serviços próximo
          </span>
        </div>
      </motion.div>

      {/* Segmentos 3D */}
      <div className="mt-4 mx-auto max-w-2xl">
        <div className="grid grid-cols-5 gap-2">
          {segments.slice(0, 10).map((seg) => {
            const Icon = pickIcon(seg.label);
            const active = activeSegments.includes(seg.id);
            return (
              <motion.button
                key={seg.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => toggleSegment(seg.id)}
                className="group relative flex flex-col items-center justify-center rounded-2xl px-1.5 py-2 text-[10px] font-semibold transition-all"
                style={{
                  background: active
                    ? 'linear-gradient(145deg, hsl(28 95% 55%), hsl(20 85% 45%))'
                    : 'linear-gradient(145deg, hsl(225 30% 20%), hsl(225 35% 12%))',
                  boxShadow: active
                    ? '0 8px 20px -8px hsl(28 95% 55% / 0.7), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
                    : '0 4px 14px -6px hsl(225 50% 0% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.06)',
                  border: '1px solid ' + (active ? 'hsl(28 95% 65% / 0.5)' : 'hsl(225 30% 35% / 0.4)'),
                  color: active ? 'white' : 'hsl(225 20% 80%)',
                }}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate w-full text-center leading-tight">{seg.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mais procurados perto de você */}
      {top.length > 0 && (
        <div className="mt-4 mx-auto max-w-2xl rounded-3xl p-3"
          style={{
            background: 'linear-gradient(145deg, hsl(225 35% 16% / 0.85), hsl(225 45% 10% / 0.9))',
            boxShadow: '0 14px 40px -18px hsl(265 80% 40% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.06)',
            border: '1px solid hsl(225 35% 35% / 0.3)',
          }}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-white text-sm font-bold">Mais procurados perto de você</h3>
            <button onClick={onSearch} className="text-[11px] text-violet-300 hover:text-violet-200">Ver todos</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {top.slice(0, 3).map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -2 }}
                className="rounded-xl overflow-hidden bg-card/40 border border-white/5"
                style={{ boxShadow: '0 6px 16px -8px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)' }}
              >
                <div className="aspect-square bg-gradient-to-br from-violet-900/30 to-slate-900/60 flex items-center justify-center overflow-hidden">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-violet-300/50" />
                  )}
                </div>
                <div className="p-1.5">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-bold text-white truncate flex-1">{p.name}</p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-300">
                      <Star className="w-2.5 h-2.5 fill-amber-300" /> {(p.rating ?? 4.5).toFixed(1)}
                    </span>
                    <TopProviderBadge active={p.is_top_provider} size="xs" label="TOP" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
