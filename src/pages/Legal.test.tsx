import React from 'react';
import { readFileSync } from 'fs';
import path from 'path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import App from '../App';
import { YEOUN } from '../data/apps';
import PAGE_META from '../data/pageMeta.json';
import { LEGAL_DOC_KEYS, legalContent, legalDoc } from '../lib/legal';
import { legalRoutes, staticMarkup } from '../../scripts/legal-docs';

function LocationProbe() {
  const { pathname } = useLocation();
  return <output data-testid="location">{ pathname }</output>;
}

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={ [ path ] }>
    <App />
    <LocationProbe />
  </MemoryRouter>,
);

const locationNow = () => screen.getByTestId('location').textContent;
const metaTitle = (path: string) => Object.values(PAGE_META).find((page) => 'path' in page && page.path === path)?.title;

// The version links as [text, href, aria-current].
const versionLinks = () => within(screen.getByRole('group', { name: '시행일' })).getAllByRole('link')
  .map((link) => [ link.textContent, link.getAttribute('href'), link.getAttribute('aria-current') ]);

// A node as markup with its attributes sorted (React and the build script write them in different orders).
const canonical = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return JSON.stringify(node.textContent);
  }
  if (!(node instanceof Element)) {
    return '';
  }
  const attrs = Array.from(node.attributes).map((attr) => `${attr.name}=${JSON.stringify(attr.value)}`).sort();
  return `<${[ node.localName, ...attrs ].join(' ')}>${Array.from(node.childNodes).map(canonical).join('')}</${node.localName}>`;
};

// A link opens the next page at the top (App ScrollToTop); jsdom has no scrolling.
beforeEach(() => {
  jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const NAMES = { terms: '이용약관', privacy: '개인정보처리방침' } as const;

test('the version shown is drawn as the selected one, the others as links', () => {
  const css = readFileSync(path.join(__dirname, '..', 'styles', 'legal.css'), 'utf8');
  expect(css).toMatch(/\.legal-doc__versions a \{[^}]*border: 1px solid var\(--line\);[^}]*color: var\(--brand-text\);/);
  expect(css).toMatch(/\.legal-doc__versions a\[aria-current='page'\] \{[^}]*border-color: var\(--brand\);[^}]*background: var\(--paper-deep\);[^}]*color: var\(--fg\);/);
  expect(css).not.toMatch(/legal-doc__select/);
});

