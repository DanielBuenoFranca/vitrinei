import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeId = 'standard' | 'tech-dark' | 'fastfood';

interface ThemeInfo {
  id: ThemeId;
  label: string;
  description: string;
  icon: string;
}

export const themes: ThemeInfo[] = [
  { id: 'standard', label: 'Profissional', description: 'Clean, moderno e confiável', icon: '💎' },
  { id: 'tech-dark', label: 'Futurista', description: 'Cyberpunk com neon e terminais', icon: '⚡' },
  { id: 'fastfood', label: 'Comercial', description: 'Amigável, 3D e vibrante', icon: '🎯' },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'standard', setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem('ecomei-theme') as ThemeId) || 'standard';
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem('ecomei-theme', t);
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
