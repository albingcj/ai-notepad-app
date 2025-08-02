import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '../interfaces/types';
import { THEME_COLORS } from '../interfaces/constants';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getThemeColors: () => Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  
  // S1: Initialize theme
  // Determines the initial theme based on system preference or saved setting
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      if (savedTheme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? 'dark' : 'light');
      } else {
        setThemeState(savedTheme);
      }
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);
  
  // S2: Apply theme to document
  // Updates the document theme class when theme changes
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);
  
  // S3: Set theme
  // Updates the current theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // S4: Toggle theme
  // Switches between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };
  
  // S5: Get theme colors
  // Returns the color palette for the current theme
  const getThemeColors = () => {
    return theme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light;
  };
  
  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    getThemeColors
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
