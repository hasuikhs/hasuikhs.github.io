import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { DISPLAY_STRINGS, YEOUN } from './data/apps';
import { displayFontHref } from './lib/displayFont';
import { joinDots } from './lib/text';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.hskim.yeoun';

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={ [ path ] }>
    <App />
  </MemoryRouter>
);

test('hub lists the Yeoun app with a link to its page', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { level: 1, name: '앱 소개' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '여운' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '자세히 보기' })).toHaveAttribute('href', '/yeoun');
  expect(screen.queryByText(/khasui|1인 개발자/)).not.toBeInTheDocument();
});

// React Router keeps the scroll position across pages: the hub's '자세히 보기' opened the app page part way
// down. A link now opens the page at the top.
test('following a link to another page opens it at the top', () => {
  const original = window.scrollTo;
  const scrollTo = jest.fn();
  Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: scrollTo });
  try {
    renderAt('/');
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('link', { name: '자세히 보기' }));
    expect(screen.getByRole('heading', { level: 1, name: /막이 내린 뒤에도/ })).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  } finally {
    Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: original });
  }
});

test('Yeoun page links to the Play Store listing and policies', () => {
  renderAt('/yeoun');
  const badges = screen.getAllByRole('link', { name: /Google Play/ });
  expect(badges).toHaveLength(2);
  badges.forEach((link) => expect(link).toHaveAttribute('href', PLAY_URL));
  const images = screen.getAllByRole('img', { name: 'Google Play에서 다운로드' });
  expect(images).toHaveLength(2);
  // The official artwork: a copy scaled to the drawn height, with the original kept in srcset.
  images.forEach((img) => {
    expect(img.getAttribute('src')).toMatch(/^\/badges\/google-play-ko-h(40|44|48)\.png$/);
    expect(img.getAttribute('srcset')).toContain('/badges/google-play-ko.png 3x');
  });
  // Terms and contact live once, in the footer; the menu's '문의' scrolls there (2026-11-21: no second copy in the page).
  const main = screen.getByRole('main');
  expect(within(main).queryByRole('link', { name: '개인정보처리방침' })).not.toBeInTheDocument();
  expect(screen.queryByText('약관 및 문의')).not.toBeInTheDocument();
  const footer = screen.getByRole('contentinfo');
  expect(footer).toHaveAttribute('id', 'support');
  [ '개인정보처리방침', '이용약관', /문의하기/ ].forEach((name) =>
    expect(within(footer).getByRole('link', { name })).toBeInTheDocument());
});

test('Yeoun page introduces ticket scanning', () => {
  renderAt('/yeoun');
  expect(screen.getByRole('heading', { name: '티켓 사진으로 빠르게 기록' })).toBeInTheDocument();
});

test('Yeoun page tells the three scenes and closes with the curtain call', () => {
  renderAt('/yeoun');
  expect(screen.getByText('주요 기능', { selector: '.acts__eyebrow' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '공연 하나, 세 장면' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /객석의 불이 켜져도\s*끝나지 않는 이야기/ })).toBeInTheDocument();
  expect(screen.getByText('오늘의 감동이 아직 마음에 선명할 때, 여운에 담아 두세요.')).toBeInTheDocument();
});

test('Yeoun page menu and hero button say plainly where they go', () => {
  renderAt('/yeoun');
  const nav = screen.getByRole('navigation', { name: '페이지 안 이동' });
  const entries = within(nav).getAllByRole('link').map((link) => [ link.textContent, link.getAttribute('href') ]);
  expect(entries).toEqual([
    [ '주요 기능', '#acts' ],
    [ '더 많은 기능', '#archive' ],
    [ '문의', '#support' ],
  ]);
  expect(screen.getByRole('link', { name: '주요 기능 보기' })).toHaveAttribute('href', '#acts');
});

test('the scroll hint under the hero ticket is a decorative icon with no words', () => {
  renderAt('/yeoun');
  const hint = screen.getByTestId('tear-hint');
  expect(hint).toHaveAttribute('aria-hidden', 'true');
  expect(hint.textContent).toBe('');
  expect(hint.innerHTML).toMatch(/<svg[^>]*aria-hidden="true"/);
  expect(screen.queryByText(/스크롤/)).not.toBeInTheDocument();
});

