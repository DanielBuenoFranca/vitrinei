import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Wallet, User as UserIcon, Sparkles, Mic, Plus,
  Search, MessageCircle, Bot, LogIn, Settings, X, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ViniScene } from '@/components/vini/ViniScene';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/contexts/ThemeContext';
import { getGreeting, getRandomMoodSuggestion } from '@/lib/viniBrain';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { semanticSearch } from '@/data/searchData';
import { cn } from '@/lib/utils';

type Bubble = { role: 'vini' | 'user'; text: string; id: string };

const ViniHome = () => {
  const navigate = useNavigate();
  const { user, signOut, displayName } = useAuth();
  const { profileLabel } = usePermissions();
  const { theme } = useTheme();
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  const greeting = useMemo(() => getGreeting(), []);
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { id: 'g1', role: 'vini', text: greeting },
    { id: 'g2', role: 'vini', text: 'Diga "Olá Vini" ou toque no microfone para começar.' },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice → input
  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  const pushBubble = (b: Omit<Bubble, 'id'>) => {
    setBubbles((prev) => [...prev.slice(-3), { ...b, id: `${Date.now()}-${Math.random()}` }]);
  };

  const handleVoiceTap = () => {
    if (listening) {
      stop();
      if (text.trim()) sendQuery(text);
      return;
    }
    if (supported) {
      start();
      pushBubble({ role: 'vini', text: 'Estou ouvindo… 🎙️' });
    } else {
      // fallback: random mood suggestion + open input
      const s = getRandomMoodSuggestion(history);
      pushBubble({ role: 'vini', text: s.text });
      setShowInput(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendQuery = (q: string) => {
    const query = q.trim();
    if (!query) return;
    pushBubble({ role: 'user', text: query });
    setHistory((h) => [...h, query]);
    setText('');

    // run semantic search
    setTimeout(() => {
      const result = semanticSearch(query);
      const total = (result.products?.length || 0) + (result.services?.length || 0);
      if (total > 0) {
        pushBubble({
          role: 'vini',
          text: `Encontrei ${total} opções para "${query}". Vou te mostrar agora!`,
        });
        setTimeout(() => {
          navigate(`/?q=${encodeURIComponent(query)}`);
          // landing legacy fallback for full results
          window.location.href = `/?q=${encodeURIComponent(query)}`;
        }, 900);
      } else {
        const s = getRandomMoodSuggestion([...history, query]);
        pushBubble({ role: 'vini', text: `Hmm, não achei "${query}" agora. ${s.text}` });
      }
    }, 600);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(text);
    setShowInput(false);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      {/* 3D scene fills background */}
      <ViniScene />

      {/* gradient overlays for legibility */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-32 pointer-events-none z-10',
          theme === 'espacial'
            ? 'bg-gradient-to-b from-background/80 to-transparent'
            : 'bg-gradient-to-b from-background/70 to-transparent'
        )}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 h-40 pointer-events-none z-10',
          theme === 'espacial'
            ? 'bg-gradient-to-t from-background/80 to-transparent'
            : 'bg-gradient-to-t from-background/70 to-transparent'
        )}
      />

      {/* ─── Header ─── */}
      <header className="absolute top-0 inset-x-0 z-30 px-3 sm:px-5 pt-3">
        <div className="glass rounded-2xl flex items-center justify-between gap-2 px-3 py-2">
          {/* user / brand */}
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

      {/* ─── Floating action menu (right of Vini) ─── */}
      <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        {[
          { icon: Search, label: 'Buscar', action: () => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); } },
          { icon: MessageCircle, label: 'Chat', action: () => pushBubble({ role: 'vini', text: getRandomMoodSuggestion(history).text }) },
          { icon: Bot, label: 'Vini', action: handleVoiceTap },
        ].map((it, i) => (
          <motion.button
            key={it.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={it.action}
            className="glass w-11 h-11 rounded-xl flex items-center justify-center text-foreground hover:text-primary transition-colors"
            title={it.label}
          >
            <it.icon className="w-4.5 h-4.5" />
          </motion.button>
        ))}
      </div>

      {/* ─── Greeting & speech bubbles (top-center) ─── */}
      <div className="absolute top-24 sm:top-28 inset-x-0 z-20 flex flex-col items-center px-4 pointer-events-none">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center font-display text-xl sm:text-2xl md:text-3xl font-semibold leading-tight text-glow"
        >
          Bem-vindo.
          <br />
          <span className="text-[hsl(var(--text-accent))]">Diga "Vini, posso ajudar?"</span>
        </motion.h1>
      </div>

      {/* ─── Speech bubbles around Vini ─── */}
      <div className="absolute inset-x-0 bottom-44 sm:bottom-56 z-20 flex flex-col items-center gap-2 px-4 pointer-events-none">
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

      {/* ─── Microphone CTA ─── */}
      <div className="absolute inset-x-0 bottom-28 sm:bottom-36 z-20 flex flex-col items-center gap-2 px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center pointer-events-none"
        >
          <p className="text-sm sm:text-base font-medium">
            Diga <span className="text-[hsl(var(--text-accent))] font-bold text-glow">"Olá Vini"</span>
          </p>
          <p className="text-[11px] text-muted-foreground">…ou toque para começar</p>
        </motion.div>

        <div className="relative">
          {/* pulse rings */}
          {listening && (
            <>
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
              <span className="absolute inset-0 rounded-full bg-accent/30 animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleVoiceTap}
            className={cn(
              'relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all',
              'bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground vini-ring',
              listening && 'ring-4 ring-primary/40'
            )}
            aria-label={listening ? 'Parar microfone' : 'Iniciar microfone'}
          >
            <Mic className={cn('w-7 h-7 sm:w-8 sm:h-8', listening && 'animate-pulse')} />
          </motion.button>
        </div>

        {/* concentric rings decor */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full border border-[hsl(var(--vini-glow)/0.2)]" />
          <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-[hsl(var(--vini-glow)/0.12)]" />
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-[hsl(var(--vini-glow)/0.06)]" />
        </div>
      </div>

      {/* ─── Text input drawer (when keyboard typing) ─── */}
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

      {/* ─── Bottom nav (minimal icons) ─── */}
      <nav className="absolute bottom-0 inset-x-0 z-30 px-3 pb-3">
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
      </nav>
    </div>
  );
};

export default ViniHome;
