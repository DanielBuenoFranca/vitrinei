import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Wallet, User as UserIcon, Sparkles, Mic, Plus,
  Bot, LogIn, Settings, X, Send, Radar, Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ViniScene } from '@/components/vini/ViniScene';
import { ViniSideButtons } from '@/components/vini/ViniSideButtons';
import { ViniBottomGrid, type GridItem } from '@/components/vini/ViniBottomGrid';
import { ViniStoryCard } from '@/components/vini/ViniStoryCard';
import { ViniConversationModal } from '@/components/vini/ViniConversationModal';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useCart } from '@/contexts/CartContext';
import { getGreeting } from '@/lib/viniBrain';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { semanticSearch } from '@/data/searchData';
import { cn } from '@/lib/utils';

type Bubble = { role: 'vini' | 'user'; text: string; id: string; ts: number };

const CHAT_STORAGE_KEY = 'vini:chat-history';

const ViniHome = () => {
  const navigate = useNavigate();
  const { user, signOut, displayName } = useAuth();
  const { profileLabel } = usePermissions();
  const { totalCartItems, productCart, serviceCart } = useCart();
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  const [hasInteracted, setHasInteracted] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Bubble[]) : [];
    } catch { return []; }
  });
  const [history, setHistory] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showDemoSubmenu, setShowDemoSubmenu] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [storyOpen, setStoryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [radarActive, setRadarActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef('');
  const autoSubmitTimerRef = useRef<number | null>(null);

  const emitEmotion = (e: 'idle' | 'happy' | 'sad' | 'angry' | 'thinking' | 'listening') => {
    window.dispatchEvent(new CustomEvent('vini:emotion', { detail: e }));
  };

  // Sync voice transcript -> text input + auto-submit when user pauses
  useEffect(() => {
    if (!transcript) return;
    setText(transcript);
    lastSpokenRef.current = transcript;

    if (autoSubmitTimerRef.current) window.clearTimeout(autoSubmitTimerRef.current);
    autoSubmitTimerRef.current = window.setTimeout(() => {
      const final = lastSpokenRef.current.trim();
      if (final && listening) {
        try { stop(); } catch {}
        sendQuery(final);
      } else if (final && !listening) {
        sendQuery(final);
      }
    }, 1200);

    return () => {
      if (autoSubmitTimerRef.current) window.clearTimeout(autoSubmitTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  useEffect(() => {
    emitEmotion(listening ? 'listening' : 'idle');
  }, [listening]);

  // Welcome back if user came back to home with cart items
  useEffect(() => {
    if (hasInteracted && totalCartItems > 0 && bubbles.length > 0) {
      const last = bubbles[bubbles.length - 1];
      if (last.role !== 'vini' || !last.text.includes('carrinho')) return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushBubble = (b: Omit<Bubble, 'id' | 'ts'>) => {
    setBubbles((prev) => {
      const next = [...prev, { ...b, id: `${Date.now()}-${Math.random()}`, ts: Date.now() }];
      try { sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setChatExpanded(true);
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const clearChat = () => {
    setBubbles([]);
    try { sessionStorage.removeItem(CHAT_STORAGE_KEY); } catch {}
  };

  const buildGreeting = () => {
    const base = getGreeting();
    const cartHint = totalCartItems > 0
      ? ` Você tem ${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'} no carrinho. Ok, o que mais vamos buscar?`
      : '';
    if (user && displayName) {
      return `${base.replace(/^[^\s]+\s/, '')} — que bom te ver, ${displayName.split(' ')[0]}!${cartHint}`;
    }
    return base + cartHint;
  };

  const wakeUp = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      pushBubble({ role: 'vini', text: buildGreeting() });
    }
  };

  const handleAvatarClick = () => {
    wakeUp();
    setSideOpen((v) => !v);
    window.dispatchEvent(new CustomEvent('vini:click'));
  };

  const handleVoiceTap = () => {
    wakeUp();
    setSearchBarVisible(true);
    if (listening) {
      stop();
      if (text.trim()) sendQuery(text);
      return;
    }
    if (supported) {
      start();
      setTimeout(() => pushBubble({ role: 'vini', text: 'Estou ouvindo… 🎙️' }), 200);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const analyzeAndRoute = (query: string) => {
    const q = query.toLowerCase();
    if (/(carrinho|comprar|finalizar|checkout|pagamento)/.test(q)) {
      return { reply: 'Vou te levar para finalizar sua compra agora.', route: '/jornada-cliente' };
    }
    if (/(carteira|saldo|cashback|extrato)/.test(q)) {
      return { reply: 'Abrindo sua carteira para você conferir o saldo.', route: '/carteira' };
    }
    if (/(loja|vitrine|minha loja|vender)/.test(q)) {
      return { reply: 'Te levando para sua vitrine agora.', route: user ? '/mei' : '/auth' };
    }
    if (/(assinatura|plano|elite)/.test(q)) {
      return { reply: 'Vamos conferir os planos disponíveis.', route: '/assinatura' };
    }
    if (/(login|entrar|cadastr)/.test(q)) {
      return { reply: 'Vou te levar para o cadastro.', route: '/auth' };
    }
    if (/(demo|demonstra|conhecer|exemplo)/.test(q)) {
      return { reply: 'Posso te mostrar uma demonstração.', route: '/demos' };
    }
    return null;
  };

  const sendQuery = (q: string) => {
    const query = q.trim();
    if (!query) return;
    wakeUp();
    setLastTranscript(query);
    pushBubble({ role: 'user', text: query });
    setHistory((h) => [...h, query]);
    setText('');
    emitEmotion('thinking');

    setTimeout(() => {
      const intent = analyzeAndRoute(query);
      if (intent) {
        emitEmotion('happy');
        pushBubble({ role: 'vini', text: intent.reply });
        setTimeout(() => navigate(intent.route), 1100);
        return;
      }

      const result = semanticSearch(query, history);
      const total = (result.products?.length || 0) + (result.services?.length || 0);

      if (total > 0) {
        emitEmotion('happy');
        pushBubble({
          role: 'vini',
          text: `Encontrei ${total} opções para "${query}". Levando você para a busca!`,
        });
        setTimeout(() => navigate(`/buscar?q=${encodeURIComponent(query)}`), 1000);
      } else {
        emitEmotion('sad');
        pushBubble({
          role: 'vini',
          text: `Nada no estoque local para "${query}". Vou buscar fora da base com sugestões 🔎`,
        });
        setTimeout(() => navigate(`/buscar?q=${encodeURIComponent(query)}&fora=1`), 1300);
      }
    }, 500);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(text);
    setSearchBarVisible(false);
  };

  const handleSideSearch = () => {
    wakeUp();
    setSideOpen(false);
    setSearchBarVisible(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleSideConverse = () => {
    setSideOpen(false);
    setChatOpen(true);
  };

  const handleSideStory = () => {
    setSideOpen(false);
    setStoryOpen(true);
  };

  // ─── Bottom-grid actions ───
  const handleHome = () => {
    wakeUp();
    if (totalCartItems > 0) {
      pushBubble({
        role: 'vini',
        text: `Você tem ${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'} no carrinho. Ok, o que mais vamos buscar?`,
      });
    } else {
      pushBubble({ role: 'vini', text: 'Estamos no Home. Por onde começamos?' });
    }
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleRadar = () => {
    wakeUp();
    // Toggle desligar
    if (radarActive) {
      setRadarActive(false);
      pushBubble({ role: 'vini', text: 'Radar desativado. Quando quiser, é só me chamar de novo.' });
      return;
    }
    setRadarActive(true);
    if (totalCartItems > 0) {
      pushBubble({
        role: 'vini',
        text: `📡 Radar ativado com seus ${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'} do carrinho. Confirme a compra para acionar os prestadores próximos.`,
      });
      setTimeout(() => navigate('/jornada-cliente?urgencia=1'), 1100);
    } else {
      pushBubble({
        role: 'vini',
        text: '📡 Radar pré-ativado. Faça uma busca e selecione um item — vou tratar como Urgência e acionar o prestador disponível mais próximo.',
      });
      setTimeout(() => inputRef.current?.focus(), 200);
      setSearchBarVisible(true);
    }
  };

  const handleIndicacao = () => navigate('/convite/INDIQUE');
  const handlePerfil = () => navigate(user ? '/carteira' : '/auth');
  const handleDemos = () => navigate('/demos');

  const gridItems: GridItem[] = [
    { key: 'home', icon: Home, label: 'Home', onClick: handleHome, active: true },
    { key: 'radar', icon: Radar, label: 'Radar', onClick: handleRadar, active: radarActive, badge: totalCartItems > 0 ? totalCartItems : undefined },
    { key: 'perfil', icon: UserIcon, label: 'Perfil', onClick: handlePerfil },
    { key: 'indica', icon: Gift, label: 'Indicação', onClick: handleIndicacao, highlight: 'R$ 5,00' },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <ViniScene />

      {/* light gradient overlays for legibility */}
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none z-10 bg-gradient-to-b from-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-10 bg-gradient-to-t from-background/40 to-transparent" />

      {/* ─── Header ─── */}
      <header className="absolute top-0 inset-x-0 z-30 px-3 sm:px-5 pt-3">
        <div className="glass rounded-2xl flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center vini-ring">
                <span className="text-sm font-bold text-primary-foreground">
                  {(displayName || 'V')[0].toUpperCase()}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-background" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-bold truncate">{displayName || 'Vitrinei'}</p>
              <p className="text-[10px] text-[hsl(var(--text-accent))] truncate">
                {user ? profileLabel : 'Visitante'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeSwitcher />
            {user ? (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 glass" onClick={signOut}>
                Sair
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 glass" onClick={() => navigate('/auth')}>
                <LogIn className="w-3.5 h-3.5" /> Visitante
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Plus menu top-right ─── */}
      <div className="absolute top-20 right-3 sm:right-5 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPlusMenu((v) => !v)}
          className="glass w-10 h-10 rounded-xl"
          aria-label="Mais opções"
        >
          {showPlusMenu ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
        <AnimatePresence>
          {showPlusMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-12 glass-strong rounded-xl p-1.5 min-w-[200px] space-y-0.5"
            >
              <button
                onClick={() => setShowDemoSubmenu((v) => !v)}
                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-primary/10 rounded-md transition-colors flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Demo
                </span>
                <span className="text-[10px] text-muted-foreground">{showDemoSubmenu ? '▾' : '▸'}</span>
              </button>
              <AnimatePresence>
                {showDemoSubmenu && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden pl-2 border-l border-border ml-2 space-y-0.5"
                  >
                    {[
                      { label: 'Demonstrações', icon: '📱', to: '/demos' },
                      { label: 'Fluxos', icon: '🔄', to: '/processos' },
                      { label: 'Gestão', icon: '🔧', to: '/gestao' },
                      { label: 'Jornada Cliente', icon: '🛒', to: '/jornada-cliente' },
                      { label: 'MEI', icon: '📊', to: '/mei-acompanhamento' },
                      { label: 'Drop', icon: '🌐', to: '/dropshipping' },
                      { label: 'Central', icon: '🎧', to: '/central-atendimento' },
                    ].map((it) => (
                      <button
                        key={it.to}
                        onClick={() => { setShowPlusMenu(false); setShowDemoSubmenu(false); navigate(it.to); }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary/10 rounded-md transition-colors flex items-center gap-2"
                      >
                        <span className="w-4 text-center">{it.icon}</span> {it.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { setShowPlusMenu(false); navigate('/admin'); }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" /> Administrador
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invisible center tap zone to wake Vini (greeting text removed per spec) */}
      <button
        type="button"
        onClick={handleAvatarClick}
        aria-label="Acordar Vini"
        className="absolute left-1/2 top-[58%] sm:top-[62%] -translate-x-1/2 -translate-y-1/2 z-20 w-32 h-32 bg-transparent border-0 p-0 cursor-pointer"
      />
      {/* keep motion import used elsewhere */}
      {false && <motion.span />}

      {/* ─── Right-edge action buttons (open from avatar click) ─── */}
      <ViniSideButtons
        open={sideOpen}
        onSearch={handleSideSearch}
        onConverse={handleSideConverse}
        onStory={handleSideStory}
      />

      {/* ─── Bottom-left grid (Home, Radar, Indicação, Perfil, Demos) ─── */}
      <ViniBottomGrid items={gridItems} />

      {/* ─── Live transcript while listening ─── */}
      <AnimatePresence>
        {(listening || (transcript && transcript === lastTranscript)) && (transcript || lastTranscript) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 top-[18%] z-30 pointer-events-none px-4 w-full max-w-md"
          >
            <div className="glass-strong rounded-2xl px-4 py-2.5 text-center border border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                {listening ? 'Ouvindo…' : 'Você disse'}
              </p>
              <p className="text-sm sm:text-base font-medium text-foreground">"{transcript || lastTranscript}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Conversation history panel (holographic, no scrollbar) ─── */}
      {hasInteracted && bubbles.length > 0 && (
        <div className="absolute right-2 sm:right-3 top-24 sm:top-28 z-30 w-[78%] sm:w-[300px] max-w-sm pointer-events-auto">
          <div
            className={cn(
              'rounded-2xl overflow-hidden',
              'bg-white/[0.06] backdrop-blur-xl',
              'border-[0.5px] border-[hsl(var(--vini-glow)/0.4)]',
              'shadow-[0_0_24px_hsl(var(--vini-glow)/0.18)]',
            )}
          >
            <button
              onClick={() => setChatExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 border-b border-white/10 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Bot className="w-3 h-3 text-primary" strokeWidth={1.5} />
                <span className="text-[10.5px] font-semibold text-foreground/90">Histórico</span>
                <span className="text-[9px] text-muted-foreground">({bubbles.length})</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); clearChat(); }}
                  className="text-[9px] text-muted-foreground hover:text-destructive px-1 py-0.5 rounded"
                  title="Limpar conversa"
                >
                  Limpar
                </span>
                <span className="text-[9px] text-muted-foreground">{chatExpanded ? '▾' : '▸'}</span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {chatExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    ref={chatScrollRef}
                    className="max-h-[26vh] overflow-y-auto px-2.5 py-2 flex flex-col gap-1.5 no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {bubbles.map((b) => (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'flex flex-col max-w-[88%]',
                          b.role === 'user' ? 'self-end items-end' : 'self-start items-start',
                        )}
                      >
                        <span className="text-[8.5px] uppercase tracking-wider text-muted-foreground/80 mb-0.5 px-1">
                          {b.role === 'user' ? (displayName?.split(' ')[0] || 'Você') : 'Vini'}
                          <span className="ml-1 opacity-60">
                            {new Date(b.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                        <div
                          className={cn(
                            'px-2.5 py-1.5 rounded-2xl text-[12px] leading-snug',
                            b.role === 'user'
                              ? 'bg-primary/85 text-primary-foreground rounded-br-sm shadow-[0_0_10px_hsl(var(--primary)/0.3)]'
                              : 'bg-white/[0.08] backdrop-blur-sm text-foreground border-[0.5px] border-[hsl(var(--vini-glow)/0.35)] rounded-bl-sm',
                          )}
                        >
                          {b.text}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ─── Search bar: hidden by default, slides up from bottom edge (footer) ─── */}
      <AnimatePresence>
        {(searchBarVisible || listening || !!text.trim()) && (
          <motion.form
            key="search-bar"
            onSubmit={handleTextSubmit}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[calc(58px+0.75rem+0.5rem)] sm:left-[calc(58px+0.75rem+0.75rem)] right-[calc(48px+0.5rem+0.5rem)] sm:right-[calc(48px+0.75rem+0.75rem)] bottom-2 sm:bottom-3 z-30 pointer-events-auto"
          >
            <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.08] backdrop-blur-xl border-[0.5px] border-[hsl(var(--vini-glow)/0.5)] shadow-[0_0_22px_hsl(var(--vini-glow)/0.2)] h-12">
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={() => {
                  setTimeout(() => {
                    if (!text.trim() && !listening) setSearchBarVisible(false);
                  }, 150);
                }}
                autoFocus
                placeholder="Pesquisa por voz ou texto…"
                className="border-0 bg-transparent focus-visible:ring-0 text-sm flex-1 px-3 placeholder:text-foreground/50 h-9"
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-full shrink-0 bg-white/[0.1] hover:bg-white/[0.18] border-[0.5px] border-[hsl(var(--vini-glow)/0.5)] text-foreground"
                disabled={!text.trim()}
                aria-label="Enviar"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ─── Floating mic trigger — bottom right edge ─── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleVoiceTap}
        className={cn(
          'absolute right-2 sm:right-3 bottom-2 sm:bottom-3 z-40',
          'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
          'bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground',
          'shadow-[0_0_18px_hsl(var(--primary)/0.55)]',
          listening && 'ring-2 ring-primary/60',
        )}
        aria-label={listening ? 'Parar microfone' : 'Falar com o Vini'}
      >
        {listening && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
            <span className="absolute inset-0 rounded-full bg-accent/30 animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
          </>
        )}
        <Mic className={cn('w-5 h-5 relative', listening && 'animate-pulse')} strokeWidth={1.5} />
      </motion.button>

      {/* ─── Modals ─── */}
      <ViniStoryCard
        open={storyOpen}
        onClose={() => setStoryOpen(false)}
        onReferralClick={() => { setStoryOpen(false); navigate('/convite/INDIQUE'); }}
      />
      <ViniConversationModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        userName={displayName}
      />
    </div>
  );
};

export default ViniHome;
