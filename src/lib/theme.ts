import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

import { onMediaChange } from './mediaQuery';

// Light or dark, chosen with the header switch or, until then, taken from the system.
// The theme lives on <html data-theme>; every colour token keys off it (App.css), and the inline
// script in public/index.html sets it before the first paint with this same key and these colours.
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'site-theme';
// Browser bar colour per theme: the page paper (App.css --paper).
export const THEME_COLOR: Record<Theme, string> = { light: '#fbf6ee', dark: '#0d0d0d' };

const SYSTEM_DARK = '(prefers-color-scheme: dark)';
const html = () => document.documentElement;

// Browser storage can be missing or throw (private windows, blocked site data): the choice is a convenience.
export function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return typeof window.matchMedia === 'function' && window.matchMedia(SYSTEM_DARK).matches ? 'dark' : 'light';
}

export function currentTheme(): Theme {
  return html().dataset.theme === 'dark' ? 'dark' : 'light';
}

const listeners = new Set<() => void>();
// The visitor's choice in this visit — kept here too, since a blocked storage cannot remember it.
let chosen: Theme | null = null;
// Half turns of the switch's sun-and-moon orbit (ThemeToggle): one more at every actual change, so the orbit
// always turns the same way; even = the sun up (light), odd = the moon (dark).
let turns: number | null = null;

export function applyTheme(theme: Theme) {
  const before = html().dataset.theme;
  if (turns === null) {
    turns = theme === 'dark' ? 1 : 0;
  } else if (before !== theme) {
    turns += 1;
  }
  html().dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  listeners.forEach((listener) => listener());
}

export function setTheme(theme: Theme) {
  chosen = theme;
  applyTheme(theme);
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not remembered: the page still switches for this visit.
  }
}

type TransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// The header switch: the page cross-fades from one theme to the other (a View Transition, App.css) where
// the browser has them. Elsewhere, and with reduced motion, it switches at once. React renders inside the
// update (flushSync), so the new theme's captures are in the new picture.
export function switchTheme(theme: Theme) {
  const doc: TransitionDocument = document;
  const reduce = typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION).matches;
  if (typeof doc.startViewTransition !== 'function' || reduce) {
    setTheme(theme);
    return;
  }
  doc.startViewTransition(() => flushSync(() => setTheme(theme)));
}

// Applies the stored choice or the system theme, and keeps following the system until the visitor chooses.
export function initTheme() {
  applyTheme(storedTheme() ?? systemTheme());
  if (typeof window.matchMedia !== 'function') {
    return;
  }
  onMediaChange(window.matchMedia(SYSTEM_DARK), (event) => {
    if (chosen === null && storedTheme() === null) {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  });
}

// Every theme change goes through applyTheme, which notifies subscribers synchronously.
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// The theme in effect, re-rendering when it changes.
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => 'light');
}

export const orbitTurns = () => turns ?? (currentTheme() === 'dark' ? 1 : 0);

// The orbit's half turns so far, re-rendering when the theme changes.
export function useOrbitTurns(): number {
  return useSyncExternalStore(subscribe, orbitTurns, () => 0);
}
