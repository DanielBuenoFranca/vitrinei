import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ProductItem } from '@/data/searchData';

export interface ServiceCartItem {
  id: number;
  name: string;
  segment: string;
  provider: string;
  price: number;
  rating: number;
  distance: string;
  time: string;
  products: string[];
}

interface CartContextType {
  productCart: ProductItem[];
  productQuantities: Map<number, number>;
  serviceCart: ServiceCartItem[];
  showCartDetails: boolean;
  setShowCartDetails: (v: boolean) => void;
  clientCredit: number;
  paymentMethod: 'pix' | 'cartao' | null;
  setPaymentMethod: (v: 'pix' | 'cartao' | null) => void;
  paymentStep: 'choose' | 'processing' | 'confirmed';
  setPaymentStep: (v: 'choose' | 'processing' | 'confirmed') => void;
  toggleProductInCart: (product: ProductItem) => void;
  removeProductFromCart: (id: number) => void;
  updateProductQuantity: (id: number, delta: number) => void;
  isInProductCart: (id: number) => boolean;
  toggleServiceInCart: (svc: ServiceCartItem) => void;
  isInServiceCart: (id: number) => boolean;
  totalCartItems: number;
  totalCartValue: number;
  needsTopUp: boolean;
  topUpAmount: number;
  creditUsed: number;
  remainingCredit: number;
  clearCart: () => void;
  navigateToCheckout: () => void;
  // Minimize / expand
  isMinimized: boolean;
  setIsMinimized: (v: boolean) => void;
  lastChangeTimestamp: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productCart, setProductCart] = useState<ProductItem[]>([]);
  const [productQuantities, setProductQuantities] = useState<Map<number, number>>(new Map());
  const [serviceCart, setServiceCart] = useState<ServiceCartItem[]>([]);
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [clientCredit] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | null>(null);
  const [paymentStep, setPaymentStep] = useState<'choose' | 'processing' | 'confirmed'>('choose');
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastChangeTimestamp, setLastChangeTimestamp] = useState(0);
  const navigateRef = useRef<((path: string) => void) | null>(null);

  // Track changes to auto-expand
  const prevItemCount = useRef(0);
  useEffect(() => {
    const currentCount = productCart.reduce((s, p) => s + (productQuantities.get(p.id) || 1), 0) + serviceCart.length;
    if (currentCount !== prevItemCount.current) {
      if (currentCount > 0) {
        setIsMinimized(false);
        setLastChangeTimestamp(Date.now());
      }
      prevItemCount.current = currentCount;
    }
  }, [productCart, productQuantities, serviceCart]);

  const toggleProductInCart = useCallback((product: ProductItem) => {
    if (productCart.some(p => p.id === product.id)) {
      setProductQuantities(prev => {
        const n = new Map(prev);
        n.set(product.id, (n.get(product.id) || 1) + 1);
        return n;
      });
    } else {
      setProductCart(prev => [...prev, product]);
      setProductQuantities(prev => {
        const n = new Map(prev);
        n.set(product.id, 1);
        return n;
      });
    }
  }, [productCart]);

  const removeProductFromCart = useCallback((id: number) => {
    setProductCart(prev => prev.filter(p => p.id !== id));
    setProductQuantities(prev => { const n = new Map(prev); n.delete(id); return n; });
  }, []);

  const updateProductQuantity = useCallback((id: number, delta: number) => {
    setProductQuantities(prev => {
      const n = new Map(prev);
      n.set(id, Math.max(1, (n.get(id) || 1) + delta));
      return n;
    });
  }, []);

  const isInProductCart = useCallback((id: number) => productCart.some(p => p.id === id), [productCart]);

  const toggleServiceInCart = useCallback((svc: ServiceCartItem) => {
    setServiceCart(prev =>
      prev.some(s => s.id === svc.id) ? prev.filter(s => s.id !== svc.id) : [...prev, svc]
    );
  }, []);

  const isInServiceCart = useCallback((id: number) => serviceCart.some(s => s.id === id), [serviceCart]);

  const totalCartItems = productCart.reduce((s, p) => s + (productQuantities.get(p.id) || 1), 0) + serviceCart.length;
  const totalCartValue = productCart.reduce((s, p) => s + p.price * (productQuantities.get(p.id) || 1), 0) + serviceCart.reduce((s, svc) => s + svc.price, 0);
  const needsTopUp = totalCartValue > clientCredit;
  const topUpAmount = needsTopUp ? totalCartValue - clientCredit : 0;
  const creditUsed = Math.min(clientCredit, totalCartValue);
  const remainingCredit = clientCredit - creditUsed;

  const clearCart = useCallback(() => {
    setProductCart([]);
    setServiceCart([]);
    setProductQuantities(new Map());
    setShowCartDetails(false);
    setPaymentMethod(null);
    setPaymentStep('choose');
  }, []);

  const navigateToCheckout = useCallback(() => {
    // This will be called from components that have access to useNavigate
  }, []);

  return (
    <CartContext.Provider value={{
      productCart, productQuantities, serviceCart,
      showCartDetails, setShowCartDetails,
      clientCredit, paymentMethod, setPaymentMethod,
      paymentStep, setPaymentStep,
      toggleProductInCart, removeProductFromCart, updateProductQuantity, isInProductCart,
      toggleServiceInCart, isInServiceCart,
      totalCartItems, totalCartValue, needsTopUp, topUpAmount, creditUsed, remainingCredit,
      clearCart, navigateToCheckout,
      isMinimized, setIsMinimized, lastChangeTimestamp,
    }}>
      {children}
    </CartContext.Provider>
  );
};
