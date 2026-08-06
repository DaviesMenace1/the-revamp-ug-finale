# Theme System Implementation Guide

## Overview

The Revamp UG now has a sophisticated dual-theme system that changes both the app UI AND the browser environment (address bar, scrollbars, status bar). This creates a seamless, immersive experience for users.

## What Was Created

### 1. Core Files

#### `lib/theme-provider.tsx` (172 lines)
- React Context Provider for theme management
- Handles theme persistence in localStorage
- Respects system preferences (`prefers-color-scheme: dark`)
- Updates browser UI (meta tags, color scheme)
- Manages transitions between themes

#### `components/theme-switcher.tsx` (71 lines)
- `ThemeSwitcher` - Simple toggle button (Sun/Moon icons)
- `ThemeSwitcherDropdown` - Dropdown with Light/Dark options
- Smooth icon animations and transitions
- Accessible with ARIA labels

#### `app/layout.tsx` (Updated)
- Added `ThemeProvider` wrapper
- Inline script prevents flash of wrong theme on load
- Updated viewport and metadata for theme support
- iOS status bar styling support

## How It Works

### Theme Application Flow

```
User Clicks Theme Toggle
        ↓
useTheme hook triggered
        ↓
localStorage updated ('revamp-theme-preference')
        ↓
applyTheme(newTheme) function
        ↓
├─ Add/remove .dark class on <html>
├─ Update document.documentElement.style.colorScheme
├─ Update meta[name="theme-color"] for browser
└─ Update iOS status bar styling
        ↓
Tailwind CSS applies dark: prefixed styles
        ↓
Browser UI theme changes (address bar, scrollbars, etc.)
```

### Browser UI Changes

**Light Theme:**
- Address bar: White/Light background
- Scrollbars: Light gray
- Status bar (iOS): Default style
- Tab bar: Light appearance

**Dark Theme:**
- Address bar: Dark/Black background
- Scrollbars: Dark gray
- Status bar (iOS): Black translucent
- Tab bar: Dark appearance

### System Preference Detection

1. App checks localStorage first
2. If no preference stored, checks system `prefers-color-scheme`
3. Listens for system changes (desktop dark/light mode toggle)
4. User preference always takes precedence over system setting

## Usage

### Add Theme Switcher to Your App

Option 1: Simple Toggle Button
```tsx
import { ThemeSwitcher } from '@/components/theme-switcher'

export default function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <ThemeSwitcher />
      </nav>
    </header>
  )
}
```

Option 2: Dropdown Menu
```tsx
import { ThemeSwitcherDropdown } from '@/components/theme-switcher'

export default function SettingsMenu() {
  return <ThemeSwitcherDropdown />
}
```

### Use Theme in Components

```tsx
'use client'

import { useTheme } from '@/lib/theme-provider'

export function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme()

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Use Dark Mode</button>
      <button onClick={() => setTheme('light')}>Use Light Mode</button>
    </div>
  )
}
```

### Conditional Styling

Use Tailwind's `dark:` prefix for theme-aware styles:

```tsx
export function Card() {
  return (
    <div className="bg-white text-black dark:bg-black dark:text-white">
      Light background with dark text, or dark background with light text
    </div>
  )
}
```

## Tailwind CSS Integration

The app already uses Tailwind's dark mode with the `.dark` class strategy. All existing dark mode styles work automatically:

```css
/* Light mode (default) */
.element {
  @apply bg-white text-black;
}

/* Dark mode */
.dark .element {
  @apply bg-black text-white;
}
```

Or in components:

```tsx
<div className="bg-white dark:bg-black">Content</div>
```

## CSS Variables

Theme colors are defined in `app/globals.css` using CSS custom properties:

### Light Theme `:root`
```css
:root {
  --background: oklch(1 0 0);      /* White */
  --foreground: oklch(0.145 0 0);  /* Dark gray/black */
  --primary: oklch(0.205 0 0);
  --card: oklch(1 0 0);
  /* ... more colors */
}
```

