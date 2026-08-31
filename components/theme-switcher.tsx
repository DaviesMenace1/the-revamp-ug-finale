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

export function ThemeSwitcherDropdown() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => setTheme('light')}
        className="h-7 w-7 rounded-full"
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => setTheme('dark')}
        className="h-7 w-7 rounded-full"
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  );
}
