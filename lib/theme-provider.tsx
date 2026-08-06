'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'revamp-theme-preference';
const SYSTEM_THEME_MEDIA = '(prefers-color-scheme: dark)';

// Theme configuration with browser colors
const THEME_CONFIG = {
  light: {
    className: 'light',
    browserThemeColor: '#ffffff',
    browserMetaThemeColor: '#ffffff',
  },
  dark: {
    className: 'dark',
    browserThemeColor: '#000000',
    browserMetaThemeColor: '#1a1a1a',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // Check localStorage first
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

    if (storedTheme) {
      setThemeState(storedTheme);
      applyTheme(storedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(SYSTEM_THEME_MEDIA).matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      setThemeState(systemTheme);
      applyTheme(systemTheme);
    }

    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_THEME_MEDIA);

    const handleChange = (e: MediaQueryListEvent) => {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      // Only change if user hasn't set a preference
      if (!storedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : 'light', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Apply theme to the entire application and browser UI
 */
function applyTheme(theme: Theme) {
  const config = THEME_CONFIG[theme];

  // Apply to document element (for CSS dark mode)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }

  // Update browser color scheme in meta tag
  updateThemeColorMeta(config.browserThemeColor, config.browserMetaThemeColor);

  // Update system theme
  document.documentElement.style.colorScheme = theme;

  // Update iOS status bar (Safari)
  updateStatusBarStyle(theme);
}

/**
 * Update meta theme-color tag for browser UI
 */
function updateThemeColorMeta(themeColor: string, metaColor: string) {
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');

  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }

  metaThemeColor.setAttribute('content', themeColor);

  // Also update the media-specific theme colors
  let lightThemeColor = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
  if (!lightThemeColor) {
    lightThemeColor = document.createElement('meta');
    lightThemeColor.setAttribute('name', 'theme-color');
    lightThemeColor.setAttribute('media', '(prefers-color-scheme: light)');
    document.head.appendChild(lightThemeColor);
  }

  let darkThemeColor = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
  if (!darkThemeColor) {
    darkThemeColor = document.createElement('meta');
    darkThemeColor.setAttribute('name', 'theme-color');
    darkThemeColor.setAttribute('media', '(prefers-color-scheme: dark)');
    document.head.appendChild(darkThemeColor);
  }
}

/**
 * Update iOS Safari status bar appearance
 */
function updateStatusBarStyle(theme: Theme) {
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

  if (!statusBarMeta) {
    statusBarMeta = document.createElement('meta');
    statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(statusBarMeta);
  }

  // 'black-translucent' for dark, 'default' for light
  const style = theme === 'dark' ? 'black-translucent' : 'default';
  statusBarMeta.setAttribute('content', style);
}
