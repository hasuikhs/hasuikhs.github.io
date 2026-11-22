import React from 'react';
import { readFileSync } from 'fs';
import path from 'path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
import { HUB, YEOUN } from '../data/apps';
import { SCROLLED_AFTER } from '../hooks/useHasScrolled';
import { STAGE_QUERY } from '../hooks/useTearStage';
import { LEGAL_APP } from '../lib/legal';

const stageCss = readFileSync(path.join(__dirname, '..', 'styles', 'stage.css'), 'utf8');

// stage.css without its comments, and the top-level rule (not inside @media) for a selector.
const stageRules = stageCss.replace(/\/\*[\s\S]*?\*\//g, '');
const topLevelRule = (selector: string) => {
  const at = stageRules.indexOf(`\n${selector} {`);
  expect(at).toBeGreaterThan(-1);
  return stageRules.slice(at, stageRules.indexOf('}', at) + 1);
};

// matchMedia that answers true to one query only.
const stubMedia = (only: string) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query === only,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }),
  });
};

// The phone width only (stacked page, motion allowed).
const stubPhone = () => stubMedia('(max-width: 767px)');

const renderYeoun = () => render(
  <MemoryRouter initialEntries={ [ '/yeoun' ] }>
    <App />
  </MemoryRouter>,
);

const setScrollY = (y: number) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: y });
};

// Let the once-a-frame reader run.
const nextFrame = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 40));
});

// Scroll the jsdom window and let the reader run.
const scrollTo = async (y: number) => {
  setScrollY(y);
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 40));
  });
};

afterEach(() => {
  setScrollY(0);
  delete (window as Partial<Window>).matchMedia;
});

describe('phones: the scroll hint under the hero ticket', () => {
  test('is the same wordless icon as the stage\'s, between the ticket and the acts, and not a link', () => {
    stubPhone();
    renderYeoun();
    const hint = screen.getByTestId('tear-hint');
    expect(hint).toHaveAttribute('aria-hidden', 'true');
    expect(hint.textContent).toBe('');
    expect(hint.innerHTML).toMatch(/<svg[^>]*class="tear__hint-chevron"/);
    // Not a link itself, not inside one, and none inside it.
    expect(hint.closest('a')).toBeNull();
    expect(hint.querySelector('a')).toBeNull();
    // It comes after the hero ticket and before the acts.
    const ticket = screen.getByTestId('hero-stub').closest('.tear__ticket');
    const acts = document.getElementById('acts');
    expect(ticket?.nextElementSibling).toBe(hint);
    expect(hint.nextElementSibling).toBe(acts);
    // The acts' eyebrow stands alone again: no worded cue, and (the menu, hidden on phones, aside) no link in
    // the page goes to the acts, hidden from screen readers or not.
    expect(screen.getByText(YEOUN.actsEyebrow, { selector: '.acts__eyebrow' }).parentElement).toHaveClass('acts__head');
    expect(screen.queryByText(/넘겨 보기/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: YEOUN.heroMore })).not.toBeInTheDocument();
    expect(screen.getByRole('main').querySelector('a[href="#acts"]')).toBeNull();
  });

  test('fades out at the first scroll and stays gone back at the top', async () => {
    stubPhone();
    renderYeoun();
    const hint = screen.getByTestId('tear-hint');
    expect(hint).not.toHaveAttribute('data-hidden');
    // A jitter of a few pixels is not a scroll yet.
    await scrollTo(SCROLLED_AFTER - 2);
    expect(hint).not.toHaveAttribute('data-hidden');
    await scrollTo(40);
    expect(hint).toHaveAttribute('data-hidden');
    await scrollTo(0);
    expect(hint).toHaveAttribute('data-hidden');
  });

  test('a page opened part way down never shows it', async () => {
    stubPhone();
    setScrollY(900);
    renderYeoun();
    await nextFrame();
    expect(screen.getByTestId('tear-hint')).toHaveAttribute('data-hidden');
  });

  // Back / forward: the page renders (effects included) inside the popstate handler, while the window is still
  // where the page being left was scrolled to; the browser restores this page's own position right after. Read
  // at once, a page that comes back at the top hid its hint for good.
  test('reads the position a frame after it renders, once a back or forward has restored the scroll', async () => {
    stubPhone();
    setScrollY(1500);
    renderYeoun();
    setScrollY(0);
    await nextFrame();
    expect(screen.getByTestId('tear-hint')).not.toHaveAttribute('data-hidden');
  });

  // A link inside the site renders the app page while the window is still where the last page was scrolled to;
  // only after that does App's ScrollToTop take it to the top. The hint reads the position after that.
  describe('reached by a link from a page scrolled part way down', () => {
    const original = window.scrollTo;
    beforeEach(() => {
      Object.defineProperty(window, 'scrollTo', {
        configurable: true,
        writable: true,
        value: (_x: number, y: number) => {
          setScrollY(y);
        },
      });
    });
    afterEach(() => {
      Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: original });
    });

    const followFrom = async (from: string, y: number, link: string) => {
      stubPhone();
      render(
        <MemoryRouter initialEntries={ [ from ] }>
          <App />
        </MemoryRouter>,
      );
      setScrollY(y);
      fireEvent.click(screen.getByRole('link', { name: link }));
      expect(window.scrollY).toBe(0);
      await nextFrame();
    };

    test('from the hub\'s \'자세히 보기\', it shows at the top', async () => {
      await followFrom('/', 900, HUB.more);
      expect(screen.getByTestId('tear-hint')).not.toHaveAttribute('data-hidden');
    });

    test('from a policy page\'s back link, it shows at the top', async () => {
      await followFrom('/yeoun/privacy', 1500, LEGAL_APP.backLabel);
      expect(screen.getByTestId('tear-hint')).not.toHaveAttribute('data-hidden');
    });
  });
});