test('Yeoun feature archive has its new heading and a line under it', () => {
  renderAt('/yeoun');
  expect(screen.getByText('더 많은 기능', { selector: '.eyebrow' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: /공연을 오래 기억하는\s*여섯 가지 방법/ })).toBeInTheDocument();
  expect(screen.getByText('티켓 스캔부터 관람 통계까지, 기록을 돕는 기능 여섯 가지예요.')).toHaveClass('lede');
});

test('act stubs are dated from today in Korea when the page renders', () => {
  jest.useFakeTimers();
  try {
    // 2026-12-30 23:30 in Korea (still 12-30 14:30 UTC). Acts one and two hold the hero's show (tonight):
    // act one is that ticket on the day it was booked, so its date stays and only its badge counts down.
    jest.setSystemTime(new Date('2026-12-30T14:30:00Z'));
    renderAt('/yeoun');
    const booked = within(screen.getByRole('article', { name: /보러 갈 공연은/ }));
    expect(booked.getByText('D-3')).toBeInTheDocument();
    expect(booked.getByText('12.30')).toBeInTheDocument();
    expect(booked.getByText('19:30')).toBeInTheDocument();
    const curtain = within(screen.getByRole('article', { name: /막이 내린 밤엔/ }));
    expect(curtain.getByText('5.0')).toBeInTheDocument();
    expect(curtain.getByText('12.30')).toBeInTheDocument();
    expect(curtain.getByText('19:30')).toBeInTheDocument();
    // Act three is the same ticket filed under 관람 완료, the tab its poster screenshot shows.
    const archive = within(screen.getByRole('article', { name: /지난 기록은/ }));
    expect(archive.getByText('5.0')).toBeInTheDocument();
    expect(archive.getByText('12.30')).toBeInTheDocument();
    expect(archive.getByText('관람 완료')).toHaveClass('stub__sub');
    // The app's date format example in act two's points stays as written.
    expect(curtain.getByText('티켓 상세 날짜에는 요일까지: 2026.11.07 (토) 19:30')).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

test('the hero stub is a decorative ticket for tonight, dated today in Korea', () => {
  jest.useFakeTimers();
  try {
    // 2027-01-01 00:30 in Korea while it is still 12-31 in UTC.
    jest.setSystemTime(new Date('2026-12-31T15:30:00Z'));
    renderAt('/yeoun');
    const hero = screen.getByTestId('hero-stub');
    expect(hero).toHaveAttribute('aria-hidden', 'true');
    expect(within(hero).getByText('오늘')).toHaveClass('stub__badge');
    expect(within(hero).getByText('01.01')).toHaveClass('stub__num');
    expect(within(hero).getByText('19:30')).toHaveClass('stub__sub');
    // Badge, date and time only: no screen-reader separators and no version or platform line.
    expect(hero.textContent).toBe('오늘01.0119:30');
  } finally {
    jest.useRealTimers();
  }
});

// The notice card is about the app (who it suits, how to use it), so its heading must not read like a venue's
// entry notice beside all the ticket imagery (2026-11-21 owner: '입장 전 안내' could be misread).
test('the notice card is headed as guidance before installing, not as a theatre entry notice', () => {
  renderAt('/yeoun');
  expect(screen.getByRole('heading', { level: 2, name: '설치하기 전에' })).toBeInTheDocument();
  expect(JSON.stringify(YEOUN)).not.toMatch(/입장 전/);
});

// Section labels say plainly what the section is for; only the big headings stay literary (2026-11-21 owner: '커튼콜' too).
test('the closing section is labelled as starting the app, not with a theatre term', () => {
  renderAt('/yeoun');
  const closing = screen.getByRole('region', { name: /객석의 불이 켜져도/ });
  expect(within(closing).getByText('여운 시작하기', { selector: '.eyebrow' })).toBeInTheDocument();
  expect(JSON.stringify(YEOUN)).not.toMatch(/커튼콜/);
});

// The page describes the app as it is now: no update section, and the feature section ends with a plain list
// of the features the tiles do not show (2026-11-21 owner decision).
test('there is no update section, and the feature section ends with a list of the other features', () => {
  renderAt('/yeoun');
  expect(screen.queryByText('최근 업데이트')).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: /새로 끊었어요/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: '업데이트' })).not.toBeInTheDocument();
  const section = screen.getByRole('region', { name: /여섯 가지 방법/ });
  const { more } = YEOUN.archive;
  expect(within(section).getByRole('heading', { level: 3, name: more.label })).toBeInTheDocument();
  const list = within(section).getByRole('list', { name: more.label });
  const items = within(list).getAllByRole('listitem');
  expect(items).toHaveLength(more.items.length);
  expect(more.items.length).toBeGreaterThanOrEqual(6);
  more.items.forEach((item, i) => {
    expect(within(items[i]).getByRole('heading', { level: 4, name: item.title })).toBeInTheDocument();
    expect(items[i]).toHaveTextContent(joinDots(item.detail));
  });
  expect(JSON.stringify(YEOUN)).not.toMatch(/tablet-home/);
});

