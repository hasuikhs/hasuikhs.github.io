import React from 'react';
import { act, render, screen } from '@testing-library/react';

import useReveal, { FIRST_SCREEN_DELAY } from './useReveal';

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