// The stub tears into the hint's place on phones, so the hint has to be on its way out first: both wait for
// the same first scroll.
describe('the first scroll: the hint leaves before the stub tears', () => {
  const zero = { x: 0, y: 0, top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, toJSON: () => ({}) };
  let rects: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    // A tall phone: the hero stub already sits where it may tear (the top 65% of a 768px window) at scroll 0.
    rects = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function rect(this: HTMLElement) {
      return this.classList.contains('ticket__piece--stub')
        ? { ...zero, top: 400, bottom: 457, y: 400, width: 343, right: 343, height: 57 }
        : zero;
    });
  });
  afterEach(() => {
    rects.mockRestore();
    jest.useRealTimers();
  });

  const scrollEvent = (y: number, wait: number) => {
    setScrollY(y);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(wait);
    });
  };

  test('a scroll event that leaves the page at the top arms nothing; the reader\'s own scroll does', () => {
    stubPhone();
    renderYeoun();
    const hint = screen.getByTestId('tear-hint');
    const ticket = screen.getByTestId('hero-stub').closest('.ticket');
    expect(ticket).toHaveClass('ticket--hero');
    // App's ScrollToTop after a link, or a jitter: the stub could tear by itself here, over the hint.
    scrollEvent(0, 4000);
    scrollEvent(SCROLLED_AFTER, 4000);
    expect(hint).not.toHaveAttribute('data-hidden');
    expect(ticket).not.toHaveClass('is-dropped');
    // The reader scrolls: the hint leaves on the next frame, the stub only once the scroll has come to rest.
    scrollEvent(SCROLLED_AFTER + 1, 40);
    expect(hint).toHaveAttribute('data-hidden');
    expect(ticket).not.toHaveClass('is-dropped');
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(ticket).toHaveClass('is-dropped');
  });
});

