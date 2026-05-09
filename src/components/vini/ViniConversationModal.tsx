/* ──────────────────────────────────────────────────────────
   ViniConversationModal — Modo Conversar humanizado.
   - Texto + voz simultâneos (Web Speech API + input)
   - Streaming de resposta do Vini via edge function vini-chat
   - Boas-vindas aleatórias personalizadas
   - Saída por comando ("tchau") ou pelo X
   ────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Send, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAiSession } from '@/contexts/AiSessionContext';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string; id: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vini-chat`;

const WELCOMES = [
  (n: string) => `Olá${n ? `, ${n}` : ''}! 👋 Sobre o que vamos conversar hoje?`,
  (n: string) => `Oi${n ? `, ${n}` : ''}! Estou de plantão pra papo. Manda ver!`,
  (n: string) => `E aí${n ? `, ${n}` : ''}! Pode perguntar qualquer coisa, tô curioso.`,
  (n: string) => `Olá${n ? `, ${n}` : ''}! Bora bater um papo? Pode ser sobre qualquer assunto.`,
  (n: string) => `Hey${n ? `, ${n}` : ''}! Conta uma novidade ou me joga uma pergunta.`,
];

const FAREWELL_RX = /\b(tchau|bye|valeu|obrigad[ao]|fui|até logo|at[ée] mais|encerrar)\b/i;

const buildContingencyReply = (_text: string, userName?: string | null) => {
  const first = userName?.split(' ')[0] || '';
  const name = first ? `${first}, ` : '';
  const options = [
    `${name}adorei o que você trouxe. Conta mais um pouco — tô curioso pra entender melhor.`,
    `${name}interessante esse pensamento. Como você enxerga isso no dia a dia?`,
    `${name}boa reflexão. Quer puxar esse fio um pouquinho mais?`,
    `${name}faz sentido. E o que mais te vem à cabeça sobre isso?`,
  ];
  return options[Math.floor(Math.random() * options.length)];
};

interface ViniConversationModalProps {
  open: boolean;
  onClose: () => void;
  userName?: string | null;
  initialMessage?: string | null;
  initialModality?: 'voice' | 'text';
  onInitialConsumed?: () => void;
  /**
   * 'free'     → papo puro (botão Conversar). Histórico zerado a cada abertura.
   * 'commerce' → personalidade comercial completa (busca, contextualização,
   *              agentes do ecossistema). Mantém histórico.
   */
  mode?: 'free' | 'commerce';
}

