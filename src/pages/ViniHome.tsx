import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Wallet, User as UserIcon, Sparkles, Mic, Plus,
  Bot, LogIn, Settings, X, Send, Radar, Gift, MapPin, ShoppingBag, Store, RotateCcw, Heart,
  Search, LifeBuoy
} from 'lucide-react';
import { FavoritesModal } from '@/components/FavoritesModal';
import { useFavorites } from '@/hooks/useFavorites';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ViniScene } from '@/components/vini/ViniScene';
import { ViniSideButtons } from '@/components/vini/ViniSideButtons';
import { ViniBottomGrid, type GridItem } from '@/components/vini/ViniBottomGrid';
import { ViniStoryCard } from '@/components/vini/ViniStoryCard';
import { RadarPulse } from '@/components/vini/RadarPulse';
import { ViniConversationModal } from '@/components/vini/ViniConversationModal';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useCart } from '@/contexts/CartContext';
import { getGreeting } from '@/lib/viniBrain';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { semanticSearch } from '@/data/searchData';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAiSession } from '@/contexts/AiSessionContext';

/**
 * Toda sugestão do Vini pode carregar uma `action` clicável.
 * - `route`  : navega diretamente (compatibilidade legado).
 * - `intent` : executa uma rotina interna do Vini sem sair da tela.
 *              Ex.: 'search' preenche a barra de busca e dispara a query
 *              como se o usuário tivesse digitado; 'story' abre o card
 *              "Sobre o Vini"; 'cart' abre o checkout; etc.
 * - `payload`: dados auxiliares (ex.: termo de busca).
 */
type BubbleIntent =
  | 'search'        // preenche barra e executa busca
  | 'open-search'   // só abre a barra de busca focada
  | 'story'         // abre card "Sobre o Vini"
  | 'cart'          // ir ao checkout
  | 'wallet'        // abrir carteira
  | 'radar'         // ativar urgência/radar
  | 'profile'       // abrir perfil
  | 'referral'      // página de indicação
  | 'demos'         // central de demos
  | 'mystore'       // minha loja
  | 'support';      // acionar central de atendimento (CRM)

type BubbleAction = {
  label: string;
  route?: string;
  intent?: BubbleIntent;
  payload?: string;
};
type Bubble = { role: 'vini' | 'user'; text: string; id: string; ts: number; action?: BubbleAction };

const CHAT_STORAGE_KEY = 'vini:chat-history';

