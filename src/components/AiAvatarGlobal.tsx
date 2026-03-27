import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Headphones, DollarSign, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import avatarImg from '@/assets/ai-avatar.png';

interface AiAvatarProps {
  size?: number;
  speaking?: boolean;
  thinking?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AiAvatar = ({ size = 64, speaking = false, thinking = false, onClick, className = '' }: AiAvatarProps) => {
  return (
    <motion.div
      onClick={onClick}
      className={`relative cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Pulse rings */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20"
        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Avatar image */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg"
        animate={thinking ? { 
          boxShadow: [
            '0 0 10px hsl(var(--primary) / 0.3)',
            '0 0 25px hsl(var(--primary) / 0.6)',
            '0 0 10px hsl(var(--primary) / 0.3)',
          ]
        } : speaking ? {
          boxShadow: [
            '0 0 8px hsl(var(--accent) / 0.3)',
            '0 0 20px hsl(var(--accent) / 0.5)',
            '0 0 8px hsl(var(--accent) / 0.3)',
          ]
        } : { y: [0, -2, 0] }}
        transition={thinking ? { duration: 1.2, repeat: Infinity } : speaking ? { duration: 0.8, repeat: Infinity } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src={avatarImg} alt="Assistente IA EcoMEI" className="w-full h-full object-cover" />
      </motion.div>

      {/* Thinking dots */}
      <AnimatePresence>
        {thinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1 bg-card border border-border rounded-full px-2 py-1 shadow-md"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking wave indicator */}
      <AnimatePresence>
        {speaking && !thinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-[2px] bg-card border border-border rounded-full px-2 py-1 shadow-md"
          >
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-accent"
                style={{ height: 6 }}
                animate={{ scaleY: [0.4, 1.2, 0.6, 1, 0.4] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkle */}
      <motion.div
        className="absolute -top-1 -right-1"
        animate={{ rotate: [0, 360], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles className="text-accent" style={{ width: size * 0.3, height: size * 0.3 }} />
      </motion.div>

      {/* Online indicator */}
      <motion.div
        className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-card"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ width: size * 0.18, height: size * 0.18 }}
      />
    </motion.div>
  );
};

/** Floating avatar for secondary pages - bottom right corner with mini chat */
export const FloatingAiAvatar = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setChat(prev => [...prev, { role: 'user', text: message }]);
    setMessage('');
    setThinking(true);
    const responses = [
      'Encontrei 3 opções na sua região! O mais próximo é o Carlos MEI, a 2.3 km, com avaliação 4.9⭐. Posso agendar?',
      'Analisando fornecedores e estoque via drop-shipping... Melhor opção: preço 15% menor, entrega em 24h!',
      'Encaminhando para a Central de Atendimento. SLA: máximo 24h. Você será notificado! 📩',
    ];
    setTimeout(() => {
      setThinking(false);
      setSpeaking(true);
      setChat(prev => [...prev, { role: 'ai', text: responses[Math.floor(Math.random() * responses.length)] }]);
      setTimeout(() => setSpeaking(false), 2000);
    }, 1500);
  };

  return (
    <>
      {/* Floating button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      >
        {!open && (
          <motion.div
            className="relative"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: [0, 1, 1, 0], x: [10, 0, 0, -10] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 6 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border rounded-xl px-3 py-2 shadow-lg whitespace-nowrap"
            >
              <p className="text-xs text-foreground font-medium">Precisa de ajuda? 💡</p>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-card border-r border-t border-border rotate-45" />
            </motion.div>
            <AiAvatar size={56} speaking={speaking} thinking={thinking} onClick={() => setOpen(true)} />
          </motion.div>
        )}
      </motion.div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="p-3 border-b border-border bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AiAvatar size={36} speaking={speaking} thinking={thinking} />
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">Assistente EcoMEI</h3>
                  <div className="flex items-center gap-1">
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-success" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <p className="text-[10px] text-muted-foreground">IA • Online</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)}>✕</Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[400px]">
              {chat.length === 0 && (
                <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1.5">👋 Olá! Sou a IA do EcoMEI.</p>
                  <p className="mb-2">Me conta o que você precisa:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-primary" /> Melhor preço</li>
                    <li className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-primary" /> Menor tempo</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary" /> Mais próximo</li>
                  </ul>
                </div>
              )}
              {chat.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-1.5'}`}>
                  {msg.role === 'ai' && <AiAvatar size={24} speaking={false} />}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                  <AiAvatar size={24} thinking={true} />
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 text-xs text-muted-foreground">
                    Analisando fornecedores...
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-2 border-t border-border">
              <div className="flex gap-1.5">
                <Input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="O que você precisa?"
                  className="rounded-xl text-xs h-8"
                />
                <Button size="icon" className="rounded-xl shrink-0 h-8 w-8" onClick={handleSend}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              <button
                onClick={() => {
                  setSpeaking(true);
                  setChat(prev => [...prev,
                    { role: 'user', text: 'Preciso de ajuda especializada' },
                    { role: 'ai', text: 'Encaminhando para a Central de Atendimento. SLA: máximo 24h. Você será notificado! 📩✅' },
                  ]);
                  setTimeout(() => setSpeaking(false), 2000);
                }}
                className="w-full mt-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-1"
              >
                <Headphones className="w-3 h-3" /> Central de Atendimento (SLA 24h)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
