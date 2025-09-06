import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, ThemeContextType } from '../types/theme';
import { themes, defaultTheme } from '../themes';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Apply CSS variables when theme changes
  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Save to localStorage
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
  };

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    themes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};