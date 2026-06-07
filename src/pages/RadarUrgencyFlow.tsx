import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Radar, MapPin, Star, CheckCircle2, Bike, Phone, MessageCircle,
  X, ShieldCheck, Loader2, Sparkles, Award,
} from 'lucide-react';
import { Radar3DScene } from '@/components/radar/Radar3DScene';
import { DeliveryMap } from '@/components/radar/DeliveryMap';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Phase =
  | 'searching'   // Radar 3D pulsando, procurando
  | 'found'       // Prestadores aparecem nos pins
  | 'zooming'     // Camera mergulha + transição para o mapa
  | 'enroute'     // Mapa com prestador a caminho
  | 'arrived'     // Prestador chegou — solicita PIN
  | 'rating'      // Cliente avalia
  | 'done';       // Entregue + selo registrado

interface MockProvider {
  id: number;
  name: string;
  segment: string;
  rating: number;
  vehicle: string;
  eta: number;
  lat: number;
  lng: number;
}

const FALLBACK_CITY: [number, number] = [-23.5505, -46.6333]; // São Paulo
const PIN_LENGTH = 4;

function generateMockProviders(center: [number, number]): MockProvider[] {
  // Gera 3 prestadores em raio de ~700-1500m
  const seeds = [
    { name: 'Carlos Silva', segment: 'Entrega Rápida', rating: 4.9, vehicle: '🏍️', eta: 8, dx: 0.008, dy: 0.005 },
    { name: 'Marcos Tech', segment: 'Eletricista', rating: 4.7, vehicle: '🚗', eta: 12, dx: -0.011, dy: 0.007 },
    { name: 'Ana Express', segment: 'Encanador', rating: 4.8, vehicle: '🏍️', eta: 10, dx: 0.006, dy: -0.009 },
  ];
  return seeds.map((s, i) => ({
    id: 100 + i,
    name: s.name,
    segment: s.segment,
    rating: s.rating,
    vehicle: s.vehicle,
    eta: s.eta,
    lat: center[0] + s.dy,
    lng: center[1] + s.dx,
  }));
}

const RadarUrgencyFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { totalCartItems, totalCartValue, clearCart } = useCart();

  // Itens vindos da URL (carrinho persistido em querystring quando vem do CartBar)
  const cartFromUrl = useMemo(() => {
    try {
      const s = JSON.parse(searchParams.get('services') || '[]');
      const p = JSON.parse(searchParams.get('products') || '[]');
      return { services: s, products: p, count: s.length + p.length };
    } catch {
      return { services: [], products: [], count: 0 };
    }
  }, [searchParams]);

  const itemCount = totalCartItems || cartFromUrl.count || 1;
  const orderTotal = totalCartValue || cartFromUrl.products.reduce((s: number, x: any) => s + (x.price || 0) * (x.quantity || 1), 0) + cartFromUrl.services.reduce((s: number, x: any) => s + (x.price || 0), 0);

  // Localização do usuário
  const [userLoc, setUserLoc] = useState<[number, number]>(FALLBACK_CITY);
  const [locReady, setLocReady] = useState(false);

  useEffect(() => {
    if (!('geolocation' in navigator)) { setLocReady(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc([pos.coords.latitude, pos.coords.longitude]); setLocReady(true); },
      () => { setLocReady(true); }, // mantém fallback
      { enableHighAccuracy: false, timeout: 4000 },
    );
  }, []);

  // Estado do fluxo
  const [phase, setPhase] = useState<Phase>('searching');
  const [foundCount, setFoundCount] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [providers, setProviders] = useState<MockProvider[]>([]);
  const [chosen, setChosen] = useState<MockProvider | null>(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const [pinTyped, setPinTyped] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Gera PIN aleatório (mostrado ao cliente; "prestador" deve digitá-lo na chegada)
  const expectedPin = useMemo(() => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }, []);

  // Sequência: searching -> found -> zooming -> enroute
  useEffect(() => {
    if (!locReady) return;
    let cancelled = false;

    (async () => {
      // Try to use REAL providers from DB; fallback to mocks if none.
      let realMocks: MockProvider[] = [];
      try {
        const { data } = await supabase
          .from('providers')
          .select('id, name, segment, rating')
          .order('rating', { ascending: false })
          .limit(3);
        if (data && data.length > 0) {
          const vehicles = ['🏍️', '🚗', '🚐'];
          realMocks = data.map((p: any, i: number) => ({
            id: typeof p.id === 'number' ? p.id : 100 + i,
            name: p.name || `Prestador ${i + 1}`,
            segment: Array.isArray(p.segment) ? p.segment[0] : (p.segment || 'Serviço'),
            rating: Number(p.rating) || 4.7,
            vehicle: vehicles[i % vehicles.length],
            eta: 8 + i * 2,
            lat: userLoc[0] + (Math.random() - 0.5) * 0.018,
            lng: userLoc[1] + (Math.random() - 0.5) * 0.018,
          }));
        }
      } catch { /* fallback */ }

      const mocks = realMocks.length ? realMocks : generateMockProviders(userLoc);
      if (cancelled) return;
      setProviders(mocks);

      const t1 = setTimeout(() => setFoundCount(1), 1400);
      const t2 = setTimeout(() => setFoundCount(2), 2300);
      const t3 = setTimeout(() => setFoundCount(3), 3100);
      const t4 = setTimeout(() => setPhase('found'), 3300);
      const t5 = setTimeout(() => {
        const best = [...mocks].sort((a, b) => b.rating - a.rating)[0];
        setChosen(best);
        setPhase('zooming');
      }, 4800);

      return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
    })();

    return () => { cancelled = true; };
  }, [locReady, userLoc]);

  // Animação de zoom 3D -> map
  useEffect(() => {
    if (phase !== 'zooming') return;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setZoom(Math.min(1, frame / 30));
      if (frame >= 30) {
        clearInterval(id);
        setTimeout(() => setPhase('enroute'), 200);
      }
    }, 50);
    return () => clearInterval(id);
  }, [phase]);

  // Animação do trajeto no mapa
  useEffect(() => {
    if (phase !== 'enroute') return;
    let frame = 0;
    const total = 80; // ~12s
    const id = setInterval(() => {
      frame++;
      setRouteProgress(Math.min(1, frame / total));
      if (frame >= total) {
        clearInterval(id);
        setTimeout(() => setPhase('arrived'), 400);
      }
    }, 150);
    return () => clearInterval(id);
  }, [phase]);

  const handleConfirmPin = () => {
    if (pinTyped.trim() === expectedPin) {
      toast({ title: '✅ Entrega confirmada!', description: 'PIN validado com sucesso.' });
      setPhase('rating');
    } else {
      toast({ title: 'PIN incorreto', description: 'Confira o código de 4 dígitos.', variant: 'destructive' });
    }
  };

  const handleSubmitRating = async () => {
    if (stars === 0 || !chosen) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('provider_ratings').insert({
        provider_id: chosen.id,
        user_id: user?.id ?? null,
        stars,
        comment: comment.trim() || null,
        context: {
          source: 'radar_urgencia',
          item_count: itemCount,
          order_total: orderTotal,
          provider_name: chosen.name,
          eta_min: chosen.eta,
        },
      });
      if (error) throw error;
      toast({ title: '⭐ Avaliação registrada!', description: `Selo de qualidade computado para ${chosen.name}.` });
      setPhase('done');
    } catch (e: any) {
      toast({ title: 'Erro ao avaliar', description: e?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    clearCart();
    navigate('/');
  };

  const providerStart: [number, number] = chosen ? [chosen.lat, chosen.lng] : [userLoc[0] + 0.008, userLoc[1] + 0.008];

  return (
    <div className="fixed inset-0 z-[80] bg-background overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Radar className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-tight">Radar Urgência</p>
            <p className="text-[10px] text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'} • R$ {orderTotal.toFixed(2)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFinish}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Phase 1-3: Radar 3D */}
      <AnimatePresence mode="wait">
        {(phase === 'searching' || phase === 'found' || phase === 'zooming') && (
          <motion.div
            key="radar3d"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'zooming' ? 1 - zoom * 0.7 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Radar3DScene phase={phase} foundCount={foundCount} zoom={zoom} />

            {/* Status overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
              <div className="max-w-md mx-auto space-y-2 text-center">
                {phase === 'searching' && (
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <Badge className="bg-primary/20 text-primary border-primary/40 mb-2 gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando prestadores próximos…
                    </Badge>
                    <p className="text-sm text-foreground font-semibold">📡 Escaneando 1.5 km ao redor</p>
                    <p className="text-xs text-muted-foreground">{foundCount} {foundCount === 1 ? 'prestador encontrado' : 'prestadores encontrados'}</p>
                  </motion.div>
                )}
                {phase === 'found' && chosen === null && (
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <Badge className="bg-success/20 text-success border-success/40 mb-2 gap-1">
                      <Sparkles className="w-3 h-3" /> {providers.length} prestadores online
                    </Badge>
                    <p className="text-sm text-foreground font-semibold">Selecionando melhor avaliado…</p>
                  </motion.div>
                )}
                {(phase === 'found' || phase === 'zooming') && chosen && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Card className="bg-card/80 backdrop-blur-md border-success/40">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-xl">
                          {chosen.vehicle}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{chosen.name} aceitou!</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                            {chosen.rating} • ETA {chosen.eta} min
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 4: Map enroute */}
      {(phase === 'enroute' || phase === 'arrived') && chosen && (
        <motion.div
          key="map"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pt-16 pb-4 px-3 sm:px-4 flex flex-col gap-3"
        >
          <div className="flex-1 min-h-0">
            <DeliveryMap
              customer={userLoc}
              providerStart={providerStart}
              progress={routeProgress}
              active={phase === 'enroute'}
            />
          </div>

          {/* Provider card */}
          <Card className="bg-card/95 backdrop-blur-md border-primary/30 shrink-0">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-success/20 flex items-center justify-center text-2xl">
                  {chosen.vehicle}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{chosen.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" /> {chosen.rating}</span>
                    <span>•</span>
                    <span>{chosen.segment}</span>
                  </p>
                  {phase === 'enroute' && (
                    <p className="text-[10px] text-primary font-semibold mt-0.5 flex items-center gap-1">
                      <Bike className="w-3 h-3" /> A caminho • {Math.max(1, Math.round(chosen.eta * (1 - routeProgress)))} min
                    </p>
                  )}
                  {phase === 'arrived' && (
                    <p className="text-[10px] text-success font-bold mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Chegou! Confirme com PIN
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => toast({ title: '📞 Ligando...', description: chosen.name })}>
                    <Phone className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => toast({ title: '💬 Chat', description: 'Conversa aberta' })}>
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {phase === 'enroute' && (
                <div className="space-y-1">
                  <Progress value={routeProgress * 100} className="h-1.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>📍 Origem</span>
                    <span>{Math.round(routeProgress * 100)}%</span>
                    <span>🏠 Você</span>
                  </div>
                </div>
              )}

              {phase === 'arrived' && (
                <div className="bg-primary/10 rounded-lg p-3 space-y-2 border border-primary/30">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seu PIN de validação</p>
                    <p className="text-3xl font-mono font-bold text-primary tracking-[0.5em] mt-1">{expectedPin}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Mostre ao prestador para confirmar a entrega</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={pinTyped}
                      onChange={(e) => setPinTyped(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
                      placeholder="Digite o PIN aqui"
                      className="h-9 text-center font-mono tracking-widest text-lg"
                      maxLength={PIN_LENGTH}
                      inputMode="numeric"
                    />
                    <Button
                      onClick={handleConfirmPin}
                      disabled={pinTyped.length !== PIN_LENGTH}
                      className="gap-1"
                    >
                      <ShieldCheck className="w-4 h-4" /> Confirmar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Phase 5: Rating */}
      {phase === 'rating' && chosen && (
        <motion.div
          key="rating"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <Card className="w-full max-w-md border-primary/30 shadow-xl">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-9 h-9 text-success" />
                </motion.div>
                <h2 className="text-lg font-bold text-foreground">Entrega concluída!</h2>
                <p className="text-xs text-muted-foreground">
                  Avalie {chosen.name} e contribua para o <strong className="text-primary">Selo de Qualidade</strong>
                </p>
              </div>

              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setStars(n)}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`${n} estrelas`}
                  >
                    <Star
                      className={cn(
                        'w-9 h-9 transition-colors',
                        n <= stars ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-muted-foreground/40',
                      )}
                    />
                  </button>
                ))}
              </div>

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte como foi (opcional)..."
                className="min-h-[70px] text-sm resize-none"
                maxLength={300}
              />

              <Button
                className="w-full gap-2"
                onClick={handleSubmitRating}
                disabled={stars === 0 || submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Registrar avaliação no Ranking
              </Button>
              <button
                onClick={() => setPhase('done')}
                className="text-[11px] text-muted-foreground hover:text-foreground w-full text-center"
              >
                Pular avaliação
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Phase 6: Done */}
      {phase === 'done' && (
        <motion.div
          key="done"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center p-4 bg-background"
        >
          <Card className="w-full max-w-md border-success/40 shadow-xl">
            <CardContent className="p-6 text-center space-y-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-success to-primary flex items-center justify-center shadow-lg"
              >
                <Award className="w-11 h-11 text-white" />
              </motion.div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Tudo certo! 🎉</h2>
                <p className="text-sm text-muted-foreground">
                  Pedido finalizado e avaliação registrada no ranking dos prestadores.
                </p>
              </div>
              {chosen && stars > 0 && (
                <div className="bg-muted/30 rounded-lg p-3 text-left">
                  <p className="text-xs text-muted-foreground">Você avaliou</p>
                  <p className="text-sm font-bold text-foreground">{chosen.name}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn('w-4 h-4', n <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={handleFinish}>
                Voltar à Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default RadarUrgencyFlow;