describe.each(LEGAL_DOC_KEYS)('%s', (key) => {
  const doc = legalDoc(key);
  const [ current, previous ] = doc.versions;
  const other = legalDoc(key === 'terms' ? 'privacy' : 'terms');
  const title = legalContent(key, current.date)?.title ?? '';

  test('the plain path shows the version in force, with or without the trailing slash', () => {
    [ doc.path, doc.path.replace(/\/$/, '') ].forEach((path) => {
      const { unmount } = renderAt(path);
      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
      expect(versionLinks()).toEqual([
        [ '2026년 11월 20일 시행 (현행)', current.path, 'page' ],
        [ '2026년 11월 10일 시행', previous.path, null ],
      ]);
      expect(screen.queryByText('이전 판입니다.')).not.toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveTextContent('시행일: 2026년 11월 20일 (공고일: 2026년 11월 13일)');
      expect(document.title).toBe(metaTitle(doc.path));
      expect(document.title).toBe(`여운 ${NAMES[key]}`);
      unmount();
    });
  });

  test('an earlier version says so at the top and links to the version in force', () => {
    renderAt(previous.path);
    const main = screen.getByRole('main');
    // A status region (read out when the selector switches to this version), first in the page.
    const notice = within(main).getByRole('status');
    expect(notice).toHaveTextContent(
      `이전 판입니다. 현행 ${NAMES[key]}은 2026년 11월 20일부터 시행하고 있어요. 현행 ${NAMES[key]} 보기`,
    );
    expect(within(notice).getByText('이전 판입니다.').tagName).toBe('STRONG');
    expect(within(notice).getByRole('link', { name: `현행 ${NAMES[key]} 보기` })).toHaveAttribute('href', current.path);
    const heading = within(main).getByRole('heading', { level: 1 });
    expect(notice.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(versionLinks()).toEqual([
      [ '2026년 11월 20일 시행 (현행)', current.path, null ],
      [ '2026년 11월 10일 시행', previous.path, 'page' ],
    ]);
    expect(main).toHaveTextContent('시행일: 2026년 11월 10일 (공고일: 2026년 11월 3일)');
    expect(document.title).toBe(metaTitle(previous.path));
    expect(document.title).toBe(`여운 ${NAMES[key]} (2026년 11월 10일 시행)`);
  });

  test('the versions are a labelled group of links that switch by route and keep focus; arrow keys do nothing', () => {
    renderAt(doc.path);
    // No select any more: arrowing through its options switched the version on every key.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    const group = screen.getByRole('group', { name: '시행일' });
    const [ toCurrent, toPrevious ] = within(group).getAllByRole('link');

    toCurrent.focus();
    fireEvent.keyDown(toCurrent, { key: 'ArrowDown' });
    fireEvent.keyDown(toCurrent, { key: 'ArrowRight' });
    expect(locationNow()).toBe(current.path);

    toPrevious.focus();
    fireEvent.click(toPrevious);
    expect(locationNow()).toBe(previous.path);
    expect(screen.getByText('이전 판입니다.')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('시행일: 2026년 11월 10일');
    // Same elements, the clicked one still focused and now the current page: the page stays mounted.
    expect(within(screen.getByRole('group', { name: '시행일' })).getAllByRole('link')).toEqual([ toCurrent, toPrevious ]);
    expect(toPrevious).toHaveFocus();
    expect(toPrevious).toHaveAttribute('aria-current', 'page');
    expect(toCurrent).not.toHaveAttribute('aria-current');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    toCurrent.focus();
    fireEvent.click(toCurrent);
    expect(locationNow()).toBe(current.path);
    expect(screen.queryByText('이전 판입니다.')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('시행일: 2026년 11월 20일');
    expect(toCurrent).toHaveFocus();
    expect(toCurrent).toHaveAttribute('aria-current', 'page');
  });

  test.each(doc.versions.map((version) => [ version.path ] as const))(
    'the page draws the same main as the served HTML, so nothing moves when the script starts: %s',
    (path) => {
      renderAt(path);
      // The served HTML, left out of the document (its ids would clash with the page's).
      const holder = document.createElement('div');
      holder.innerHTML = staticMarkup(path);
      const served = within(holder);
      const page = screen.getByRole('main');
      // The version links first (a readable diff when they drift), then everything under the header.
      expect(canonical(within(page).getByRole('group', { name: '시행일' }))).toBe(canonical(served.getByRole('group')));
      expect(canonical(page)).toBe(canonical(served.getByRole('main')));
    },
  );

  test('a date that is not a version, or a deeper path, is not found', () => {
    [ `${doc.path}2025-01-01`, `${doc.path}2026-11-11/`, `${doc.path}latest`, `${previous.path}extra` ].forEach((path) => {
      const { unmount } = renderAt(path);
      expect(screen.getByRole('heading', { level: 1, name: '페이지를 찾을 수 없어요' })).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: '시행일' })).not.toBeInTheDocument();
      expect(document.title).toBe(PAGE_META.notFound.title);
      unmount();
    });
  });

  test("the version in force under its own date goes to the plain path", () => {
    renderAt(`${doc.path}${current.date}/`);
    expect(locationNow()).toBe(current.path);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  test('links to the other document and back to the app page, under the site header and footer', () => {
    renderAt(doc.path);
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: '여운 소개' })).toHaveAttribute('href', '/yeoun/');
    expect(within(header).queryByRole('navigation')).not.toBeInTheDocument();
    expect(within(header).getByRole('button', { name: /모드로 보기/ })).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('link', { name: `${NAMES[key === 'terms' ? 'privacy' : 'terms']} 보기` }))
      .toHaveAttribute('href', other.path);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/yeoun/terms/');
    expect(within(footer).getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/yeoun/privacy/');
    expect(screen.getByRole('link', { name: '본문으로 건너뛰기' })).toHaveAttribute('href', '#main');
    expect(main).toHaveAttribute('id', 'main');

    fireEvent.click(within(main).getByRole('link', { name: `${NAMES[key === 'terms' ? 'privacy' : 'terms']} 보기` }));
    expect(locationNow()).toBe(other.path);
    expect(screen.getByRole('heading', { level: 1, name: legalContent(other.key, other.versions[0].date)?.title })).toBeInTheDocument();
  });

  test.each(doc.versions.map((version) => [ version.path, version ] as const))(
    'the document is semantic HTML, the same the served HTML holds: %s',
    (_path, version) => {
      renderAt(version.path);
      const main = screen.getByRole('main');
      const article = within(main).getByRole('article');
      expect(within(article).getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(within(article).getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(10);
      const lists = within(article).getAllByRole('list');
      // The terms number their clauses (제4조 제1항); the privacy policy uses bullets only.
      expect(lists.some((list) => list.tagName === 'OL')).toBe(key === 'terms');
      expect(lists.some((list) => list.tagName === 'UL')).toBe(true);
      expect(within(article).getAllByRole('listitem').length).toBeGreaterThan(5);
      expect(within(article).getAllByRole('link', { name: 'hasuidev@gmail.com' })[0]).toHaveAttribute('href', 'mailto:hasuidev@gmail.com');
      expect(article.textContent).not.toMatch(/\*\*|(^|\n)#/);
      // Exactly the blocks rendered at build time, which copy-routes also writes into the served HTML.
      expect(article.innerHTML).toContain(legalContent(key, version.date)?.blocks.join(''));
    },
  );
});

test("the privacy policy's processor table keeps its headers", () => {
  renderAt('/yeoun/privacy/');
  const table = screen.getByRole('table');
  [ '국가', '항목', '목적', '보유 기간' ].forEach((name) => expect(within(table).getByRole('columnheader', { name })).toBeInTheDocument());
  expect(within(table).getByRole('rowheader', { name: 'Railway Corp. (서버 호스팅)' })).toBeInTheDocument();
  expect(within(table).getAllByRole('row')).toHaveLength(5);
  // On phones the header row is hidden and each cell shows its column's name: the first column too.
  within(table).getAllByRole('rowheader').forEach((th) => expect(th).toHaveAttribute('data-label', '수탁·이전받는 자'));
});

test('the footer opens the documents in place, on every page, and nothing links to Notion any more', () => {
  expect(JSON.stringify(YEOUN)).not.toMatch(/notion/i);
  [ '/', '/yeoun', '/nope' ].forEach((path) => {
    const { unmount } = renderAt(path);
    const footer = screen.getByRole('contentinfo');
    const terms = within(footer).getByRole('link', { name: '이용약관' });
    expect(terms).toHaveAttribute('href', '/yeoun/terms/');
    expect(terms).not.toHaveAttribute('target');
    expect(within(footer).getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/yeoun/privacy/');
    expect(within(footer).getByRole('link', { name: /문의하기/ })).toHaveAttribute('href', 'mailto:hasuidev@gmail.com');
    expect(document.body.innerHTML).not.toMatch(/notion/i);
    unmount();
  });
  renderAt('/yeoun');
  fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: '개인정보처리방침' }));
  expect(locationNow()).toBe('/yeoun/privacy/');
  expect(screen.getByRole('heading', { level: 1, name: '여운(Yeoun) 개인정보처리방침' })).toBeInTheDocument();
});