test('no app version number is drawn or read out anywhere', () => {
  // A version like 1.9.0 (dates such as 2026.11.07 do not count), '버전 1…', or the old '새 버전' label.
  const version = /(^|[^\d.])\d{1,2}\.\d{1,2}\.\d{1,3}(?![\d.])|버전 ?\d|새 버전/;
  expect(JSON.stringify(YEOUN)).not.toMatch(version);
  [ '/', '/yeoun' ].forEach((path) => {
    const { unmount } = renderAt(path);
    expect(document.body.textContent).not.toMatch(version);
    expect(screen.queryAllByAltText(version)).toHaveLength(0);
    expect(screen.queryAllByLabelText(version)).toHaveLength(0);
    expect(screen.queryAllByTitle(version)).toHaveLength(0);
    expect(document.title).not.toMatch(version);
    unmount();
  });
});

test('Yeoun page renders the stacked layout without matchMedia', () => {
  renderAt('/yeoun');
  expect(screen.getByTestId('tear')).toHaveAttribute('data-mode', 'stacked');
});

test('Yeoun page carries no developer handle', () => {
  renderAt('/yeoun');
  expect(document.body.textContent).not.toMatch(/khasui|1인 개발자/);
});

test('the display-font subset follows the display fields of apps.ts', () => {
  const displayLines = [ ...YEOUN.archive.titleLines, ...YEOUN.closing.titleLines ];
  expect(displayLines).toEqual([ '공연을 오래 기억하는', '여섯 가지 방법', '객석의 불이 켜져도', '끝나지 않는 이야기' ]);
  expect(DISPLAY_STRINGS).toEqual(expect.arrayContaining(displayLines));
  const text = new URL(displayFontHref(DISPLAY_STRINGS)).searchParams.get('text') ?? '';
  Array.from(displayLines.join('').replace(/\s/g, '')).forEach((ch) => expect(text).toContain(ch));
});

test('every display-face glyph on every page is in the display-font subset', () => {
  const subset = new Set(DISPLAY_STRINGS.join('').replace(/\s/g, ''));
  const isDisplay = (_content: string, el: Element | null) => el?.classList.contains('display') ?? false;
  [ '/', '/yeoun', '/nope' ].forEach((path) => {
    const { unmount } = renderAt(path);
    const displayEls = screen.getAllByText(isDisplay);
    expect(displayEls.length).toBeGreaterThan(0);
    displayEls.forEach((el) => {
      const missing = Array.from((el.textContent ?? '').replace(/\s/g, '')).filter((ch) => !subset.has(ch));
      expect({ path, text: el.textContent, missing }).toEqual({ path, text: el.textContent, missing: [] });
    });
    unmount();
  });
});

test('unknown paths render the not-found page', () => {
  renderAt('/nope');
  expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeInTheDocument();
});