const ViniHome = () => {
  const navigate = useNavigate();
  const { user, signOut, displayName } = useAuth();
  const { profileLabel } = usePermissions();
  const { session, update: updateAiSession } = useAiSession();
  const { totalCartItems, totalCartValue, productCart, serviceCart, clearCart } = useCart();
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();
  
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const { count: favoritesCount } = useFavorites();

  const [city, setCity] = useState<string | null>(null);
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  const [hasInteracted, setHasInteracted] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const lastSmallTalkRef = useRef<number>(0);
  const smallTalkCountRef = useRef<number>(0);
  const greetedKey = (uid?: string | null) => `vini:greeted${uid ? `:${uid}` : ''}`;
  const wasGreeted = (uid?: string | null) => {
    try { return !!localStorage.getItem(greetedKey(uid)); } catch { return false; }
  };
  const markGreeted = (uid?: string | null) => {
    try { localStorage.setItem(greetedKey(uid), '1'); } catch {}
  };
  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Bubble[]) : [];
    } catch { return []; }
  });
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('vini:search-history');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch { return []; }
  });
  const [text, setText] = useState('');
  const lastInteractionRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<number | null>(null);
  const lastGreetedUserRef = useRef<string | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showDemoSubmenu, setShowDemoSubmenu] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [storyOpen, setStoryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [refinementCount, setRefinementCount] = useState(0);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportItem, setSupportItem] = useState('');
  const [supportDetails, setSupportDetails] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [modalInitialMessage, setModalInitialMessage] = useState<string | null>(null);
  const [modalInitialModality, setModalInitialModality] = useState<'voice' | 'text'>('text');
  const [modalMode, setModalMode] = useState<'free' | 'commerce'>('free');
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchBarMode, setSearchBarMode] = useState<'chat' | 'search'>('chat');
  const [radarActive, setRadarActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef('');
  const autoSubmitTimerRef = useRef<number | null>(null);

  const emitEmotion = (e: 'idle' | 'happy' | 'sad' | 'angry' | 'thinking' | 'listening') => {
    window.dispatchEvent(new CustomEvent('vini:emotion', { detail: e }));
  };

  // Sync voice transcript -> text input. Auto-submit assim que o
  // reconhecimento termina (listening: true -> false) ou após 900ms de pausa.
  useEffect(() => {
    if (!transcript) return;
    setText(transcript);
    lastSpokenRef.current = transcript;
    if (autoSubmitTimerRef.current) window.clearTimeout(autoSubmitTimerRef.current);
    autoSubmitTimerRef.current = window.setTimeout(() => {
      const final = lastSpokenRef.current.trim();
      if (final) {
        try { stop(); } catch {}
        // Voz da tela principal → perfil SUPER VENDEDOR (busca/ai-router)
        console.log('[Vini] Voice auto-submit:', final);
        sendQuery(final);
        lastSpokenRef.current = '';
      }
    }, 900);
    return () => { if (autoSubmitTimerRef.current) window.clearTimeout(autoSubmitTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // Quando o navegador finaliza a captação (onend), envia o que houver.
  useEffect(() => {
    if (listening) return;
    const final = lastSpokenRef.current.trim();
    if (!final) return;
    if (autoSubmitTimerRef.current) window.clearTimeout(autoSubmitTimerRef.current);
    lastSpokenRef.current = '';
    // Tela principal: voz finaliza → vai para o vendedor (busca)
    console.log('[Vini] Voice final capture:', final);
    sendQuery(final);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  useEffect(() => {
    emitEmotion(listening ? 'listening' : 'idle');
  }, [listening]);

  // Load city + plan (discreet header info)
  useEffect(() => {
    if (!user) {
      setCity(null);
      setPlanLabel(null);
      // try geolocation reverse for visitors (best-effort, silent)
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const r = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10&addressdetails=1`,
                { headers: { 'Accept-Language': 'pt-BR' } }
              );
              const j = await r.json();
              const c = j?.address?.city || j?.address?.town || j?.address?.village || j?.address?.municipality;
              if (c) setCity(c);
            } catch {}
          },
          () => {},
          { timeout: 4000, maximumAge: 600000 }
        );
      }
      return;
    }
    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('city')
        .eq('user_id', user.id)
        .maybeSingle();
      if (prof?.city) setCity(prof.city);
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan,status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (sub?.plan) {
        const p = String(sub.plan).toLowerCase();
        const label = p === 'ouro' ? '🥇 Ouro' : p === 'prata' ? '🥈 Prata' : p === 'bronze' ? '🥉 Bronze' : sub.plan;
        setPlanLabel(label);
      }
      // Detect provider storefront for header shortcut
      const { data: provs } = await supabase
        .from('providers')
        .select('id,name')
        .eq('user_id', user.id)
        .limit(1);
      if (provs && provs.length > 0) {
        const slug = String(provs[0].name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        setStoreSlug(slug || String(provs[0].id));
      } else {
        setStoreSlug(null);
      }
    })();
  }, [user]);

  // ─── Greeting + idle logic helpers ───
  const hasGreetingInHistory = (list: Bubble[]) =>
    list.some(
      (b) =>
        b.role === 'vini' &&
        /(bom dia|boa tarde|boa noite|olá|oi|que bom te ver|bem-?vindo)/i.test(b.text),
    );

  const resetIdleTimer = () => {
    lastInteractionRef.current = Date.now();
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      // Only fire if user is still on Home and hasn't typed/clicked since
      if (Date.now() - lastInteractionRef.current < 59900) return;
      const lastUserBubble = [...bubbles].reverse().find((b) => b.role === 'user');
      const variants: { text: string; action?: BubbleAction }[] = [];

      if (history.length > 0) {
        const last = history[history.length - 1];
        variants.push({
          text: `Quer que eu retome a busca por "${last}"? Posso refinar com base na sua localização.`,
          action: { label: `Buscar "${last}"`, intent: 'search', payload: last },
        });
      }
      if (totalCartItems > 0) {
        variants.push({
          text: `Você tem ${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'} no carrinho. Quer finalizar agora?`,
          action: { label: 'Ir ao checkout', intent: 'cart' },
        });
      }
      variants.push({
        text: 'Curioso pra conhecer minha história? Toque aqui e eu te conto como tudo começou. ✨',
        action: { label: 'Sobre o Vini', intent: 'story' },
      });
      if (!lastUserBubble) {
        variants.push({
          text: 'Posso te sugerir um prestador perto de você agora — quer tentar uma busca rápida?',
          action: { label: 'Abrir busca', intent: 'open-search' },
        });
      }

      const pick = variants[Math.floor(Math.random() * variants.length)];
      pushBubble({ role: 'vini', text: pick.text, action: pick.action });
    }, 60000);
  };

  // Personalized greeting on login (fires only once per user, persisted)
  useEffect(() => {
    if (!user) {
      lastGreetedUserRef.current = null;
      return;
    }
    if (lastGreetedUserRef.current === user.id) return;
    lastGreetedUserRef.current = user.id;
    if (wasGreeted(user.id)) return;

    const name = displayName?.split(' ')[0] || 'amigo';
    const role = profileLabel || 'usuário';
    setBubbles((prev) => {
      const alreadyGreeted = hasGreetingInHistory(prev);
      const text = alreadyGreeted
        ? `De volta, ${name}! Quer continuar de onde parou?`
        : `${getGreeting().replace(/^[^\s]+\s/, '')} ${name}! Você está logado como ${role}. ${
            totalCartItems > 0 ? `Vi que tem ${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'} no carrinho.` : 'Em que posso te ajudar hoje?'
          }`;
      const next = [...prev, { role: 'vini' as const, text, id: `${Date.now()}-greet`, ts: Date.now() }];
      try { sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    markGreeted(user.id);
    setHasInteracted(true);
    setChatExpanded(true);
    resetIdleTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, displayName, profileLabel]);

  // Generic greeting for visitors when they open Home (only once, persisted)
  useEffect(() => {
    if (user) return; // logged-in path handled above
    if (wasGreeted(null) || hasGreetingInHistory(bubbles)) return;
    const t = window.setTimeout(() => {
      pushBubble({
        role: 'vini',
        text: `${getGreeting().replace(/^[^\s]+\s/, '')} Sou o Vini, seu assistente do Vitrinei. Pode falar comigo ou tocar no microfone — te ajudo a achar o que precisa. 👋`,
      });
      markGreeted(null);
      setHasInteracted(true);
      resetIdleTimer();
    }, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Persist search history across sessions
  useEffect(() => {
    try { localStorage.setItem('vini:search-history', JSON.stringify(history.slice(-20))); } catch {}
  }, [history]);

  // Arm the idle timer on mount + reset on any user activity, so the
  // autonomous "Vini puxa assunto" routine fires even for returning users
  // (when the once-only welcome greeting is suppressed).
  useEffect(() => {
    resetIdleTimer();
    const onActivity = () => {
      lastInteractionRef.current = Date.now();
      resetIdleTimer();
    };
    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('touchstart', onActivity, { passive: true });
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
    };
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
    // Any new bubble counts as activity — restart the 5s idle clock
    resetIdleTimer();
  };

  const openConversationWith = (message?: string, modality: 'voice' | 'text' = 'text') => {
    wakeUp();
    setSideOpen(false);
    setSearchBarVisible(false);
    setModalInitialModality(modality);
    setModalInitialMessage(message?.trim() || null);
    // Voz/Texto pela barra de busca → personalidade comercial completa.
    // Botão "Conversar" (sem mensagem inicial) → papo livre puro.
    setModalMode(message?.trim() ? 'commerce' : 'free');
    setChatOpen(true);
  };

  const clearChat = () => {
    setBubbles([]);
    try { sessionStorage.removeItem(CHAT_STORAGE_KEY); } catch {}
  };

  // Wake Vini WITHOUT duplicating the welcome message: if a greeting
  // already exists in the history, fall back to a continuity prompt.
  const wakeUp = () => {
    if (hasInteracted) return;
    setHasInteracted(true);
    if (hasGreetingInHistory(bubbles)) {
      pushBubble({
        role: 'vini',
        text: history.length > 0
          ? `Voltei! Quer continuar a busca por "${history[history.length - 1]}" ou tentar outra coisa?`
          : 'Voltei! Em que posso te ajudar agora?',
      });
    } else {
      const name = user && displayName ? displayName.split(' ')[0] : null;
      const cartHint = totalCartItems > 0
        ? ` Vi que tem ${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'} no carrinho.`
        : '';
      const text = name
        ? `${getGreeting().replace(/^[^\s]+\s/, '')} ${name}!${cartHint} Em que posso te ajudar?`
        : `${getGreeting().replace(/^[^\s]+\s/, '')} Sou o Vini.${cartHint} O que você precisa hoje?`;
      pushBubble({ role: 'vini', text });
    }
  };

  const handleAvatarClick = () => {
    wakeUp();
    setSideOpen(true);
    window.dispatchEvent(new CustomEvent('vini:click'));
  };

  // Small-talk variants when the user taps the screen background.
  // Vini "percebe" que o usuário está olhando e puxa um assunto leve.
  const SMALL_TALK = [
    'Tô por aqui se precisar — é só me dizer o que está procurando.',
    'Posso te sugerir algo perto de você agora mesmo?',
    'Quer que eu monte uma ideia rápida pro seu dia?',
    'Pensei em algo que talvez te interesse — quer ouvir?',
    'Se quiser, eu busco um prestador top da sua região.',
    'Me conta: tá precisando resolver alguma coisa hoje?',
  ];

  const handleScreenTap = () => {
    setSideOpen(true);
    if (!hasInteracted) { wakeUp(); return; }
    const now = Date.now();
    if (now - lastSmallTalkRef.current < 12000) return; // throttle
    if (smallTalkCountRef.current >= 4) return; // limit per visit
    lastSmallTalkRef.current = now;
    smallTalkCountRef.current += 1;
    const name = user && displayName ? displayName.split(' ')[0] : null;
    const base = SMALL_TALK[Math.floor(Math.random() * SMALL_TALK.length)];
    const text = name && Math.random() < 0.4 ? `${name}, ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base;
    pushBubble({ role: 'vini', text });
  };

  const handleVoiceTap = () => {
    wakeUp();
    if (listening) {
      stop();
      // Voz da tela principal → super vendedor (busca no ecossistema)
      if (text.trim()) sendQuery(text);
      return;
    }
    if (supported) {
      setSearchBarVisible(true);
      setSearchBarMode('search');
      start();
      setTimeout(() => pushBubble({ role: 'vini', text: 'Estou ouvindo… 🎙️ Me diga o que você precisa.' }), 200);
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

  const isThinkingRef = useRef(false);
  const pendingQueryRef = useRef<string | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const sendQuery = (q: string) => {
    console.log('[Vini] sendQuery starting for:', q);
    const query = q.trim();
    if (!query) return;
    // Se já está pensando, NÃO ignora: enfileira o pedido para rodar
    // assim que a resposta atual finalizar. Garante que toda fala/escrita
    // do usuário chegue ao Vini e tenha resposta.
    if (isThinkingRef.current) {
      console.warn('[Vini] ocupado — enfileirando próxima pergunta:', query);
      pendingQueryRef.current = query;
      pushBubble({ role: 'user', text: query });
      pushBubble({ role: 'vini', text: 'Anotei. Já te respondo essa também…' });
      return;
    }
    isThinkingRef.current = true;
    wakeUp();
    setLastTranscript(query);
    pushBubble({ role: 'user', text: query });
    setHistory((h) => [...h, query]);
    setText('');
    emitEmotion('thinking');

    const finalize = () => {
      console.log('[Vini] Finalizing interaction...');
      isThinkingRef.current = false;
      if (safetyTimerRef.current) { window.clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
      // Drena fila: se o usuário falou/escreveu enquanto pensávamos, processa agora
      const next = pendingQueryRef.current;
      if (next) {
        console.log('[Vini] Processing pending query:', next);
        pendingQueryRef.current = null;
        setTimeout(() => sendQuery(next), 150);
      }
    };

    // Failsafe: nunca deixa o Vini "mudo". Se algo travar (rede, SDK,
    // promise pendurada), libera o lock após 15s e mostra um aviso.
    safetyTimerRef.current = window.setTimeout(() => {
      if (!isThinkingRef.current) return;
      console.warn('[Vini] safety timeout — liberando lock');
      emitEmotion('sad');
      pushBubble({
        role: 'vini',
        text: 'Demorei demais para responder essa. Pode repetir ou tentar de outra forma?',
      });
      isThinkingRef.current = false;
      const next = pendingQueryRef.current;
      if (next) { pendingQueryRef.current = null; setTimeout(() => sendQuery(next), 150); }
    }, 15000);

    setTimeout(async () => {
      try {
        const intent = analyzeAndRoute(query);
        if (intent) {
          emitEmotion('happy');
          pushBubble({ role: 'vini', text: intent.reply });
          setTimeout(() => { navigate(intent.route); finalize(); }, 1100);
          return;
        }

        // Race: ai-router com timeout duro (8s). Se travar, cai no fallback local.
        let routed: any = null;
        let invokeError: any = null;
        try {
          console.log('[Vini] Invoking ai-router with query:', query);
          const invokePromise = supabase.functions.invoke('ai-router', { body: { message: query, session } });
          const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
            setTimeout(() => {
              console.warn('[Vini] ai-router 8s timeout reached');
              resolve({ data: null, error: new Error('ai-router timeout 8s') });
            }, 8000),
          );
          const res: any = await Promise.race([invokePromise, timeoutPromise]);
          routed = res?.data;
          invokeError = res?.error;
          if (invokeError) console.error('[Vini] ai-router error details:', invokeError);
        } catch (e) {
          console.error('[Vini] ai-router invocation exception:', e);
        }

        if (routed && !routed.error) {
          updateAiSession({ tags: routed.tags || [], segments: routed.segments || [], lastIntent: routed.intent, lastQuery: routed.query || query });
          
          if (routed.needs_more_info && refinementCount < 1) {
            setRefinementCount(prev => prev + 1);
            emitEmotion('thinking');
            pushBubble({
              role: 'vini',
              text: routed.follow_up_question || `Me conte mais um detalhe sobre "${query}" para eu buscar com precisão.`,
              action: (routed.suggestions || [])[0] ? { label: routed.suggestions[0], intent: 'search', payload: `${query} ${routed.suggestions[0]}` } : undefined,
            });
            finalize();
            return;
          }

          if (routed.intent !== 'search' || (routed.needs_more_info && refinementCount >= 1)) {
            // Se já refinamos uma vez ou não é busca, abre busca direta com o que temos para evitar loop
            const params = new URLSearchParams({ q: routed.query || query, type: routed.item_type || 'both' });
            if ((routed.segments || []).length) params.set('segments', routed.segments.join(','));
            emitEmotion('happy');
            pushBubble({ role: 'vini', text: routed.transition_message || `Entendi. Já estou abrindo a busca com o que conversamos.` });
            setTimeout(() => { navigate(`/buscar?${params.toString()}`); finalize(); }, 900);
            setRefinementCount(0); // Reseta após concluir
            return;
          }

          const params = new URLSearchParams({ q: routed.query || query, type: routed.item_type || 'both' });
          if ((routed.segments || []).length) params.set('segments', routed.segments.join(','));
          emitEmotion('happy');
          pushBubble({ role: 'vini', text: routed.transition_message || `Entendi o que você precisa. Já estou abrindo a busca filtrada.` });
          setTimeout(() => { navigate(`/buscar?${params.toString()}`); finalize(); }, 900);
          setRefinementCount(0); // Reseta após concluir
          return;
        }

        // Fallback local: busca semântica no estoque embutido
        const result = semanticSearch(query, history);
        const total = (result.products?.length || 0) + (result.services?.length || 0);

        if (total > 0) {
          emitEmotion('happy');
          pushBubble({
            role: 'vini',
            text: `Encontrei ${total} ${total === 1 ? 'opção' : 'opções'} para "${query}". Já estou abrindo os resultados!`,
          });
          setTimeout(() => { navigate(`/buscar?q=${encodeURIComponent(query)}`); finalize(); }, 1000);
        } else {
          emitEmotion('sad');
          pushBubble({
            role: 'vini',
            text: `Infelizmente não encontrei "${query}" no estoque agora. Gostaria que eu acionasse a nossa Central de Atendimento para buscarem isso para você?`,
            action: { 
              label: 'Acionar Central', 
              intent: 'support',
              payload: query
            },
          });
          finalize();
        }
      } catch (err) {
        // Qualquer erro síncrono/inesperado: NUNCA deixar o Vini mudo.
        console.error('[Vini] sendQuery fatal error:', err);
        emitEmotion('sad');
        pushBubble({
          role: 'vini',
          text: `Tive um soluço aqui ao processar "${query}". Pode tentar de novo em outras palavras?`,
        });
        finalize();
      }
    }, 500);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Texto digitado na barra principal → super vendedor (busca)
    if (text.trim()) {
      console.log('[Vini] Text submit:', text.trim());
      sendQuery(text);
    }
    setText('');
    setSearchBarVisible(false);
  };

  const handleSideSearch = () => {
    wakeUp();
    setSideOpen(false);
    setSearchBarMode('search');
    setSearchBarVisible(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleSideConverse = () => {
    openConversationWith();
  };

  const handleSideStory = () => {
    setSideOpen(false);
    setStoryOpen(true);
  };

  // ─── Bottom-grid actions ───
  const handleHome = () => {
    wakeUp();
    navigate('/buscar');
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

  const handleReiniciar = () => {
    // Limpa carrinho, conversa, radar e histórico — volta ao estado inicial
    clearChat();
    try { sessionStorage.removeItem(CHAT_STORAGE_KEY); } catch {}
    setRadarActive(false);
    setHasInteracted(false);
    setSearchBarVisible(false);
    setText('');
    setHistory([]);
    try { localStorage.removeItem('vini:search-history'); } catch {}
    // Carrinho global
    try { (window as any).__viniClearCart?.(); } catch {}
    if (typeof clearCart === 'function') clearCart();
    setTimeout(() => {
      pushBubble({ role: 'vini', text: 'Pronto, recomeçamos do zero. Em que posso te ajudar agora?' });
    }, 200);
  };

  /**
   * Dispatcher central para ações de bolhas do Vini.
   * Garante que toda sugestão clicada execute a rotina correspondente
   * (busca real, abrir ferramenta, navegar) — sem deixar o usuário
   * "preso" lendo um botão sem efeito.
   */
  const runAction = (action?: BubbleAction) => {
    if (!action) return;
    // 1) Intent interno tem prioridade sobre rota
    if (action.intent) {
      switch (action.intent) {
        case 'search': {
          const q = (action.payload || '').trim();
          if (!q) { handleSideSearch(); return; }
          // Preenche a barra como se o usuário tivesse digitado e dispara
          setSearchBarVisible(true);
          setText(q);
          setTimeout(() => sendQuery(q), 80);
          return;
        }
        case 'open-search':
          handleSideSearch();
          return;
        case 'story':
          handleSideStory();
          return;
        case 'cart':
          navigate('/jornada-cliente');
          return;
        case 'wallet':
          navigate('/carteira');
          return;
        case 'radar':
          handleRadar();
          return;
        case 'profile':
          handlePerfil();
          return;
        case 'referral':
          handleIndicacao();
          return;
        case 'demos':
          handleDemos();
          return;
        case 'mystore':
          if (storeSlug) navigate(`/loja/${storeSlug}`);
          else navigate(user ? '/mei' : '/auth');
          return;
      }
    }
    // 2) Fallback: navegação por rota
    if (action.route) navigate(action.route);
  };

  const gridItems: GridItem[] = [
    { key: 'buscar', icon: Search, label: 'Buscar', onClick: handleHome },
    { key: 'urgencia', icon: Radar, label: 'Urgência', onClick: handleRadar, active: radarActive, badge: totalCartItems > 0 ? totalCartItems : undefined },
    { key: 'reiniciar', icon: RotateCcw, label: 'Reiniciar', onClick: handleReiniciar },
    { key: 'perfil', icon: UserIcon, label: 'Perfil', onClick: handlePerfil },
    { key: 'favoritos', icon: Heart, label: 'Favoritos', onClick: () => setFavoritesOpen(true), iconClassName: favoritesCount > 0 ? 'text-rose-400 fill-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.75)]' : undefined },
    { key: 'indica', icon: Gift, label: 'Indicação', onClick: handleIndicacao, highlight: 'R$ 5,00' },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <ViniScene />
      <RadarPulse active={radarActive} city={city} itemCount={totalCartItems} />

      {/* light gradient overlays for legibility */}
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none z-10 bg-gradient-to-b from-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-10 bg-gradient-to-t from-background/40 to-transparent" />

      {/* ─── Header ─── */}
      <header className="absolute top-0 inset-x-0 z-30 px-3 sm:px-5 pt-3">
        <div className="glass rounded-2xl flex items-center justify-between gap-2 px-2.5 py-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center vini-ring">
                <span className="text-[11px] font-bold text-primary-foreground">
                  {(displayName || 'V')[0].toUpperCase()}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-success rounded-full ring-2 ring-background" />
            </div>
            <div className="min-w-0 leading-tight flex-1">
              <p className="text-[12.5px] font-semibold truncate">{displayName || 'Vitrinei'}</p>
              <div className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground/90 truncate">
                {city && (
                  <span className="inline-flex items-center gap-0.5 truncate">
                    <MapPin className="w-2.5 h-2.5 text-[hsl(var(--text-accent))]" strokeWidth={2} />
                    <span className="truncate max-w-[80px]">{city}</span>
                  </span>
                )}
                {city && <span className="opacity-40">·</span>}
                <span className="text-[hsl(var(--text-accent))] truncate">
                  {user ? profileLabel : 'Visitante'}
                </span>
                {planLabel && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="truncate font-medium">{planLabel}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {storeSlug && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 glass"
                onClick={() => navigate(`/loja/${storeSlug}`)}
                aria-label="Minha loja"
                title="Abrir minha loja"
              >
                <Store className="w-3.5 h-3.5" />
              </Button>
            )}
            <ThemeSwitcher />
            {user ? (
              <Button variant="outline" size="sm" className="h-7 text-[10.5px] px-2 gap-1 glass" onClick={signOut}>
                Sair
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-[10.5px] px-2 gap-1 glass" onClick={() => navigate('/auth')}>
                <LogIn className="w-3 h-3" /> Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Floating cart icon (only visible when there are items) ─── */}
      <AnimatePresence>
        {totalCartItems > 0 && (
          <motion.button
            key="cart-fab"
            type="button"
            initial={{ opacity: 0, scale: 0.6, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate('/jornada-cliente')}
            aria-label={`Abrir carrinho (${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'})`}
            className={cn(
              'absolute top-[64px] right-3 sm:right-5 z-30',
              'w-9 h-9 rounded-full flex items-center justify-center',
              'bg-white/[0.07] backdrop-blur-xl',
              'border-[0.5px] border-[hsl(var(--vini-glow)/0.5)]',
              'shadow-[0_4px_18px_hsl(var(--vini-glow)/0.22)]',
              'hover:bg-white/[0.12] transition-colors',
            )}
          >
            <ShoppingBag className="w-4 h-4 text-foreground" strokeWidth={1.6} />
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-gradient-to-br from-primary to-accent text-[9px] font-bold text-primary-foreground flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary)/0.6)] ring-1 ring-background/60">
              {totalCartItems > 99 ? '99+' : totalCartItems}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Plus menu top-right ─── */}
      <div className="absolute top-[108px] right-3 sm:right-5 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPlusMenu((v) => !v)}
          className="glass w-9 h-9 rounded-xl"
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

      {/* Full-screen background tap zone — wakes Vini and triggers small talk */}
      <button
        type="button"
        onClick={handleScreenTap}
        aria-label="Falar com o Vini"
        className="absolute inset-0 z-[5] bg-transparent border-0 p-0 cursor-pointer"
      />
      {/* Direct avatar hit area — keeps quick access to side tools */}
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

      {/* Banner de transcrição superior removido — a transcrição aparece
          apenas dentro da barra de busca para evitar duplicidade visual. */}

      {/* Painel de histórico de conversa removido a pedido */}

      {/* ─── Search bar: hidden by default, slides up between left grid and right mic ─── */}
      <AnimatePresence>
        {(searchBarVisible || listening || !!text.trim()) && (
          <motion.form
            key="search-bar"
            onSubmit={handleTextSubmit}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            // Encaixa entre cards (à esquerda ~130px) e mic (à direita ~60px)
            className="absolute left-[140px] right-[68px] sm:left-[150px] sm:right-[72px] bottom-3 sm:bottom-4 z-30 pointer-events-auto"
          >
            <div className="flex items-center gap-1 p-[3px] rounded-full bg-white/[0.07] backdrop-blur-2xl border-[0.5px] border-[hsl(var(--vini-glow)/0.45)] shadow-[0_4px_24px_hsl(var(--vini-glow)/0.18),inset_0_0_12px_hsl(var(--primary)/0.05)] h-10">
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
                placeholder="Diga ou escreva…"
                className="border-0 bg-transparent focus-visible:ring-0 text-[13px] flex-1 px-3 placeholder:text-foreground/45 h-8"
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-full shrink-0 bg-white/[0.1] hover:bg-white/[0.2] border-[0.5px] border-[hsl(var(--vini-glow)/0.5)] text-foreground"
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
          'absolute right-3 sm:right-4 bottom-3 sm:bottom-4 z-40',
          'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
          'bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground',
          'shadow-[0_4px_22px_hsl(var(--primary)/0.55)]',
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
        initialMessage={modalInitialMessage}
        initialModality={modalInitialModality}
        onInitialConsumed={() => setModalInitialMessage(null)}
        mode={modalMode}
      />
      <FavoritesModal open={favoritesOpen} onOpenChange={setFavoritesOpen} />
    </div>
  );
};

export default ViniHome;
