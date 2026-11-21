import React from 'react';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
import ShotPicture from '../components/ShotPicture';
import ThemeToggle from '../components/ThemeToggle';
import { THEME_COLOR, THEME_KEY, applyTheme, initTheme, setTheme, storedTheme } from './theme';

const read = (...parts: string[]) => readFileSync(path.join(__dirname, '..', ...parts), 'utf8');
const html = document.documentElement;

type ThemeModule = typeof import('./theme');

// A fresh theme module (its in-visit choice starts empty) for tests that follow the system.
const freshTheme = (): ThemeModule => {
  let mod: ThemeModule | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    mod = require('./theme');
  });
  return mod as ThemeModule;
};

// A system colour-scheme query that starts at `dark` and can be flipped; `legacy` drops addEventListener
// like Safari before 14.
const stubSystem = (dark: boolean, legacy = false) => {
  const handlers: Array<(event: MediaQueryListEvent) => void> = [];
  const mq = {
    matches: dark,
    addListener: (handler: (event: MediaQueryListEvent) => void) => handlers.push(handler),
    removeListener: jest.fn(),
    ...(legacy ? {} : {
      addEventListener: (_type: string, handler: (event: MediaQueryListEvent) => void) => handlers.push(handler),
      removeEventListener: jest.fn(),
    }),
  };
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: jest.fn(() => mq) });
  return {
    flip: (next: boolean) => {
      mq.matches = next;
      act(() => handlers.forEach((handler) => handler({ matches: next } as MediaQueryListEvent)));
    },
  };
};

afterEach(() => {
  delete (window as Partial<Window>).matchMedia;
  jest.restoreAllMocks();
});

let meta: HTMLMetaElement;

beforeEach(() => {
  localStorage.clear();
  delete html.dataset.theme;
  meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = THEME_COLOR.light;
  document.head.appendChild(meta);
});

afterEach(() => {
  meta.remove();
});

describe('site theme', () => {
  test('setTheme puts the theme on <html>, remembers it and recolours the browser bar', () => {
    setTheme('dark');
    expect(html.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(meta).toHaveAttribute('content', THEME_COLOR.dark);
    setTheme('light');
    expect(html.dataset.theme).toBe('light');
    expect(storedTheme()).toBe('light');
  });

  test('without a stored choice the page follows the system (light without matchMedia)', () => {
    localStorage.setItem(THEME_KEY, 'sepia');
    expect(storedTheme()).toBeNull();
    initTheme();
    expect(html.dataset.theme).toBe('light');
  });

  test('a stored choice wins over the system', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    initTheme();
    expect(html.dataset.theme).toBe('dark');
  });

  test('with nothing stored it follows the system, live, until the visitor chooses', () => {
    const system = stubSystem(true);
    const theme = freshTheme();
    theme.initTheme();
    expect(html.dataset.theme).toBe('dark');
    system.flip(false);
    expect(html.dataset.theme).toBe('light');
    theme.setTheme('dark');
    system.flip(false);
    expect(html.dataset.theme).toBe('dark');
  });

  test('Safari before 14 (no MediaQueryList.addEventListener) still starts and follows the system', () => {
    const system = stubSystem(false, true);
    const theme = freshTheme();
    expect(() => theme.initTheme()).not.toThrow();
    expect(html.dataset.theme).toBe('light');
    system.flip(true);
    expect(html.dataset.theme).toBe('dark');
  });

  // Blocked site data: nothing is stored, but the choice still holds for the visit.
  test('with storage blocked, a choice is not undone by a later system change', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const system = stubSystem(false);
    const theme = freshTheme();
    theme.initTheme();
    theme.setTheme('dark');
    system.flip(true);
    system.flip(false);
    expect(html.dataset.theme).toBe('dark');
  });

  // The inline script in index.html applies the theme before the first paint: run it as the browser would.
  test.each([
    [ 'a stored choice', 'dark', false, 'dark' ],
    [ 'the system when nothing is stored', null, true, 'dark' ],
    [ 'light without a system query', null, undefined, 'light' ],
    [ 'the system when the stored value is unknown', 'sepia', false, 'light' ],
  ])('index.html applies %s before paint', (_case, stored, systemDark, expected) => {
    const page = read('..', 'public', 'index.html');
    expect(page.match(/<meta name="theme-color"/g)).toHaveLength(1);
    const script = page.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
    expect(script).toContain(`'${THEME_KEY}'`);
    if (stored !== null) {
      localStorage.setItem(THEME_KEY, stored as string);
    }
    if (systemDark !== undefined) {
      stubSystem(systemDark as boolean);
    }
    // eslint-disable-next-line no-new-func
    new Function(script)();
    expect(html.dataset.theme).toBe(expected);
    expect(meta).toHaveAttribute('content', THEME_COLOR[expected as 'light' | 'dark']);
  });

  // Dark tokens hang off data-theme only: a media query would ignore the switch.
  test('stylesheets key dark mode off data-theme, not the system query', () => {
    const cssFiles = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return cssFiles(full);
      }
      return entry.name.endsWith('.css') ? [ full ] : [];
    });
    const files = cssFiles(path.join(__dirname, '..'));
    expect(files.length).toBeGreaterThanOrEqual(5);
    files.forEach((file) => {
      expect({ file, hit: /prefers-color-scheme/.test(readFileSync(file, 'utf8')) }).toEqual({ file, hit: false });
    });
    expect(read('App.css')).toMatch(/:root\[data-theme='dark'\]\s*\{[^}]*--paper:\s*#0d0d0d;[^}]*color-scheme:\s*dark;/);
  });

  test('the toggle switches to the other theme and says what it will do', () => {
    applyTheme('light');
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: '다크 모드로 보기' });
    fireEvent.click(button);
    expect(html.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(screen.getByRole('button', { name: '라이트 모드로 보기' })).toBeInTheDocument();
  });

  test('app screenshots follow the chosen theme', () => {
    applyTheme('light');
    render(<ShotPicture base="/apps/yeoun/screens/home" alt="홈" width={ 540 } height={ 1200 } sizes="280px" />);
    expect(screen.getByRole('img', { name: '홈' })).toHaveAttribute('src', '/apps/yeoun/screens/home-light.jpg');
    act(() => setTheme('dark'));
    expect(screen.getByRole('img', { name: '홈' })).toHaveAttribute('src', '/apps/yeoun/screens/home-dark.jpg');
  });

  test.each([ '/', '/yeoun', '/nope' ])('%s has the theme switch', (route) => {
    render(
      <MemoryRouter initialEntries={ [ route ] }>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /모드로 보기$/ })).toBeInTheDocument();
  });
});
