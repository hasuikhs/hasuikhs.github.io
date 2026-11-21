import React from 'react';
import { act, render, screen } from '@testing-library/react';

import useReveal, { FIRST_SCREEN_DELAY, onScreenAtRest, ownOffsetY } from './useReveal';

let observers: FakeIntersectionObserver[] = [];
class FakeIntersectionObserver implements IntersectionObserver {
  readonly root = null;

  readonly rootMargin = '';

  readonly thresholds = [];

  targets: Element[] = [];

  constructor(readonly callback: IntersectionObserverCallback) {
    observers.push(this);
  }

  observe(target: Element) {
    this.targets.push(target);
  }

  unobserve(target: Element) {
    this.targets = this.targets.filter((el) => el !== target);
  }

  disconnect() {
    this.targets = [];
  }

  takeRecords() {
    return [];
  }
}

const show = (targets: Element[]) => {
  observers.forEach((o) => {
    const entries = targets.filter((t) => o.targets.includes(t)).map((target): IntersectionObserverEntry => {
      const rect = target.getBoundingClientRect();
      return { target, isIntersecting: true, intersectionRatio: 1, boundingClientRect: rect, intersectionRect: rect, rootBounds: null, time: 0 };
    });
    if (entries.length) {
      o.callback(entries, o);
    }
  });
};

const observed = () => observers.flatMap((o) => o.targets);

function Page() {
  useReveal();
  return (
    <>
      <p data-reveal="">첫 화면</p>
      <p data-reveal="">아래</p>
    </>
  );
}

const html = document.documentElement;

beforeEach(() => {
  observers = [];
  Object.defineProperty(window, 'IntersectionObserver', { configurable: true, writable: true, value: FakeIntersectionObserver });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'IntersectionObserver');
  html.classList.remove('js', 'fonts-ready');
  jest.restoreAllMocks();
});

test('on a scripted load, reveals wait for the display face, and the first screen comes in after the hero', async () => {
  html.classList.add('js');
  render(<Page />);
  expect(observers).toHaveLength(0);

  await act(async () => {
    html.classList.add('fonts-ready');
  });
  expect(observers).toHaveLength(1);

  const first = screen.getByText('첫 화면');
  show([ first ]);
  expect(first).toHaveClass('is-in');
  expect(first.style.transitionDelay).toBe(FIRST_SCREEN_DELAY);

  const later = screen.getByText('아래');
  show([ later ]);
  expect(later).toHaveClass('is-in');
  expect(later.style.transitionDelay).toBe('');
});

test('once the face is ready (or without the scripted load) reveals start at once, with no delay', () => {
  html.classList.add('js', 'fonts-ready');
  render(<Page />);
  expect(observers).toHaveLength(1);
  const first = screen.getByText('첫 화면');
  show([ first ]);
  expect(first.style.transitionDelay).toBe('');
});

