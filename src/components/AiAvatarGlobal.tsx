import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Headphones, DollarSign, Clock, MapPin, Star, Package, ArrowRight, ChevronDown, ShoppingBag, Wrench as WrenchIcon, Store, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import avatarImg from '@/assets/ai-avatar.png';
import { segments, semanticSearch, mockResults, buildSupportSummary, type ProductItem, type SearchResult } from '@/data/searchData';

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
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg"
        animate={thinking ? { 
          boxShadow: ['0 0 10px hsl(var(--primary) / 0.3)', '0 0 25px hsl(var(--primary) / 0.6)', '0 0 10px hsl(var(--primary) / 0.3)']
        } : speaking ? {
          boxShadow: ['0 0 8px hsl(var(--accent) / 0.3)', '0 0 20px hsl(var(--accent) / 0.5)', '0 0 8px hsl(var(--accent) / 0.3)']
        } : { y: [0, -2, 0] }}
        transition={thinking ? { duration: 1.2, repeat: Infinity } : speaking ? { duration: 0.8, repeat: Infinity } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src={avatarImg} alt="Assistente IA EcoMEI" className="w-full h-full object-cover" />
      </motion.div>
      <AnimatePresence>
        {thinking && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1 bg-card border border-border rounded-full px-2 py-1 shadow-md">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {speaking && !thinking && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-[2px] bg-card border border-border rounded-full px-2 py-1 shadow-md">
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div key={i} className="w-[3px] rounded-full bg-accent" style={{ height: 6 }}
                animate={{ scaleY: [0.4, 1.2, 0.6, 1, 0.4] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div className="absolute -top-1 -right-1"
        animate={{ rotate: [0, 360], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
        <Sparkles className="text-accent" style={{ width: size * 0.3, height: size * 0.3 }} />
      </motion.div>
      <motion.div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-card"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ width: size * 0.18, height: size * 0.18 }} />
    </motion.div>
  );
};

type ChatMsg = {
  role: 'user' | 'ai';
  text: string;
  searchResult?: SearchResult;
};

/** Product card in chat */
const ChatProductCard = ({ product, onServiceSuggest }: { product: ProductItem; onServiceSuggest?: (p: ProductItem) => void }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Card className="border-border/50 hover:border-primary/40 cursor-pointer transition-all group" onClick={() => onServiceSuggest?.(product)}>
      <CardContent className="p-2.5">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-success/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3 h-3 text-success" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-[11px] text-foreground truncate">{product.name}</h4>
              <p className="text-[10px] text-muted-foreground truncate">{product.provider}</p>
            </div>
          </div>
          <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[8px] px-1.5 py-0 shrink-0">
            <Store className="w-2 h-2 mr-0.5" />
            {product.stockType === 'fisico' ? 'Estoque' : 'Drop'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
          <span className="flex items-center gap-0.5 font-semibold text-foreground"><DollarSign className="w-2.5 h-2.5" /> R$ {product.price}</span>
          <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-accent text-accent" /> {product.rating}</span>
          <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {product.distance}</span>
        </div>
        <div className="flex items-center gap-0.5 text-[9px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-2.5 h-2.5" /> Comprar produto
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

/** Service card in chat */
const ChatServiceCard = ({ result, onClick }: { result: typeof mockResults[0]; onClick: () => void }) => {
  const seg = segments.find((s) => s.id === result.segment);
  const SegIcon = seg?.icon || Sparkles;
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card className="border-border/50 hover:border-primary/40 cursor-pointer transition-all group" onClick={onClick}>
        <CardContent className="p-2.5">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <SegIcon className="w-3 h-3 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-[11px] text-foreground truncate">{result.name}</h4>
                <p className="text-[10px] text-muted-foreground truncate">{result.provider}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-[10px] text-accent-foreground shrink-0">
              <Star className="w-2.5 h-2.5 fill-accent text-accent" />
              {result.rating}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" /> R$ {result.price}</span>
            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {result.time}</span>
            <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {result.distance}</span>
          </div>
          {result.products.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {result.products.slice(0, 2).map((p) => (
                <Badge key={p} variant="secondary" className="text-[8px] px-1.5 py-0">
                  <Package className="w-2 h-2 mr-0.5" />{p}
                </Badge>
              ))}
              {result.products.length > 2 && (
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0">+{result.products.length - 2}</Badge>
              )}
            </div>
          )}
          <div className="mt-1 flex items-center gap-0.5 text-[9px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-2.5 h-2.5" /> Contratar
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/** Floating avatar for secondary pages - bottom right corner with mini chat */
export const FloatingAiAvatar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<number | null>(null);
  const [expandedServices, setExpandedServices] = useState<number | null>(null);

  const navigateToDemo = (result: typeof mockResults[0]) => {
    const params = new URLSearchParams({
      serviceName: result.name,
      serviceProvider: result.provider,
      servicePrice: String(result.price),
      serviceRating: String(result.rating),
      serviceDistance: result.distance,
      serviceTime: result.time,
      serviceSegment: result.segment,
      serviceProducts: JSON.stringify(result.products),
    });
    navigate(`/jornada-cliente?${params.toString()}`);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const msg = message.trim();
    setChat(prev => [...prev, { role: 'user', text: msg }]);
    setMessage('');
    setThinking(true);

    // Build conversation context from previous user messages
    const userMsgs = chat.filter(m => m.role === 'user').map(m => m.text);
    const searchResult = semanticSearch(msg, [...userMsgs, msg]);

    setTimeout(() => {
      setThinking(false);
      setSpeaking(true);

      const hasResults = searchResult.products.length > 0 || searchResult.services.length > 0;

      if (hasResults) {
        const contextMsg = searchResult.followUp || 'Entendi sua necessidade! 🧠';
        const parts: string[] = [contextMsg];

        if (searchResult.needLabel) {
          parts.push(`\n\n🔍 **Necessidade identificada:** ${searchResult.needLabel}`);
        }

        if (searchResult.products.length > 0) {
          const physCount = searchResult.products.filter(p => p.stockType === 'fisico').length;
          const dropCount = searchResult.products.filter(p => p.stockType === 'drop').length;
          parts.push(`\n\n📦 **${searchResult.products.length} produto(s)** disponíveis (${physCount} em estoque, ${dropCount} drop-shipping):`);
        }

        if (searchResult.services.length > 0) {
          parts.push(`\n\n🔧 **${searchResult.services.length} serviço(s)** relevantes:`);
        }

        if (searchResult.suggestedServices && searchResult.suggestedServices.length > 0) {
          parts.push(`\n\n💡 **Sugestão da IA:** ${searchResult.suggestedServices.length} serviço(s) relacionados:`);
        }

        setChat(prev => [...prev, { role: 'ai', text: parts.join(''), searchResult }]);
      } else {
        const summary = buildSupportSummary([...chat, { role: 'user', text: msg }], msg);
        setChat(prev => [...prev, {
          role: 'ai',
          text: `Não encontrei "${msg}" no hub. 😔\n\nResumo preparado para a Central:\n• Necessidade: ${msg}\n• Status: Indisponível\n\nAcione a Central abaixo para buscar profissionais na sua região (SLA: 24h).`,
          searchResult: { products: [], services: [], _noResults: true, _query: msg, _summary: summary } as any
        }]);
      }
      setTimeout(() => setSpeaking(false), 2000);
    }, 1500);
  };

  return (
    <>
      <motion.div className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}>
        {!open && (
          <motion.div className="relative"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: [0, 1, 1, 0], x: [10, 0, 0, -10] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 6 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border rounded-xl px-3 py-2 shadow-lg whitespace-nowrap">
              <p className="text-xs text-foreground font-medium">Precisa de ajuda? 💡</p>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-card border-r border-t border-border rotate-45" />
            </motion.div>
            <AiAvatar size={56} speaking={speaking} thinking={thinking} onClick={() => setOpen(true)} />
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ maxHeight: '75vh' }}>
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
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[450px]">
              {chat.length === 0 && (
                <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1.5">👋 Me diga o que você precisa!</p>
                  <p className="mb-2">Eu encontro o melhor profissional perto de você:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1.5"><ShoppingBag className="w-3 h-3 text-success" /> Produtos com estoque real</li>
                    <li className="flex items-center gap-1.5"><WrenchIcon className="w-3 h-3 text-primary" /> Profissionais avaliados</li>
                    <li className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-accent" /> IA cruza tudo por você</li>
                    <li className="flex items-center gap-1.5"><Star className="w-3 h-3 fill-accent text-accent" /> 4.8 avaliação média</li>
                  </ul>
                </div>
              )}
              {chat.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-1.5'}`}>
                    {msg.role === 'ai' && <AiAvatar size={24} speaking={false} />}
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                      {msg.text}
                    </div>
                  </div>

                  {/* Product cards */}
                  {msg.searchResult && msg.searchResult.products.length > 0 && (
                    <div className="w-full mt-1.5 pl-8">
                      <p className="text-[10px] font-semibold text-success mb-1 flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" /> Produtos disponíveis
                      </p>
                      <div className="space-y-1.5">
                        {(expandedProducts === idx ? msg.searchResult.products : msg.searchResult.products.slice(0, 3)).map((p) => (
                          <ChatProductCard key={p.id} product={p} />
                        ))}
                        {msg.searchResult.products.length > 3 && expandedProducts !== idx && (
                          <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 text-muted-foreground hover:text-primary gap-1"
                            onClick={() => setExpandedProducts(idx)}>
                            <ChevronDown className="w-3 h-3" />
                            Ver todos os {msg.searchResult.products.length} produtos
                          </Button>
                        )}
                        {expandedProducts === idx && msg.searchResult.products.length > 3 && (
                          <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 text-muted-foreground hover:text-primary"
                            onClick={() => setExpandedProducts(null)}>Mostrar menos</Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Service cards */}
                  {msg.searchResult && msg.searchResult.services.length > 0 && (
                    <div className="w-full mt-1.5 pl-8">
                      <p className="text-[10px] font-semibold text-primary mb-1 flex items-center gap-1">
                        <WrenchIcon className="w-3 h-3" /> Serviços profissionais
                      </p>
                      <div className="space-y-1.5">
                        {(expandedServices === idx ? msg.searchResult.services : msg.searchResult.services.slice(0, 3)).map((r) => (
                          <ChatServiceCard key={r.id} result={r} onClick={() => navigateToDemo(r)} />
                        ))}
                        {msg.searchResult.services.length > 3 && expandedServices !== idx && (
                          <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 text-muted-foreground hover:text-primary gap-1"
                            onClick={() => setExpandedServices(idx)}>
                            <ChevronDown className="w-3 h-3" />
                            Ver todos os {msg.searchResult.services.length} serviços
                          </Button>
                        )}
                        {expandedServices === idx && msg.searchResult.services.length > 3 && (
                          <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 text-muted-foreground hover:text-primary"
                            onClick={() => setExpandedServices(null)}>Mostrar menos</Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI-suggested services (when only products matched) */}
                  {msg.searchResult?.suggestedServices && msg.searchResult.suggestedServices.length > 0 && (
                    <div className="w-full mt-1.5 pl-8">
                      <p className="text-[10px] font-semibold text-accent-foreground mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-accent" /> Serviços sugeridos pela IA
                      </p>
                      <div className="space-y-1.5">
                        {msg.searchResult.suggestedServices.slice(0, 2).map((r) => (
                          <ChatServiceCard key={r.id} result={r} onClick={() => navigateToDemo(r)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Central action buttons when no results */}
                  {msg.role === 'ai' && (msg.searchResult as any)?._noResults && (
                    <div className="w-full mt-1.5 pl-8 space-y-1">
                      <Button size="sm" className="w-full gap-1.5 text-[10px] h-7" onClick={() => {
                        const sr = msg.searchResult as any;
                        const params = new URLSearchParams({ query: sr._query, context: 'Chat IA', summary: sr._summary, type: 'both' });
                        navigate(`/central-atendimento?${params.toString()}`);
                      }}>
                        <Headphones className="w-3 h-3" /> Acionar Central
                      </Button>
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-[10px] h-7" onClick={() => {
                        const sr = msg.searchResult as any;
                        const params = new URLSearchParams({ query: sr._query, context: 'Incluir item', summary: sr._summary, type: 'both' });
                        navigate(`/central-atendimento?${params.toString()}`);
                      }}>
                        <Plus className="w-3 h-3" /> Incluir no hub
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
              {thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                  <AiAvatar size={24} thinking={true} />
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 text-xs text-muted-foreground">
                    Analisando estoque e fornecedores...
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
                  placeholder="Ex: dor de barriga, blusa, remédio..."
                  className="rounded-xl text-xs h-8"
                />
                <Button size="icon" className="rounded-xl shrink-0 h-8 w-8" onClick={handleSend}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              <button
                onClick={() => {
                  const lastQuery = chat.filter(m => m.role === 'user').pop()?.text || 'serviço especializado';
                  const summary = buildSupportSummary(chat, lastQuery);
                  const params = new URLSearchParams({ query: lastQuery, context: 'Chat flutuante', summary, type: 'both' });
                  navigate(`/central-atendimento?${params.toString()}`);
                }}
                className="w-full mt-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-1">
                <Headphones className="w-3 h-3" /> Central de Atendimento (SLA 24h)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
