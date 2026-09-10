'use client';

import { useTheme } from '@/lib/theme-provider';
import { Moon, Sun } from '@/components/ui/luxury-icons';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative size-12 rounded-full border border-border/80 bg-background/95 text-foreground shadow-lg backdrop-blur-xl transition-transform hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 transition-all duration-300 ease-in-out" />
      ) : (
        <Sun className="h-5 w-5 transition-all duration-300 ease-in-out" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
