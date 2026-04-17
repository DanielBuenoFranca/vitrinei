import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeId = 'espacial' | 'comercial';

interface ThemeInfo {
  id: ThemeId;
  label: string;
  description: string;
  icon: string;
}

export const themes: ThemeInfo[] = [
  { id: 'espacial', label: 'Espacial', description: 'Holograma cósmico, neon ciano e magenta', icon: '🌌' },
  { id: 'comercial', label: 'Comercial', description: 'Vidro fosco, silver e cyan suave', icon: '💎' },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'espacial', setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

const LEGACY_MAP: Record<string, ThemeId> = {
  standard: 'comercial',
  'tech-dark': 'espacial',
  fastfood: 'comercial',
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('vitrinei-theme') || localStorage.getItem('ecomei-theme');
    if (stored === 'espacial' || stored === 'comercial') return stored;
    if (stored && LEGACY_MAP[stored]) return LEGACY_MAP[stored];
    return 'espacial';
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem('vitrinei-theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
