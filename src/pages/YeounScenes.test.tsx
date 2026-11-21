import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';

// The tablet page (stacked tear, act stubs shown): matchMedia answers false to everything except, when
// asked, the reduced-motion query.
const stubMedia = (reducedMotion: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }),
  });
};

// IntersectionObserver that the test drives by hand.
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

const intersect = (target: Element) => {
  const rect = target.getBoundingClientRect();
  const entry: IntersectionObserverEntry = {
    target,
    isIntersecting: true,
    intersectionRatio: 1,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
    time: 0,
  };
  observers.filter((o) => o.targets.includes(target)).forEach((o) => o.callback([ entry ], o));
};

const renderYeoun = () => render(
  <MemoryRouter initialEntries={ [ '/yeoun' ] }>
    <App />
  </MemoryRouter>,
);

beforeEach(() => {
  observers = [];
  Object.defineProperty(window, 'IntersectionObserver', { configurable: true, writable: true, value: FakeIntersectionObserver });
});

afterEach(() => {
  delete (window as Partial<Window>).matchMedia;
  Reflect.deleteProperty(window, 'IntersectionObserver');
  jest.useRealTimers();
});

describe('act stub scenes on the stacked page', () => {
  test('each stub waits at its start and plays once it is in view; act one counts down to tonight', () => {
    jest.useFakeTimers();
    stubMedia(false);
    renderYeoun();
    const booked = screen.getByTestId('act-stubs-booked');
    const curtain = screen.getByTestId('act-stubs-curtain');
    expect(screen.getByTestId('tear')).toHaveAttribute('data-mode', 'stacked');
    [ booked, curtain, screen.getByTestId('act-stubs-archive') ].forEach((el) => expect(el).toHaveAttribute('data-scene', 'armed'));

    intersect(booked);
    expect(booked).toHaveAttribute('data-scene', 'playing');
    expect(booked).toHaveAttribute('data-day', '3');
    jest.advanceTimersByTime(500);
    expect(booked).toHaveAttribute('data-day', '2');
    jest.advanceTimersByTime(1000);
    expect(booked).toHaveAttribute('data-day', '0');
    expect(curtain).toHaveAttribute('data-scene', 'armed');

    intersect(curtain);
    expect(curtain).toHaveAttribute('data-scene', 'playing');
    expect(curtain).not.toHaveAttribute('data-day');
  });

  test('with reduced motion the stubs hold their end state and nothing plays', () => {
    stubMedia(true);
    renderYeoun();
    [ 'booked', 'curtain', 'archive' ].forEach((id) => {
      expect(screen.getByTestId(`act-stubs-${id}`)).not.toHaveAttribute('data-scene');
    });
  });

  test('the stubs are decoration, and the scenes draw only the act stubs\' own lines', () => {
    stubMedia(false);
    renderYeoun();
    const booked = screen.getByTestId('act-stubs-booked');
    expect(booked).toHaveAttribute('aria-hidden', 'true');
    expect(booked).toHaveAttribute('data-from', '3');
    [ 'D-3', 'D-2', 'D-1', '오늘' ].forEach((label) => expect(within(booked).getByText(label)).toHaveClass('stub__badge'));
    const curtain = screen.getByTestId('act-stubs-curtain');
    expect(within(curtain).getByText('오늘')).toHaveClass('stub__flip-front');
    expect(within(curtain).getByText('5.0')).toBeInTheDocument();
    expect(within(curtain).getByText('0.5')).toBeInTheDocument();
  });
});