export function ViniConversationModal({
  open,
  onClose,
  userName,
  initialMessage,
  initialModality = 'text',
  onInitialConsumed,
  mode = 'free',
}: ViniConversationModalProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const userIdRef = useRef<string | null>(null);
  const lastModalityRef = useRef<'voice' | 'text'>('text');
  const voiceSubmitTimerRef = useRef<number | null>(null);
  const lastVoiceSubmissionRef = useRef('');
  const initialMessageKeyRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const { session, update } = useAiSession();

  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  // Persist a single message in vini_conversations (silent on failure)
  const persistMessage = useCallback(
    async (role: 'user' | 'assistant', content: string, modality: 'voice' | 'text', intent?: string) => {
      const uid = userIdRef.current;
      if (!uid || !content.trim()) return;
      try {
        await supabase.from('vini_conversations').insert({
          user_id: uid,
          session_id: sessionIdRef.current,
          role,
          content,
          modality,
          intent: intent ?? null,
        });
      } catch {
        // silent — não bloqueia a conversa
      }
    },
    [],
  );

  // Greet on open + load last history + start new session
  useEffect(() => {
    if (!open) return;
    sessionIdRef.current = crypto.randomUUID();
    setInput('');
    setError(null);
    setHistoryReady(false);
    setMessages([]);
    initialMessageKeyRef.current = null;
    lastVoiceSubmissionRef.current = '';

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      userIdRef.current = user?.id ?? null;

      let history: Msg[] = [];
      // Modo 'free' (botão Conversar): histórico SEMPRE zerado — começamos
      // do zero, com as boas-vindas do Vini, a cada abertura.
      if (mode === 'commerce' && user?.id) {
        const { data } = await supabase
          .from('vini_conversations')
          .select('id, role, content, created_at, intent')
          .eq('user_id', user.id)
          .in('role', ['user', 'assistant'])
          .order('created_at', { ascending: false })
          .limit(20);
        if (data && data.length) {
          history = data
            .reverse()
            .filter((r) => r.intent !== 'welcome')
            .map((r) => ({ role: r.role as 'user' | 'assistant', content: r.content, id: r.id }));
        }
      }

      const first = userName?.split(' ')[0] || '';
      const welcome = WELCOMES[Math.floor(Math.random() * WELCOMES.length)](first);
      const welcomeMsg: Msg = { role: 'assistant', content: welcome, id: `${Date.now()}-w` };
      setMessages([...history, welcomeMsg]);
      setHistoryReady(true);
    })();

    setTimeout(() => inputRef.current?.focus(), 250);
    return () => {
      abortRef.current?.abort();
      if (voiceSubmitTimerRef.current) window.clearTimeout(voiceSubmitTimerRef.current);
      try { stop(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-scroll on new content
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, [messages, isStreaming]);

  const sendMessage = useCallback(
    async (raw: string, modalityOverride?: 'voice' | 'text') => {
      const text = raw.trim();
      if (!text || isStreaming) return;

      const modality = modalityOverride ?? lastModalityRef.current ?? 'text';

      // Stop voice if active
      if (listening) try { stop(); } catch {}

      const userMsg: Msg = { role: 'user', content: text, id: `${Date.now()}-u` };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput('');
      setError(null);

      // Persist user message
      void persistMessage('user', text, modality);

      // Farewell shortcut
      if (FAREWELL_RX.test(text)) {
        const bye = 'Foi ótimo conversar com você! Me chama quando quiser. 👋';
        setMessages((m) => [...m, { role: 'assistant', content: bye, id: `${Date.now()}-bye` }]);
        void persistMessage('assistant', bye, modality, 'farewell');
        setTimeout(onClose, 1400);
        return;
      }

      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;
      // Watchdog: se a resposta travar por mais de 30s, aborta para liberar o input
      const watchdog = window.setTimeout(() => {
        try { controller.abort(); } catch {}
      }, 30000);

      const routedIntent = 'chat';
      // Modo Conversar PURO: sem roteador, sem busca, sem venda, sem redirecionamentos.
      // Apenas papo livre e humanizado com o Vini.

      const assistantId = `${Date.now()}-a`;
      let accumulated = '';

      // Insert placeholder assistant bubble
      setMessages((m) => [...m, { role: 'assistant', content: '', id: assistantId }]);

      try {
        const apiMessages = nextHistory.map((m) => ({ role: m.role, content: m.content }));

        const resp = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          signal: controller.signal,
          body: JSON.stringify({ messages: apiMessages, userName: userName || null, mode }),
        });

        if (!resp.ok || !resp.body) {
          if (resp.status === 429) throw new Error('Muitas mensagens em pouco tempo. Aguarde alguns segundos.');
          if (resp.status === 402) {
            const fallback = buildContingencyReply(text, userName);
            accumulated = fallback;
            setMessages((m) =>
              m.map((msg) => (msg.id === assistantId ? { ...msg, content: fallback } : msg)),
            );
            void persistMessage('assistant', fallback, modality, `${routedIntent}:contingency`);
            return;
          }
          const errBody = await resp.text();
          throw new Error(errBody || 'Falha na conexão com o Vini');
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, nl);
            textBuffer = textBuffer.slice(nl + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line || line.startsWith(':') || !line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') { streamDone = true; break; }
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (delta) {
                accumulated += delta;
                setMessages((m) =>
                  m.map((msg) => (msg.id === assistantId ? { ...msg, content: accumulated } : msg)),
                );
              }
            } catch {
              // partial, requeue
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Persist final assistant response
        if (accumulated.trim()) {
          void persistMessage('assistant', accumulated, modality, routedIntent);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        const msg = e?.message || 'Não consegui responder agora.';
        setError(msg);
        setMessages((m) =>
          m.map((x) => (x.id === assistantId ? { ...x, content: `⚠️ ${msg}` } : x)),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, listening, stop, userName, onClose, navigate, session, update, persistMessage],
  );

  // Empurra o transcript ao input ao vivo e auto-envia após pausa curta.
  useEffect(() => {
    if (!open || !transcript) return;
    setInput(transcript);
    if (!listening) return;
    if (voiceSubmitTimerRef.current) window.clearTimeout(voiceSubmitTimerRef.current);
    voiceSubmitTimerRef.current = window.setTimeout(() => {
      const final = transcript.trim();
      if (!final || final === lastVoiceSubmissionRef.current) return;
      lastVoiceSubmissionRef.current = final;
      lastModalityRef.current = 'voice';
      try { stop(); } catch {}
      void sendMessage(final, 'voice');
    }, 900);
    return () => {
      if (voiceSubmitTimerRef.current) window.clearTimeout(voiceSubmitTimerRef.current);
    };
  }, [open, transcript, listening, stop, sendMessage]);

  // Quando o reconhecimento finaliza (onend), envia imediatamente o que houver.
  useEffect(() => {
    if (!open || listening) return;
    const final = (transcript || input).trim();
    if (!final || final === lastVoiceSubmissionRef.current) return;
    if (lastModalityRef.current !== 'voice') return;
    lastVoiceSubmissionRef.current = final;
    if (voiceSubmitTimerRef.current) window.clearTimeout(voiceSubmitTimerRef.current);
    void sendMessage(final, 'voice');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, open]);

  // Accept voice/text captured outside the modal and run it through the same intelligence.
  useEffect(() => {
    const text = initialMessage?.trim();
    if (!open || !historyReady || !text) return;
    const key = `${initialModality}:${text}`;
    if (initialMessageKeyRef.current === key) return;
    initialMessageKeyRef.current = key;
    lastModalityRef.current = initialModality;
    void sendMessage(text, initialModality);
    onInitialConsumed?.();
  }, [open, historyReady, initialMessage, initialModality, sendMessage, onInitialConsumed]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    lastModalityRef.current = 'text';
    sendMessage(input, 'text');
  };

  const toggleMic = () => {
    if (!supported) return;
    if (listening) {
      stop();
      // If we have transcript, send it as voice
      if (input.trim()) {
        lastModalityRef.current = 'voice';
        sendMessage(input, 'voice');
      }
    } else {
      setInput('');
      lastModalityRef.current = 'voice';
      start();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-end sm:items-center justify-center px-3 sm:px-4 pb-3 sm:pb-0 pointer-events-auto"
          onClick={onClose}
          style={{ perspective: '1600px', perspectiveOrigin: '50% 65%' }}
        >
          {/* Luz volumétrica emergindo do centro da sala */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 45% at 50% 55%, hsl(var(--vini-glow) / 0.28), hsl(var(--primary) / 0.10) 40%, transparent 75%)',
              filter: 'blur(8px)',
            }}
          />
          {/* Backdrop transparente: mantém a sala visível atrás da conversa */}
          <div className="absolute inset-0 bg-transparent pointer-events-none" />

          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.85, rotateX: 18, z: -200 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0, z: 0 }}
            exit={{ y: 40, opacity: 0, scale: 0.9, rotateX: 12 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow:
                '0 40px 90px -20px hsl(var(--vini-glow) / 0.45), 0 0 80px hsl(var(--primary) / 0.25), inset 0 1px 0 hsl(var(--vini-glow) / 0.35), inset 0 0 40px hsl(var(--primary) / 0.06)',
            }}
            className="relative w-full max-w-lg rounded-3xl border border-[hsl(var(--vini-glow)/0.45)] overflow-hidden flex flex-col max-h-[80vh] bg-background/[0.08] backdrop-blur-md"
          >
            {/* Reflexo holográfico superior */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--vini-glow) / 0.9), transparent)' }}
            />
            {/* Brilho interno animado */}
            <motion.div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-40"
              animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
              transition={{ duration: 14, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, hsl(var(--vini-glow) / 0.18), transparent 45%), radial-gradient(circle at 70% 80%, hsl(var(--primary) / 0.16), transparent 50%)',
                backgroundSize: '200% 200%',
              }}
            />
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--vini-glow)/0.18)] bg-background/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <h3 className="font-display font-bold text-base">Conversar com o Vini</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-background/40 hover:bg-background/60 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 min-h-[40vh]">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-snug backdrop-blur-md',
                    m.role === 'user'
                      ? 'self-end bg-primary/70 text-primary-foreground rounded-br-sm border border-primary/25'
                      : 'self-start bg-background/[0.12] text-foreground border border-[hsl(var(--vini-glow)/0.22)] rounded-bl-sm',
                  )}
                >
                  {m.content || (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Live transcript hint */}
            {listening && (
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-primary font-bold bg-primary/5 border-t border-primary/20 text-center">
                🎙️ Ouvindo… fale à vontade
              </div>
            )}

            {/* Composer */}
            <form onSubmit={handleSubmit} className="border-t border-[hsl(var(--vini-glow)/0.18)] bg-background/[0.06] p-3 flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant={listening ? 'default' : 'outline'}
                onClick={toggleMic}
                disabled={!supported}
                className={cn('h-10 w-10 rounded-full shrink-0', listening && 'animate-pulse')}
                aria-label={listening ? 'Parar microfone' : 'Falar'}
                title={supported ? (listening ? 'Parar' : 'Falar') : 'Voz indisponível'}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? 'Fale ou digite…' : 'Diga qualquer coisa ao Vini…'}
                className="flex-1 bg-background/[0.10] border-[hsl(var(--vini-glow)/0.22)] backdrop-blur-md"
                disabled={isStreaming}
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full shrink-0 bg-gradient-to-br from-primary to-accent"
                disabled={!input.trim() || isStreaming}
                aria-label="Enviar"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
