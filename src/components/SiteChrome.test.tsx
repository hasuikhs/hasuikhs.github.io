import React from 'react';
import { readFileSync } from 'fs';
import path from 'path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
import { SITE } from '../data/apps';
import { applyTheme, currentTheme, switchTheme } from '../lib/theme';

const sectionsCss = readFileSync(path.join(__dirname, '..', 'styles', 'sections.css'), 'utf8');
const appCss = readFileSync(path.join(__dirname, '..', 'App.css'), 'utf8');

const renderYeoun = () => render(
  <MemoryRouter initialEntries={ [ '/yeoun' ] }>
    <App />
  </MemoryRouter>,
);

// Scroll the jsdom window and let the once-a-frame reader run.
const scrollTo = async (y: number) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: y });
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 40));
  });
};

afterEach(() => {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
  Reflect.deleteProperty(document, 'startViewTransition');
  delete (window as Partial<Window>).matchMedia;
});

describe('sticky header', () => {
  test('slides away while scrolling down and comes back on a scroll up', async () => {
    renderYeoun();
    const header = screen.getByRole('banner');
    expect(header).not.toHaveAttribute('data-hidden');
    await scrollTo(600);
    expect(header).toHaveAttribute('data-hidden');
    await scrollTo(560);
    expect(header).not.toHaveAttribute('data-hidden');
    // Near the top it always shows.
    await scrollTo(900);
    await scrollTo(80);
    expect(header).not.toHaveAttribute('data-hidden');
  });

  test('is sticky, and a keyboard reader inside it always sees it', () => {
    expect(sectionsCss).toMatch(/\.site-header \{[^}]*position:\s*sticky;[^}]*top:\s*0;/);
    expect(sectionsCss).toMatch(/\.site-header\[data-hidden\] \{\s*transform:\s*translateY\(-100%\);/);
    expect(sectionsCss).toMatch(/\.site-header:has\(:focus-visible\) \{\s*transform:\s*none;/);
  });
});

describe('back to top', () => {
  test('shows past a screen and a half, scrolls to the top and hands focus to the header', async () => {
    const original = window.scrollTo;
    const scroll = jest.fn();
    Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: scroll });
    try {
      renderYeoun();
      const button = screen.getByRole('button', { name: SITE.backToTop });
      expect(button).not.toHaveAttribute('data-visible');
      await scrollTo(window.innerHeight * 1.6);
      expect(button).toHaveAttribute('data-visible');
      fireEvent.click(button);
      expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      expect(screen.getByRole('link', { name: SITE.backToHub })).toHaveFocus();
    } finally {
      Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: original });
    }
  });

  test('a hidden button cannot be reached by keyboard', () => {
    expect(sectionsCss).toMatch(/\.back-to-top \{[^}]*visibility:\s*hidden;/);
    expect(sectionsCss).toMatch(/\.back-to-top\[data-visible\] \{[^}]*visibility:\s*visible;/);
  });
});

describe('theme switch', () => {
  // Each switch turns the orbit another half circle the same way, so the sky never winds back.
  test('shows the sun and the moon on one orbit that turns another half circle at every switch', () => {
    applyTheme('light');
    renderYeoun();
    const button = screen.getByRole('button', { name: SITE.themeToDark });
    expect(button.innerHTML).toMatch(/theme-toggle__body--sun/);
    expect(button.innerHTML).toMatch(/theme-toggle__body--moon/);
    const turn = () => Number(button.innerHTML.match(/--orbit-turn:\s*(\d+)deg/)?.[1]);
    const start = turn();
    expect(start % 360).toBe(0);
    fireEvent.click(button);
    expect(turn()).toBe(start + 180);
    fireEvent.click(button);
    expect(turn()).toBe(start + 360);
    expect(sectionsCss).toMatch(/\.theme-toggle__orbit \{[^}]*transform:\s*rotate\(var\(--orbit-turn, 0deg\)\);[^}]*transition:\s*transform 0\.7s/);
  });

  // Even half turns put the sun up, odd ones the moon (the count runs on across the visit).
  test('in dark the moon is up, in light the sun', () => {
    applyTheme('dark');
    renderYeoun();
    const turn = Number(screen.getByRole('button', { name: SITE.themeToLight }).innerHTML.match(/--orbit-turn:\s*(\d+)deg/)?.[1]);
    expect(turn % 360).toBe(180);
  });

  test('cross-fades the page where View Transitions exist, keeping the switch out of the fade', () => {
    applyTheme('light');
    const start = jest.fn((update: () => void) => update());
    Object.defineProperty(document, 'startViewTransition', { configurable: true, writable: true, value: start });
    switchTheme('dark');
    expect(start).toHaveBeenCalledTimes(1);
    expect(currentTheme()).toBe('dark');
    expect(appCss).toMatch(/::view-transition-old\(root\),\s*::view-transition-new\(root\) \{\s*animation-duration:\s*0\.45s;/);
    expect(sectionsCss).toMatch(/view-transition-name:\s*theme-toggle;/);
  });

  test('switches at once with reduced motion or without View Transitions', () => {
    applyTheme('light');
    switchTheme('dark');
    expect(currentTheme()).toBe('dark');
    const start = jest.fn();
    Object.defineProperty(document, 'startViewTransition', { configurable: true, writable: true, value: start });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)', addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined }),
    });
    switchTheme('light');
    expect(start).not.toHaveBeenCalled();
    expect(currentTheme()).toBe('light');
  });
});