test('the legal pages draw no app version number and no developer handle', () => {
  const version = /(^|[^\d.])\d{1,2}\.\d{1,2}\.\d{1,3}(?![\d.])|버전 ?\d|새 버전/;
  LEGAL_DOC_KEYS.flatMap((key) => legalDoc(key).versions).forEach(({ path }) => {
    const { unmount } = renderAt(path);
    expect(document.body.textContent).not.toMatch(version);
    expect(document.body.textContent).not.toMatch(/khasui|1인 개발자/);
    expect(document.title).not.toMatch(version);
    unmount();
  });
});

// The site shows no developer name, with one exception the privacy policy has to carry: the name of its
// officer (개인정보 보호책임자), kept as the app's text has it (content/legal/README.md).
const OFFICER_NAME = '김한석';
const countIn = (text: string | null) => (text ?? '').split(OFFICER_NAME).length - 1;

test.each(legalRoutes().map((route) => [ route.path, route ] as const))(
  "the developer's name shows once on the privacy policy and never on the terms, page and served HTML alike: %s",
  (_path, { key, path }) => {
    const expected = key === 'privacy' ? 1 : 0;
    renderAt(path);
    expect({ page: countIn(document.body.textContent), served: countIn(staticMarkup(path)) })
      .toEqual({ page: expected, served: expected });
    expect(document.title).not.toContain(OFFICER_NAME);
  },
);

test.each(legalDoc('privacy').versions.map((version) => version.date))(
  'in the privacy policy of %s the name is the officer, the list right under its heading',
  (date) => {
    const blocks = legalContent('privacy', date)?.blocks ?? [];
    const named = blocks.flatMap((block, i) => (block.includes(OFFICER_NAME) ? [ [ blocks[i - 1], block ] ] : []));
    expect(named).toEqual([
      [ '<h2>11. 개인정보 보호책임자</h2>', expect.stringMatching(new RegExp(`^<ul><li>성명: ${OFFICER_NAME}</li>`)) ],
    ]);
  },
);

test("the developer's name is on no other page, title or description", () => {
  [ '/', '/yeoun', '/nope' ].forEach((path) => {
    const { unmount } = renderAt(path);
    expect({ path, page: countIn(document.body.textContent) }).toEqual({ path, page: 0 });
    unmount();
  });
  expect(countIn(JSON.stringify(PAGE_META))).toBe(0);
});
