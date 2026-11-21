import React from 'react';
import { readFileSync } from 'fs';
import path from 'path';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
import { HUB, YEOUN } from '../data/apps';
import { LEGAL_APP } from '../lib/legal';

const stageCss = readFileSync(path.join(__dirname, '..', 'styles', 'stage.css'), 'utf8');

// matchMedia that answers true to the phone width only (stacked page, motion allowed).
const stubPhone = () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }),
  });
};

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
  delete (window as Partial<Window>).matchMedia;
});

describe('phones: the scroll cue under the hero ticket', () => {
  test('is the hero\'s one visual link to the acts, at the end of the row the first screen ends on', () => {
    stubPhone();
    renderYeoun();
    const cue = screen.getByTestId('scroll-cue');
    expect(cue).toHaveAttribute('href', '#acts');
    expect(cue).toHaveTextContent(YEOUN.heroScrollCue);
    // It sits under the ticket, in the acts' eyebrow row; the ticket keeps only the Play badge, and in the page
    // (the menu, hidden on phones, aside) no other link goes to the acts.
    const row = within(screen.getByTestId('acts-lead'));
    expect(row.getByTestId('scroll-cue')).toBe(cue);
    expect(row.getByText(YEOUN.actsEyebrow)).toHaveClass('acts__eyebrow');
    expect(screen.queryByRole('link', { name: YEOUN.heroMore })).not.toBeInTheDocument();
    // A link inside the acts pointing at the acts goes nowhere for screen readers and the keyboard: they skip it.
    expect(cue).toHaveAttribute('aria-hidden', 'true');
    expect(cue).toHaveAttribute('tabindex', '-1');
    const inPage = within(screen.getByRole('main')).getAllByRole('link');
    expect(inPage.filter((link) => link.getAttribute('href') === '#acts')).toEqual([]);
  });

  test('fades out at the first scroll and stays gone back at the top', async () => {
    stubPhone();
    renderYeoun();
    const cue = screen.getByTestId('scroll-cue');
    expect(cue).not.toHaveAttribute('data-hidden');
    // A jitter of a few pixels is not a scroll yet.
    await scrollTo(6);
    expect(cue).not.toHaveAttribute('data-hidden');
    await scrollTo(40);
    expect(cue).toHaveAttribute('data-hidden');
    await scrollTo(0);
    expect(cue).toHaveAttribute('data-hidden');
  });

  test('a page opened part way down never shows it', () => {
    stubPhone();
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 });
    renderYeoun();
    expect(screen.getByTestId('scroll-cue')).toHaveAttribute('data-hidden');
  });

  // A link inside the site renders the app page while the window is still where the last page was scrolled to;
  // only after that does App's ScrollToTop take it to the top. The cue reads the position after that.
  describe('reached by a link from a page scrolled part way down', () => {
    const original = window.scrollTo;
    beforeEach(() => {
      Object.defineProperty(window, 'scrollTo', {
        configurable: true,
        writable: true,
        value: (_x: number, y: number) => {
          Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: y });
        },
      });
    });
    afterEach(() => {
      Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: original });
    });

    const followFrom = (path: string, y: number, link: string) => {
      stubPhone();
      render(
        <MemoryRouter initialEntries={ [ path ] }>
          <App />
        </MemoryRouter>,
      );
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: y });
      fireEvent.click(screen.getByRole('link', { name: link }));
      expect(window.scrollY).toBe(0);
    };

    test('from the hub\'s \'자세히 보기\', it shows at the top', () => {
      followFrom('/', 900, HUB.more);
      expect(screen.getByTestId('scroll-cue')).not.toHaveAttribute('data-hidden');
    });

    test('from a policy page\'s back link, it shows at the top', () => {
      followFrom('/yeoun/privacy', 1500, LEGAL_APP.backLabel);
      expect(screen.getByTestId('scroll-cue')).not.toHaveAttribute('data-hidden');
    });
  });

  test('hidden, it leaves the tab order; it nudges once at most, and not at all with reduced motion', () => {
    expect(stageCss).toMatch(/\.scroll-cue\[data-hidden\] \{[^}]*opacity:\s*0;[^}]*visibility:\s*hidden;/);
    expect(stageCss).toMatch(/\.scroll-cue__chevron \{[^}]*animation:\s*cue-nudge [\d.]+s [^;]* 1 both;/);
    expect(stageCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.scroll-cue__chevron \{\s*animation:\s*none;/,
    );
  });

  test('tablets and desktops keep the hero button and draw no cue', () => {
    renderYeoun();
    expect(screen.queryByTestId('scroll-cue')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: YEOUN.heroMore })).toHaveAttribute('href', '#acts');
    expect(screen.queryByTestId('acts-lead')).not.toBeInTheDocument();
  });
});
