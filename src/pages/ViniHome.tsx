import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Wallet, User as UserIcon, Sparkles, Mic, Plus,
  Search, MessageCircle, Bot, LogIn, Settings, X, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ViniScene } from '@/components/vini/ViniScene';
import { ViniAvatar } from '@/components/vini/ViniAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/contexts/ThemeContext';
import { getGreeting, getRandomMoodSuggestion } from '@/lib/viniBrain';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { semanticSearch } from '@/data/searchData';
import { cn } from '@/lib/utils';

type Bubble = { role: 'vini' | 'user'; text: string; id: string };

const AUTO_HIDE_MS = 5000;

const ViniHome = () => {
  const navigate = useNavigate();
  const { user, signOut, displayName } = useAuth();
  const { profileLabel } = usePermissions();
  const { theme } = useTheme();
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  const [hasInteracted, setHasInteracted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Track speech state
  const lastSpokenRef = useRef('');
  const autoSubmitTimerRef = useRef<number | null>(null);

  // Helper: emit emotion to the 3D scene
  const emitEmotion = (e: 'idle' | 'happy' | 'sad' | 'angry' | 'thinking' | 'listening') => {
    window.dispatchEvent(new CustomEvent('vini:emotion', { detail: e }));
  };

  // Sync voice transcript -> text input + auto-submit when user pauses
  useEffect(() => {
    if (!transcript) return;
    setText(transcript);
    lastSpokenRef.current = transcript;

    // Reset auto-submit timer: when the user stops talking for ~1.2s, fire the search
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

  // Drive emotion from listening state
  useEffect(() => {
    emitEmotion(listening ? 'listening' : 'idle');
  }, [listening]);

  // Auto-hide menu after 5s of inactivity
  const scheduleHide = () => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setMenuOpen(false), AUTO_HIDE_MS);
  };
  const cancelHide = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  useEffect(() => () => cancelHide(), []);

  const pushBubble = (b: Omit<Bubble, 'id'>) => {
    setBubbles((prev) => [...prev.slice(-3), { ...b, id: `${Date.now()}-${Math.random()}` }]);
  };

  const buildGreeting = () => {
    const base = getGreeting();
    if (user && displayName) {
      return `${base.replace(/^[^\s]+\s/, '')} — que bom te ver, ${displayName.split(' ')[0]}!`;
    }
    return base;
  };

  const wakeUp = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      pushBubble({ role: 'vini', text: buildGreeting() });
    }
  };

  // Click on avatar = primary trigger: opens menu + wakes Vini + 3D bounce
  const handleAvatarClick = () => {
    wakeUp();
    setMenuOpen(true);
    scheduleHide();
    window.dispatchEvent(new CustomEvent('vini:click'));
  };

  const handleVoiceTap = () => {
    wakeUp();
    setMenuOpen(true);
    scheduleHide();
    if (listening) {
      stop();
      if (text.trim()) sendQuery(text);
      return;
    }
    if (supported) {
      start();
      setTimeout(() => pushBubble({ role: 'vini', text: 'Estou ouvindo… 🎙️' }), 200);
    } else {
      const s = getRandomMoodSuggestion(history);
      pushBubble({ role: 'vini', text: s.text });
      setShowInput(true);
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
    pushBubble({ role: 'user', text: query });
    setHistory((h) => [...h, query]);
    setText('');
    scheduleHide();
    emitEmotion('thinking');

    setTimeout(() => {
      // [acao] — direct routing intents
      const intent = analyzeAndRoute(query);
      if (intent) {
        emitEmotion('happy');
        pushBubble({ role: 'vini', text: intent.reply });
        setTimeout(() => navigate(intent.route), 1100);
        return;
      }

      // [detalhamento] — semantic search across providers' stock
      const result = semanticSearch(query, history);
      const total = (result.products?.length || 0) + (result.services?.length || 0);

      if (total > 0) {
        emitEmotion('happy');
        pushBubble({
          role: 'vini',
          text: `Encontrei ${total} opções para "${query}". Levando você para a busca!`,
        });
        setTimeout(() => {
          navigate(`/buscar?q=${encodeURIComponent(query)}`);
        }, 1000);
      } else {
        // Nothing in the providers' stock → suggest external search
        emitEmotion('sad');
        pushBubble({
          role: 'vini',
          text: `Nada no estoque local para "${query}". Vou buscar fora da base com sugestões 🔎`,
        });
        setTimeout(() => {
          navigate(`/buscar?q=${encodeURIComponent(query)}&fora=1`);
        }, 1300);
      }
    }, 500);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(text);
    setShowInput(false);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <ViniScene />

      {/* light gradient overlays for legibility — kept subtle so the 3D office is visible */}
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
              className="absolute right-0 top-12 glass-strong rounded-xl p-1.5 min-w-[180px] space-y-0.5"
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
                  onClick={() => { setShowPlusMenu(false); navigate(it.to); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary/10 rounded-md transition-colors flex items-center gap-2"
                >
                  <span className="w-4 text-center">{it.icon}</span> {it.label}
                </button>
              ))}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { setShowPlusMenu(false); navigate('/admin'); }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" /> Painel Administrativo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Central stage: Avatar + lateral menu ─── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="relative pointer-events-auto" onMouseEnter={cancelHide} onMouseLeave={menuOpen ? scheduleHide : undefined}>
          {/* Stacked-glass tabs menu — hidden behind avatar until interaction */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, x: -40, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.8 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-1/2 -translate-y-1/2 left-full ml-2 sm:ml-4 z-40"
              >
                <div className="relative">
                  {/* layered glass tabs (depth) */}
                  <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl glass opacity-40 border border-[hsl(var(--vini-glow)/0.2)]" />
                  <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-3xl glass opacity-20 border border-[hsl(var(--vini-glow)/0.15)]" />
                  <div className="relative glass-strong rounded-3xl p-2.5 flex flex-col gap-2 border border-[hsl(var(--vini-glow)/0.45)] shadow-[0_0_30px_hsl(var(--vini-glow)/0.25)]">
                    {[
                      { icon: Search, label: 'Buscar', action: () => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); scheduleHide(); } },
                      { icon: MessageCircle, label: 'Sugestão', action: () => { pushBubble({ role: 'vini', text: getRandomMoodSuggestion(history).text }); scheduleHide(); } },
                      { icon: Bot, label: 'Vini', action: handleVoiceTap },
                    ].map((it, i) => (
                      <motion.button
                        key={it.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + i * 0.08 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={it.action}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-[hsl(var(--text-accent))] hover:text-primary hover:bg-primary/10 transition-colors border border-[hsl(var(--vini-glow)/0.25)]"
                        title={it.label}
                      >
                        <it.icon className="w-5 h-5" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Avatar itself — primary interaction trigger */}
          <ViniAvatar onClick={handleAvatarClick} size={typeof window !== 'undefined' && window.innerWidth < 640 ? 240 : 320} />

          {/* Greeting label below avatar */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 sm:-bottom-2 whitespace-nowrap">
            <motion.p
              key={hasInteracted ? 'greeted' : 'idle'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center font-display text-base sm:text-lg font-semibold text-glow"
            >
              {hasInteracted && user && displayName
                ? `Olá, ${displayName.split(' ')[0]} !!`
                : 'Olá, Eu sou o Vini !!'}
            </motion.p>
          </div>

          {/* Microphone button — proportional to avatar, sits just below greeting */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-20 sm:-bottom-24 flex flex-col items-center gap-1.5 pointer-events-auto">
            <div className="relative">
              {listening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
                  <span className="absolute inset-0 rounded-full bg-accent/30 animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleVoiceTap}
                className={cn(
                  'relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all',
                  'bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground vini-ring shadow-lg',
                  listening && 'ring-4 ring-primary/40'
                )}
                aria-label={listening ? 'Parar microfone' : 'Falar com o Vini'}
              >
                <Mic className={cn('w-5 h-5 sm:w-6 sm:h-6', listening && 'animate-pulse')} />
              </motion.button>
            </div>
            <span className="text-[10px] text-[hsl(var(--text-accent))] font-medium tracking-wide">
              {listening ? 'Ouvindo…' : 'Toque para falar'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Live transcript while listening ─── */}
      <AnimatePresence>
        {listening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 top-[62%] sm:top-[58%] z-30 pointer-events-none px-4 w-full max-w-md"
          >
            <div className="glass-strong rounded-2xl px-4 py-2.5 text-center border border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                Você disse
              </p>
              <p className="text-sm sm:text-base font-medium text-foreground">"{transcript}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Speech bubbles — only after interaction ─── */}
      {hasInteracted && (
        <div className="absolute inset-x-0 bottom-32 sm:bottom-40 z-20 flex flex-col items-center gap-2 px-4 pointer-events-none">
          <AnimatePresence>
            {bubbles.slice(-2).map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'glass-strong px-4 py-2 rounded-2xl max-w-[88%] sm:max-w-md text-sm shadow-lg',
                  b.role === 'user'
                    ? 'self-end mr-4 sm:mr-12 bg-primary/15 border-primary/30'
                    : 'self-start ml-4 sm:ml-12'
                )}
              >
                {b.role === 'vini' && (
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--text-accent))] font-bold mr-1">
                    Vini
                  </span>
                )}
                {b.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* mic now lives next to the avatar; standalone floating mic removed */}

      {/* ─── Text input drawer ─── */}
      <AnimatePresence>
        {showInput && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onSubmit={handleTextSubmit}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md"
          >
            <div className="glass-strong rounded-2xl flex items-center gap-2 p-2">
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pergunte qualquer coisa ao Vini…"
                className="border-0 bg-transparent focus-visible:ring-0 text-sm flex-1"
              />
              <Button type="submit" size="icon" className="h-9 w-9 rounded-xl shrink-0">
                <Send className="w-4 h-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-xl shrink-0" onClick={() => setShowInput(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ─── Bottom nav (hidden behind avatar until interaction) ─── */}
      <AnimatePresence>
        {(menuOpen || hasInteracted) && (
          <motion.nav
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.85 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 inset-x-0 z-30 px-3 pb-3"
            onMouseEnter={cancelHide}
            onMouseLeave={menuOpen ? scheduleHide : undefined}
          >
            <div className="glass rounded-2xl flex items-center justify-around py-2.5">
              {[
                { icon: Home, label: 'Home', to: '/', active: true },
                { icon: Wallet, label: 'Carteira', to: '/carteira' },
                { icon: UserIcon, label: 'Perfil', to: user ? '/carteira' : '/auth' },
                { icon: Sparkles, label: 'Demos', to: '/demos' },
              ].map((it) => (
                <button
                  key={it.label}
                  onClick={() => navigate(it.to)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                    it.active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label={it.label}
                >
                  <it.icon className="w-5 h-5" />
                  <span className="text-[9px]">{it.label}</span>
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViniHome;