describe('phones: what peeks in at the bottom of the first screen', () => {
  // jsdom lays nothing out: each element's box comes from its data-top/data-height (none = not drawn), and its own
  // transform from data-shift (the hidden reveal's --y, as the browser's computed matrix).
  const VIEWPORT_H = window.innerHeight;
  beforeEach(() => {
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function box(this: Element) {
      const top = Number(this.getAttribute('data-top') ?? 0);
      const height = Number(this.getAttribute('data-height') ?? (this.hasAttribute('data-top') ? 20 : 0));
      const width = height > 0 ? 300 : 0;
      return { top, bottom: top + height, left: 0, right: width, width, height, x: 0, y: top, toJSON: () => ({}) };
    });
    const computed = window.getComputedStyle.bind(window);
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
      const style = computed(el, pseudo);
      const shift = el.getAttribute('data-shift');
      return shift ? ({ ...style, transform: `matrix(1, 0, 0, 1, 0, ${shift})` } as CSSStyleDeclaration) : style;
    });
  });

  function PhonePage({ peek = true }: { peek?: boolean }) {
    useReveal(undefined, { revealPeeking: peek });
    return (
      <>
        <p data-reveal="" data-top="120">위</p>
        { /* Its top edge 4px inside the bottom of the screen. */ }
        <p data-reveal="" data-top={ VIEWPORT_H - 4 }>끝에 걸친 제목</p>
        { /* Hidden 12px low (--y), it rests 8px inside the screen. */ }
        <p data-reveal="" data-top={ VIEWPORT_H + 4 } data-shift="12">내려앉은 제목</p>
        <h3 data-reveal-lines="" data-top={ VIEWPORT_H - 10 } data-height="40">줄 제목</h3>
        <p data-reveal="" data-top={ VIEWPORT_H + 40 }>화면 밖</p>
        <p data-reveal="" data-top={ -200 }>지나간 것</p>
        <p data-reveal="">그려지지 않는 것</p>
      </>
    );
  }

  test('on the first pass, anything on screen where it rests comes in with the first-screen delay', async () => {
    html.classList.add('js');
    render(<PhonePage />);
    await act(async () => {
      html.classList.add('fonts-ready');
    });
    [ '위', '끝에 걸친 제목', '내려앉은 제목', '줄 제목' ].forEach((text) => {
      const el = screen.getByText(text);
      expect(el).toHaveClass('is-in');
      expect(el.style.transitionDelay).toBe(FIRST_SCREEN_DELAY);
      expect(observed()).not.toContain(el);
    });
    // Below the screen, above it, or not drawn at all: left to the observer as before.
    [ '화면 밖', '지나간 것', '그려지지 않는 것' ].forEach((text) => {
      const el = screen.getByText(text);
      expect(el).not.toHaveClass('is-in');
      expect(observed()).toContain(el);
    });
    // The observer's first report (nothing in its view: all of it is below the line or off screen), then a scroll.
    observers.forEach((o) => o.callback([], o));
    const below = screen.getByText('화면 밖');
    show([ below ]);
    expect(below).toHaveClass('is-in');
    expect(below.style.transitionDelay).toBe('');
  });

  test('a later re-scan (the face already in) brings them in at once, with no delay', () => {
    html.classList.add('js', 'fonts-ready');
    render(<PhonePage />);
    const peeking = screen.getByText('끝에 걸친 제목');
    expect(peeking).toHaveClass('is-in');
    expect(peeking.style.transitionDelay).toBe('');
    expect(screen.getByText('화면 밖')).not.toHaveClass('is-in');
  });

  test('without the option (tablets and desktops) nothing comes in before the observer says so', async () => {
    html.classList.add('js');
    render(<PhonePage peek={ false } />);
    await act(async () => {
      html.classList.add('fonts-ready');
    });
    [ '위', '끝에 걸친 제목', '내려앉은 제목', '줄 제목', '화면 밖' ].forEach((text) => {
      expect(screen.getByText(text)).not.toHaveClass('is-in');
      expect(observed()).toContain(screen.getByText(text));
    });
  });
});

test('reads the offset of an element\'s own transform, whatever form the browser gives it in', () => {
  expect(ownOffsetY('none')).toBe(0);
  expect(ownOffsetY('matrix(1, 0, 0, 1, 0, 12)')).toBe(12);
  expect(ownOffsetY('matrix(1, 0, 0, 1, 4, -30.5)')).toBe(-30.5);
  expect(ownOffsetY('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 40, 0, 1)')).toBe(40);
  expect(ownOffsetY('translateY(12px)')).toBe(0);
  expect(ownOffsetY('')).toBe(0);
});

test('counts a box as on screen while any part of it, at rest, is', () => {
  const box = (top: number, height = 20) => ({ top, bottom: top + height, width: 100, height });
  expect(onScreenAtRest(box(639), 0, 640)).toBe(true);
  expect(onScreenAtRest(box(640), 0, 640)).toBe(false);
  expect(onScreenAtRest(box(645), 12, 640)).toBe(true);
  expect(onScreenAtRest(box(-20), 0, 640)).toBe(false);
  expect(onScreenAtRest(box(-19), 0, 640)).toBe(true);
  expect(onScreenAtRest({ top: 0, bottom: 0, width: 0, height: 0 }, 0, 640)).toBe(false);
});
