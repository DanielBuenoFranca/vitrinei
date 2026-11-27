import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart, CreditCard, AlertTriangle, Trash2, X, Minus, Plus,
  Zap, CheckCircle2, ShoppingBag, Wrench as WrenchIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const CartBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    productCart, productQuantities, serviceCart,
    showCartDetails, setShowCartDetails,
    clientCredit, paymentMethod, setPaymentMethod,
    paymentStep, setPaymentStep,
    removeProductFromCart, updateProductQuantity,
    toggleServiceInCart,
    totalCartItems, totalCartValue, needsTopUp, topUpAmount, creditUsed, remainingCredit,
    clearCart, isMinimized, setIsMinimized,
  } = useCart();

  const isUrgencia =
    new URLSearchParams(location.search).get('urgencia') === '1' ||
    location.pathname === '/radar-urgencia';

  const navigateToCheckout = () => {
    if (totalCartItems === 0) return;
    const params = new URLSearchParams({
      services: JSON.stringify(serviceCart.map(s => ({
        name: s.name, provider: s.provider, price: s.price, rating: s.rating,
        distance: s.distance, time: s.time, segment: s.segment, products: s.products,
      }))),
      products: JSON.stringify(productCart.map(p => ({
        name: p.name, type: p.stockType, price: p.price, provider: p.provider,
        rating: p.rating, distance: p.distance, quantity: productQuantities.get(p.id) || 1,
      }))),
    });
    if (isUrgencia) {
      // Modo Radar — vai direto para a simulação de busca + entrega
      navigate(`/radar-urgencia?${params.toString()}`);
      return;
    }
    clearCart();
    navigate(`/jornada-cliente?${params.toString()}`);
  };
  // Auto-minimize on route change
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname !== prevPath.current && totalCartItems > 0) {
      setIsMinimized(true);
      setShowCartDetails(false);
    }
    prevPath.current = location.pathname;
  }, [location.pathname]);


  // When empty, show nothing
  if (totalCartItems === 0) return null;

  return (
    <>
      {/* Minimized: floating icon badge like Mercado Livre */}
      <AnimatePresence>
        {isMinimized && (
          <motion.button
            key="cart-badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={() => setIsMinimized(false)}
            className="fixed top-3 right-3 z-[60] w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {totalCartItems}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded: full cart bar at top */}
      <AnimatePresence>
        {!isMinimized && (
    <div className="fixed top-0 left-0 right-0 z-[60]">
          <motion.div
            key="expanded"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <Card className="rounded-none border-x-0 border-t-0 border-primary shadow-xl bg-card/95 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4 container mx-auto max-w-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {totalCartItems} ite{totalCartItems > 1 ? 'ns' : 'm'} • R$ {totalCartValue.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-0.5"><CreditCard className="w-3 h-3 text-primary" /> Crédito: R$ {clientCredit.toFixed(2)}</span>
                        {needsTopUp && (
                          <span className="flex items-center gap-0.5 text-destructive font-semibold">
                            <AlertTriangle className="w-3 h-3" /> Falta: R$ {topUpAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
                    <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs text-muted-foreground h-7 sm:h-8 px-2" onClick={() => setShowCartDetails(!showCartDetails)}>
                      {showCartDetails ? 'Fechar' : 'Ver itens'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" onClick={clearCart}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" onClick={() => setIsMinimized(true)}>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" className={`gap-1 sm:gap-1.5 font-semibold text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 ${isUrgencia ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse' : ''}`} onClick={() => { setShowCartDetails(true); }}>
                      {isUrgencia ? <><Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Acionar Radar</> : <><ShoppingCart className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Finalizar</>}
                    </Button>
                  </div>
                </div>

                {/* Expanded cart items */}
                <AnimatePresence>
                  {showCartDetails && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-border space-y-2 overflow-hidden max-h-[50vh] overflow-y-auto">
                      {serviceCart.length > 0 && (
                        <p className="text-[10px] font-semibold text-primary flex items-center gap-1 mb-1">
                          <WrenchIcon className="w-3 h-3" /> Serviços (hr)
                        </p>
                      )}
                      {serviceCart.map(svc => (
                        <div key={`svc-${svc.id}`} className="flex items-center justify-between text-xs bg-primary/5 rounded-lg px-2 sm:px-3 py-2 gap-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] px-1 py-0 shrink-0">🔧</Badge>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-foreground text-[11px] block truncate">{svc.name}</span>
                              <span className="text-[10px] text-muted-foreground">R$ {svc.price}/hr • {svc.provider}</span>
                            </div>
                          </div>
                          <button onClick={() => toggleServiceInCart(svc)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {productCart.length > 0 && (
                        <p className="text-[10px] font-semibold text-success flex items-center gap-1 mb-1 mt-2">
                          <ShoppingBag className="w-3 h-3" /> Produtos
                        </p>
                      )}
                      {productCart.map(product => {
                        const qty = productQuantities.get(product.id) || 1;
                        const unit = (product as any).unit || 'un';
                        return (
                          <div key={`prod-${product.id}`} className="flex items-center justify-between text-xs bg-success/5 rounded-lg px-2 sm:px-3 py-2 gap-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[8px] px-1 py-0 shrink-0">
                                {product.stockType === 'fisico' ? '📦' : '🌍'}
                              </Badge>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-foreground text-[11px] block truncate">{product.name}</span>
                                <span className="text-[10px] text-muted-foreground">R$ {(product.price * qty).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => updateProductQuantity(product.id, -1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 text-xs font-bold">−</button>
                              <span className="text-[10px] font-semibold w-5 text-center">{qty}{unit !== 'un' ? unit : ''}</span>
                              <button onClick={() => updateProductQuantity(product.id, 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 text-xs font-bold">+</button>
                              <button onClick={() => removeProductFromCart(product.id)} className="text-muted-foreground hover:text-destructive ml-0.5">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Credit summary */}
                      <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total do pedido:</span>
                          <span className="font-bold text-foreground">R$ {totalCartValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" /> Crédito disponível:</span>
                          <span className="font-semibold text-primary">R$ {clientCredit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Utilizado do crédito:</span>
                          <span className="font-semibold text-foreground">- R$ {creditUsed.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Saldo restante:</span>
                          <span className={`font-semibold ${remainingCredit > 0 ? 'text-primary' : 'text-muted-foreground'}`}>R$ {remainingCredit.toFixed(2)}</span>
                        </div>
                        {needsTopUp && (
                          <div className="mt-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> Crédito insuficiente — Aporte necessário: R$ {topUpAmount.toFixed(2)}
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 flex-1" onClick={() => setPaymentMethod('pix')}>
                                <CreditCard className="w-3 h-3" /> Pix
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 flex-1" onClick={() => setPaymentMethod('cartao')}>
                                <CreditCard className="w-3 h-3" /> Cartão
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Payment flow */}
                        {paymentMethod && needsTopUp && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                            {paymentStep === 'choose' && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-foreground">
                                  💳 Pagamento via {paymentMethod === 'pix' ? 'Pix' : 'Cartão'} — R$ {topUpAmount.toFixed(2)}
                                </p>
                                {paymentMethod === 'pix' ? (
                                  <div className="text-center space-y-2">
                                    <div className="w-28 h-28 mx-auto bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                                      <div className="text-center">
                                        <div className="text-3xl mb-1">📱</div>
                                        <p className="text-[9px] text-muted-foreground">QR Code Pix</p>
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Escaneie o QR Code ou copie o código</p>
                                    <Button size="sm" className="w-full h-7 text-[10px] gap-1" onClick={() => { setPaymentStep('processing'); setTimeout(() => setPaymentStep('confirmed'), 2000); }}>
                                      Simular pagamento realizado
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Input placeholder="0000 0000 0000 0000" className="h-8 text-xs" />
                                    <div className="flex gap-2">
                                      <Input placeholder="MM/AA" className="h-8 text-xs flex-1" />
                                      <Input placeholder="CVV" className="h-8 text-xs w-20" />
                                    </div>
                                    <Button size="sm" className="w-full h-7 text-[10px] gap-1" onClick={() => { setPaymentStep('processing'); setTimeout(() => setPaymentStep('confirmed'), 2000); }}>
                                      Pagar R$ {topUpAmount.toFixed(2)}
                                    </Button>
                                  </div>
                                )}
                                <button onClick={() => { setPaymentMethod(null); setPaymentStep('choose'); }} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center mt-1">
                                  Alterar forma de pagamento
                                </button>
                              </div>
                            )}
                            {paymentStep === 'processing' && (
                              <div className="text-center py-4 space-y-2">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                  <Zap className="w-6 h-6 text-primary mx-auto" />
                                </motion.div>
                                <p className="text-xs font-semibold text-foreground">Processando pagamento...</p>
                              </div>
                            )}
                            {paymentStep === 'confirmed' && (
                              <div className="text-center py-3 space-y-2">
                                <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
                                <p className="text-xs font-bold text-success">Pagamento confirmado!</p>
                                <p className="text-[10px] text-muted-foreground">R$ {topUpAmount.toFixed(2)} via {paymentMethod === 'pix' ? 'Pix' : 'Cartão'}</p>
                                <Button size="sm" className="w-full gap-1.5 font-semibold mt-2" onClick={() => {
                                  setPaymentStep('choose'); setPaymentMethod(null);
                                  navigateToCheckout();
                                }}>
                                  <ShoppingCart className="w-3.5 h-3.5" /> Confirmar pedido
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Finalizar when credit is sufficient */}
                        {!needsTopUp && (
                          <div className="mt-2">
                            <Button size="sm" className={`w-full gap-1.5 font-semibold ${isUrgencia ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`} onClick={navigateToCheckout}>
                              {isUrgencia ? <><Zap className="w-3.5 h-3.5" /> Acionar Radar de Urgência</> : <><ShoppingCart className="w-3.5 h-3.5" /> Confirmar compra</>}
                            </Button>
                            {isUrgencia && (
                              <p className="text-[10px] text-center text-muted-foreground mt-1">
                                📡 Buscaremos um prestador online próximo a você
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
    </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartBar;