### Dark Theme `.dark`
```css
.dark {
  --background: oklch(0.145 0 0);  /* Dark gray/black */
  --foreground: oklch(0.985 0 0);  /* White */
  --primary: oklch(0.922 0 0);
  --card: oklch(0.205 0 0);
  /* ... more colors */
}
```

## Browser UI Changes

### Meta Tags

The theme system updates these meta tags dynamically:

```html
<!-- Theme color for browser UI -->
<meta name="theme-color" content="#ffffff" />

<!-- Media-specific theme colors -->
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />

<!-- iOS Safari status bar -->
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<!-- Or "black-translucent" in dark mode -->
```

## Flash Prevention

The inline script in `layout.tsx` prevents the "flash of wrong theme" on page load:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      try {
        const theme = localStorage.getItem('revamp-theme-preference') || 
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        document.documentElement.style.colorScheme = theme;
      } catch (e) {}
    `,
  }}
/>
```

This runs immediately before React hydration, ensuring the correct theme is applied before content renders.

## Features

- ✅ Light and Dark themes
- ✅ Browser UI theme synchronization (address bar, scrollbars, status bar)
- ✅ System preference detection and persistence
- ✅ localStorage persistence
- ✅ No flash of wrong theme on page load
- ✅ Smooth transitions between themes
- ✅ iOS status bar support
- ✅ Android browser UI support
- ✅ TypeScript support
- ✅ Accessible components
- ✅ Works with all Tailwind CSS utilities

## Testing

### Browser DevTools
1. Open DevTools → Rendering tab
2. Check "Emulate CSS media feature prefers-color-scheme"
3. Toggle between Light and Dark to test

### Mobile Testing
1. iOS: Change system Dark Mode setting and refresh
2. Android: Change system Dark Mode setting and refresh
3. Both: Theme should match your browser UI

### localStorage Testing
1. Open DevTools → Application/Storage → localStorage
2. Find `revamp-theme-preference` entry
3. Verify it updates when you toggle theme

## Performance

- ✅ No layout shift when switching themes
- ✅ Inline script = no CLS impact
- ✅ CSS variables = instant color updates
- ✅ localStorage = fast persistence
- ✅ Context API = minimal re-renders (only theme consumers)

## Browser Support

| Feature | Support |
|---------|---------|
| CSS variables | All modern browsers |
| localStorage | All modern browsers |
| prefers-color-scheme | All modern browsers |
| meta[theme-color] | Chrome 39+, Firefox 60+, Safari 15+ |
| iOS status bar | Safari 15+ |

## Future Enhancements

1. **Custom Theme Colors** - Users could customize light/dark colors
2. **Schedule-based Themes** - Auto-switch at sunset/sunrise
3. **Per-Page Themes** - Different themes for different sections
4. **More Themes** - Add additional theme variants beyond light/dark
5. **Theme Sync** - Sync theme across browser tabs

## Troubleshooting

### Theme not persisting
- Check if localStorage is enabled in browser
- Check browser console for errors
- Verify `suppressHydrationWarning` is on `<html>` tag

### Flash of wrong theme on load
- Verify inline script is in `<head>`
- Script must run before React hydration
- Check if localStorage key name matches

### Browser UI not changing
- Verify `meta[name="theme-color"]` is in document
- Check browser supports theme-color meta tag
- Some browsers require user interaction first

### Styles not applying
- Check if `.dark` class is on `<html>` element
- Verify Tailwind is processing `dark:` prefixed styles
- Check tailwind.config.js has `darkMode: 'class'`

## Resources

- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [Web.dev: Dark mode](https://web.dev/prefers-color-scheme/)
- [Schema.org: theme-color](https://html.spec.whatwg.org/multipage/semantics.html#meta-theme-color)
- [Tailwind: Dark Mode](https://tailwindcss.com/docs/dark-mode)
