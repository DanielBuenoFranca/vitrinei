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

interface ViniConversationModalProps {
  open: boolean;
  onClose: () => void;
  userName?: string | null;
}

export function ViniConversationModal({ open, onClose, userName }: ViniConversationModalProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  // Greet on open
  useEffect(() => {
    if (!open) return;
    setMessages([]);
    setInput('');
    setError(null);
    const first = userName?.split(' ')[0] || '';
    const welcome = WELCOMES[Math.floor(Math.random() * WELCOMES.length)](first);
    setMessages([{ role: 'assistant', content: welcome, id: `${Date.now()}-w` }]);
    setTimeout(() => inputRef.current?.focus(), 200);
    return () => {
      abortRef.current?.abort();
      try { stop(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Push voice transcript into the input live
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Auto-scroll on new content
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, [messages, isStreaming]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isStreaming) return;

      // Stop voice if active
      if (listening) try { stop(); } catch {}

      const userMsg: Msg = { role: 'user', content: text, id: `${Date.now()}-u` };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput('');
      setError(null);

      // Farewell shortcut
      if (FAREWELL_RX.test(text)) {
        const bye = 'Foi ótimo conversar com você! Me chama quando quiser. 👋';
        setMessages((m) => [...m, { role: 'assistant', content: bye, id: `${Date.now()}-bye` }]);
        setTimeout(onClose, 1400);
        return;
      }

      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;
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
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          signal: controller.signal,
          body: JSON.stringify({ messages: apiMessages, userName: userName || null }),
        });

        if (!resp.ok || !resp.body) {
          if (resp.status === 429) throw new Error('Muitas mensagens em pouco tempo. Aguarde alguns segundos.');
          if (resp.status === 402) throw new Error('Créditos insuficientes para o Vini conversar agora.');
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
    [messages, isStreaming, listening, stop, userName, onClose],
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const toggleMic = () => {
    if (!supported) return;
    if (listening) {
      stop();
      // If we have transcript, send it
      if (input.trim()) sendMessage(input);
    } else {
      setInput('');
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
          className="absolute inset-0 z-50 flex items-end sm:items-center justify-center px-3 sm:px-4 pb-3 sm:pb-0 bg-background/40 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg glass-strong rounded-3xl border border-[hsl(var(--vini-glow)/0.5)] shadow-[0_0_60px_hsl(var(--vini-glow)/0.35)] overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
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
                    'max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-snug',
                    m.role === 'user'
                      ? 'self-end bg-primary text-primary-foreground rounded-br-sm'
                      : 'self-start bg-card/80 text-foreground border border-border/50 rounded-bl-sm',
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
            <form onSubmit={handleSubmit} className="border-t border-border/40 p-3 flex items-center gap-2">
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
                className="flex-1 bg-background/40 border-border/60"
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