describe('tablets: the stacked page past the phone width', () => {
  test('keep the hero button and draw the same hint, which leaves at the first scroll too', async () => {
    // No matchMedia: not a phone, and no stage either.
    renderYeoun();
    expect(screen.getByTestId('tear')).toHaveAttribute('data-mode', 'stacked');
    expect(screen.getByRole('link', { name: YEOUN.heroMore })).toHaveAttribute('href', '#acts');
    const hint = screen.getByTestId('tear-hint');
    expect(hint).not.toHaveAttribute('data-hidden');
    await scrollTo(40);
    expect(hint).toHaveAttribute('data-hidden');
    await scrollTo(0);
    expect(hint).toHaveAttribute('data-hidden');
  });
});

describe('desktops: the stage', () => {
  test('the hint never leaves on a scroll: the stage scrubs it, so it is back at the top', async () => {
    stubMedia(STAGE_QUERY);
    renderYeoun();
    expect(screen.getByTestId('tear')).toHaveAttribute('data-mode', 'stage');
    const hint = screen.getByTestId('tear-hint');
    await scrollTo(400);
    expect(hint).not.toHaveAttribute('data-hidden');
    await scrollTo(0);
    expect(hint).not.toHaveAttribute('data-hidden');
  });
});

describe('the hint\'s styles', () => {
  test('the stacked page draws it in the flow, centred, at every width; hidden, it fades and leaves the page', () => {
    const inFlow = topLevelRule('.tear[data-mode=\'stacked\'] .tear__hint');
    expect(inFlow).toMatch(/position:\s*static;/);
    expect(inFlow).toMatch(/margin:\s*0 auto;/);
    expect(inFlow).toMatch(/transform:\s*none;/);
    // Over the hero ticket's shadow, as in the stage (there by z-index): the dark shadow hid the tear line.
    expect(inFlow).toMatch(/isolation:\s*isolate;/);
    // It used to be hidden on the stacked page.
    expect(stageRules).not.toMatch(/\.tear__hint[^{]*\{[^}]*display:\s*none/);
    const hidden = topLevelRule('.tear[data-mode=\'stacked\'] .tear__hint[data-hidden]');
    expect(hidden).toMatch(/opacity:\s*0;/);
    expect(hidden).toMatch(/visibility:\s*hidden;/);
    // Only the stacked page hides it by the attribute: the stage scrubs its opacity (--hint-o).
    expect(stageRules.match(/\.tear__hint\[data-hidden\]/g)).toHaveLength(1);
    expect(topLevelRule('.tear__hint')).toMatch(/opacity:\s*var\(--hint-o, 1\);/);
  });

  test('phones shorten its tear line and bring the acts up; tablets fit it in the room under the ticket', () => {
    // Phones: 4px under the ticket + 2px + 14px line + 4px + 20px chevron + 10px = 54px to the acts.
    expect(stageRules).toMatch(
      /@media \(max-width: 767px\) \{\s*\.tear\[data-mode='stacked'\] \.tear__hint \{\s*padding-top:\s*2px;\s*\}\s*\.tear\[data-mode='stacked'\] \.tear__hint-inner::before \{\s*height:\s*14px;/,
    );
    expect(stageRules).toMatch(
      /@media \(max-width: 767px\) \{\s*\.tear\[data-mode='stacked'\] \.acts__inner \{\s*padding-top:\s*10px;/,
    );
    // Tablets: 16px + the 48px hint (24px line + 4px + 20px chevron) = the 64px there was under the ticket.
    expect(stageRules).toMatch(
      /@media \(min-width: 768px\) \{\s*\.tear\[data-mode='stacked'\] \.tear__ticket \{\s*padding:\s*32px var\(--g\) 16px;/,
    );
    expect(topLevelRule('.tear__hint-inner::before')).toMatch(/height:\s*24px;/);
    expect(topLevelRule('.tear__hint-inner')).toMatch(/gap:\s*4px;/);
  });

  test('its chevron keeps nudging, and not at all with reduced motion', () => {
    expect(stageRules).toMatch(/\.tear__hint-chevron \{[^}]*animation:\s*hint-nudge [\d.]+s [^;]*infinite;/);
    expect(stageRules).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.tear__hint-chevron \{\s*animation:\s*none;/,
    );
  });
});
