import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export type FavoriteKind = 'provider' | 'service' | 'product';

export interface FavoriteItem {
  kind: FavoriteKind;
  id: string | number;
  name: string;
  slug?: string;     // for providers
  image?: string | null;
  provider?: string; // for items
  addedAt: number;
}

const STORAGE_KEY = 'vitrinei.favorites.v1';

interface Ctx {
  favorites: FavoriteItem[];
  isFavorite: (kind: FavoriteKind, id: string | number) => boolean;
  toggle: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  remove: (kind: FavoriteKind, id: string | number) => void;
  clear: () => void;
  count: number;
}

const FavoritesCtx = createContext<Ctx | null>(null);

function load(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => load());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  const isFavorite = useCallback(
    (kind: FavoriteKind, id: string | number) =>
      favorites.some((f) => f.kind === kind && String(f.id) === String(id)),
    [favorites],
  );

  const toggle = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.kind === item.kind && String(f.id) === String(item.id));
      if (exists) return prev.filter((f) => !(f.kind === item.kind && String(f.id) === String(item.id)));
      return [{ ...item, addedAt: Date.now() }, ...prev];
    });
  }, []);

  const remove = useCallback((kind: FavoriteKind, id: string | number) => {
    setFavorites((prev) => prev.filter((f) => !(f.kind === kind && String(f.id) === String(id))));
  }, []);

  const clear = useCallback(() => setFavorites([]), []);

  return (
    <FavoritesCtx.Provider value={{ favorites, isFavorite, toggle, remove, clear, count: favorites.length }}>
      {children}
    </FavoritesCtx.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesCtx);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
