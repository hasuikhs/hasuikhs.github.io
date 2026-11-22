import React from 'react';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
import { HUB, HUB_STUB_LABEL, NOT_FOUND, SITE, YEOUN } from '../data/apps';
import PAGE_META from '../data/pageMeta.json';
// Aliased: the testing-library lint rules take any `render*` call for a component render.
import { metaTags, renderPage as pageHtml } from '../../scripts/page-meta';
import { writeRoutes } from '../../scripts/copy-routes';
import { legalRoutes, staticMarkup } from '../../scripts/legal-docs';
import { accountDeletionContent, formatDate, legalContent, legalDoc } from './legal';
import type { LegalDocKey } from './legal';

const ROOT = path.join(__dirname, '..', '..');
const read = (...parts: string[]) => readFileSync(path.join(ROOT, ...parts), 'utf8');
const SHELL = read('public', 'index.html');
const ORIGIN = 'https://hasuikhs.github.io';

type Page = {
  path?: string;
  file: string;
  title: string;
  description: string;
  image?: { path: string; width: number; height: number; alt: string };
  twitterCard?: string;
  noindex?: boolean;
};
const PAGES: Record<keyof typeof PAGE_META, Page> = PAGE_META;

const unescape = (value: string) =>
  value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Every <meta>/<link> in an HTML string as its attributes (no DOM traversal: the tags are flat in <head>).
const tagsOf = (html: string, name: 'meta' | 'link') =>
  Array.from(html.matchAll(new RegExp(`<${name}\\s([^>]*?)\\/?>`, 'g')), (match) =>
    Object.fromEntries(Array.from(match[1].matchAll(/([\w:-]+)="([^"]*)"/g), (attr) => [ attr[1], unescape(attr[2]) ])));

// The contents of every <meta name|property="key">.
const metaValues = (html: string, key: string) =>
  tagsOf(html, 'meta').filter((attrs) => attrs.name === key || attrs.property === key).map((attrs) => attrs.content);

const titlesOf = (html: string) => Array.from(html.matchAll(/<title>([^<]*)<\/title>/g), (match) => unescape(match[1]));

// The hash a preview image URL carries: a re-rendered card gets a new URL, so caches fetch it again.
const versionOf = (publicPath: string) =>
  createHash('sha1').update(readFileSync(path.join(ROOT, 'public', publicPath))).digest('hex').slice(0, 8);

const pngSize = (file: string) => {
  const bytes = readFileSync(file);
  expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

// A version like 1.9.0, '버전 1…', or a stub date or countdown (MM.DD, D-3, 오늘) that would go stale in a cached preview.
const STALE = /(^|[^\d.])\d{1,2}\.\d{1,2}\.\d{1,3}(?![\d.])|버전 ?\d|\b\d{2}\.\d{2}\b|D-\d|오늘/;

describe('page meta', () => {
  test('titles and descriptions are the ones the pages show', () => {
    expect(PAGES.hub.title).toBe(HUB.title);
    expect(PAGES.yeoun.title).toBe(`${YEOUN.name} — ${YEOUN.tagline}`);
    expect(PAGES.yeoun.description).toBe(YEOUN.summary);
    expect(PAGES.notFound.title).toBe(NOT_FOUND.title);
    expect(PAGES.notFound.description).toBe(NOT_FOUND.body);
    expect(JSON.stringify(PAGE_META)).not.toMatch(STALE);
  });

  test('each route is written where GitHub Pages serves it', () => {
    expect(PAGES.hub).toMatchObject({ path: '/', file: 'index.html' });
    expect(PAGES.yeoun).toMatchObject({ path: `/${YEOUN.slug}/`, file: `${YEOUN.slug}/index.html` });
    expect(PAGES.notFound).toMatchObject({ file: '404.html', noindex: true });
    expect(PAGES.notFound.path).toBeUndefined();
    expect(JSON.parse(read('package.json')).homepage).toBe(ORIGIN);
  });

  test.each([
    [ '/', PAGES.hub.title ],
    [ '/yeoun', PAGES.yeoun.title ],
    [ '/nope', PAGES.notFound.title ],
    [ '/yeoun/terms/', PAGES.yeounTerms.title ],
    [ '/yeoun/terms/2026-11-10/', PAGES['yeounTerms-2026-11-10'].title ],
    [ '/yeoun/privacy/', PAGES.yeounPrivacy.title ],
    [ '/yeoun/privacy/2026-11-10/', PAGES['yeounPrivacy-2026-11-10'].title ],
    [ '/yeoun/account-deletion/', PAGES.yeounAccountDeletion.title ],
  ])('%s sets the same document title as its served HTML', (route, title) => {
    render(
      <MemoryRouter initialEntries={ [ route ] }>
        <App />
      </MemoryRouter>,
    );
    expect(document.title).toBe(title);
  });

  test('the dev shell already holds the hub title and description', () => {
    expect(titlesOf(SHELL)).toEqual([ PAGES.hub.title ]);
    expect(metaValues(SHELL, 'description')).toEqual([ PAGES.hub.description ]);
  });
});

describe('served HTML', () => {
  test('the app page carries a large preview card with absolute https URLs', () => {
    const html = pageHtml(SHELL, PAGES.yeoun);
    const url = `${ORIGIN}/yeoun/`;
    expect(titlesOf(html)).toEqual([ PAGES.yeoun.title ]);
    expect(metaValues(html, 'description')).toEqual([ PAGES.yeoun.description ]);
    expect(tagsOf(html, 'link').filter((attrs) => attrs.rel === 'canonical').map((attrs) => attrs.href)).toEqual([ url ]);
    expect(metaValues(html, 'og:type')).toEqual([ 'website' ]);
    expect(metaValues(html, 'og:locale')).toEqual([ 'ko_KR' ]);
    expect(metaValues(html, 'og:url')).toEqual([ url ]);
    expect(metaValues(html, 'og:title')).toEqual([ PAGES.yeoun.title ]);
    expect(metaValues(html, 'og:description')).toEqual([ PAGES.yeoun.description ]);
    expect(metaValues(html, 'og:image')).toEqual([ `${ORIGIN}/og/yeoun.png?v=${versionOf('/og/yeoun.png')}` ]);
    expect(versionOf('/og/yeoun.png')).toMatch(/^[0-9a-f]{8}$/);
    expect(metaValues(html, 'og:image:type')).toEqual([ 'image/png' ]);
    expect(metaValues(html, 'og:image:width')).toEqual([ '1200' ]);
    expect(metaValues(html, 'og:image:height')).toEqual([ '630' ]);
    expect(metaValues(html, 'og:image:alt')).toEqual([ PAGES.yeoun.image?.alt ]);
    expect(metaValues(html, 'twitter:card')).toEqual([ 'summary_large_image' ]);
    expect(metaValues(html, 'twitter:image:alt')).toEqual([ PAGES.yeoun.image?.alt ]);
    expect(metaValues(html, 'robots')).toEqual([]);
  });

  test('the hub has its own URL and a small icon card', () => {
    const html = pageHtml(SHELL, PAGES.hub);
    expect(titlesOf(html)).toEqual([ PAGES.hub.title ]);
    expect(metaValues(html, 'og:url')).toEqual([ `${ORIGIN}/` ]);
    expect(metaValues(html, 'og:image')).toEqual([ `${ORIGIN}/logo512.png?v=${versionOf('/logo512.png')}` ]);
    expect(metaValues(html, 'twitter:card')).toEqual([ 'summary' ]);
  });

  test('the not-found page is kept out of search and claims no URL or preview', () => {
    const html = pageHtml(SHELL, PAGES.notFound);
    expect(titlesOf(html)).toEqual([ PAGES.notFound.title ]);
    expect(metaValues(html, 'robots')).toEqual([ 'noindex' ]);
    expect(metaValues(html, 'og:url')).toEqual([]);
    expect(metaValues(html, 'og:image')).toEqual([]);
    expect(tagsOf(html, 'link').filter((attrs) => attrs.rel === 'canonical')).toEqual([]);
  });

  test('every preview URL is absolute https, never a %PUBLIC_URL% placeholder', () => {
    Object.values(PAGES).forEach((page) => {
      metaTags(page).join('').match(/(?:content|href)="[^"]*"/g)?.forEach((attr) => {
        expect(attr).not.toMatch(/%PUBLIC_URL%/);
      });
      [ 'og:url', 'og:image' ].forEach((key) => {
        metaValues(pageHtml(SHELL, page), key).forEach((value) => expect(value).toMatch(/^https:\/\/[^/]+\//));
      });
    });
  });

  test('rendering again replaces the block instead of adding a second one', () => {
    const twice = pageHtml(pageHtml(SHELL, PAGES.hub), PAGES.yeoun);
    expect(twice).toBe(pageHtml(SHELL, PAGES.yeoun));
    expect(twice.match(/<!--page-meta-->/g)).toHaveLength(1);
  });

  test('text is escaped into attributes and the title', () => {
    const page = { ...PAGES.yeoun, title: '"따옴표" & <꺾쇠>', description: 'a "b" <c>' };
    const html = pageHtml(SHELL, page);
    expect(titlesOf(html)).toEqual([ page.title ]);
    expect(metaValues(html, 'og:title')).toEqual([ page.title ]);
    expect(metaValues(html, 'description')).toEqual([ page.description ]);
    expect(html).not.toContain('<꺾쇠>');
  });

  test('a shell without exactly one title and description fails the build', () => {
    expect(() => pageHtml(SHELL.replace(/<title>[^<]*<\/title>/, ''), PAGES.hub)).toThrow(/exactly one/);
    expect(() => pageHtml(SHELL.replace('</head>', '<title>x</title></head>'), PAGES.hub)).toThrow(/exactly one/);
  });

  test('postbuild writes every route from the shell, and running it again changes nothing', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'page-meta-'));
    try {
      writeFileSync(path.join(dir, 'index.html'), SHELL);
      writeRoutes(dir);
      const first = Object.values(PAGES).map((page) => readFileSync(path.join(dir, page.file), 'utf8'));
      Object.values(PAGES).forEach((page, i) => expect(titlesOf(first[i])).toEqual([ page.title ]));
      writeRoutes(dir);
      expect(Object.values(PAGES).map((page) => readFileSync(path.join(dir, page.file), 'utf8'))).toEqual(first);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('preview images', () => {
  test.each(Object.entries(PAGES).filter(([ , page ]) => page.image))('%s: the image is a PNG of the declared size', (_id, page) => {
    const image = page.image as NonNullable<Page['image']>;
    const file = path.join(ROOT, 'public', image.path);
    expect(existsSync(file)).toBe(true);
    expect(pngSize(file)).toEqual({ width: image.width, height: image.height });
    // WhatsApp drops preview images much over 300KB.
    expect(statSync(file).size).toBeLessThan(300 * 1024);
  });

  // 1.91:1 is what Facebook, LinkedIn and Slack show whole; X and KakaoTalk crop it to 2:1, about 15px off
  // the top and bottom, which the card keeps clear (scripts/og/yeoun.html).
  test('a large card is 1200x630', () => {
    const large = Object.values(PAGES).filter((page) => page.twitterCard === 'summary_large_image');
    expect(large.length).toBeGreaterThan(0);
    large.forEach((page) => expect(page.image).toMatchObject({ width: 1200, height: 630 }));
  });

  // The card is a page of the site's own stylesheets (scripts/og), rendered to the PNG by `yarn og:card`.
  test('the app card draws only strings from apps.ts, with no date, badge or version', () => {
    const card = read('scripts', 'og', 'yeoun.html');
    const body = card.slice(card.indexOf('<body>'));
    const texts = body
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const allowed = new Set([
      YEOUN.name,
      YEOUN.eyebrow,
      ...YEOUN.catchphrase.replace(/,\s+/, ',\n').split('\n'),
      HUB_STUB_LABEL,
      SITE.platform,
    ]);
    expect(texts.length).toBeGreaterThanOrEqual(5);
    texts.forEach((text) => expect({ text, allowed: allowed.has(text) }).toEqual({ text, allowed: true }));
    expect(body).not.toMatch(STALE);
  });

  test('every local file the card loads exists', () => {
    const card = read('scripts', 'og', 'yeoun.html');
    const local = Array.from(card.matchAll(/(?:href|src)="(\.\.\/[^"]+)"/g), (match) => match[1]);
    expect(local.length).toBeGreaterThanOrEqual(5);
    local.forEach((ref) => expect({ ref, exists: existsSync(path.join(ROOT, 'scripts', 'og', ref)) }).toEqual({ ref, exists: true }));
  });

  test('postbuild also works when a route directory is already there', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'page-meta-'));
    try {
      writeFileSync(path.join(dir, 'index.html'), SHELL);
      mkdirSync(path.join(dir, 'yeoun'));
      expect(() => writeRoutes(dir)).not.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('legal documents', () => {
  type Route = { key: LegalDocKey; date: string; current: boolean; path: string };
  const ROUTES = legalRoutes() as Route[];
  const pageAt = (sitePath: string) => Object.values(PAGES).find((page) => page.path === sitePath);
  const NAMES: Record<LegalDocKey, string> = { terms: '이용약관', privacy: '개인정보처리방침' };

  test('the routes: each document in force at its plain path, the earlier version under its date', () => {
    expect(ROUTES.map((route) => route.path)).toEqual([
      '/yeoun/terms/',
      '/yeoun/terms/2026-11-10/',
      '/yeoun/privacy/',
      '/yeoun/privacy/2026-11-10/',
    ]);
  });

  test('every version has a served page; the one in force is indexed, an earlier one is noindex', () => {
    ROUTES.forEach((route) => {
      const page = pageAt(route.path);
      expect({ path: route.path, found: Boolean(page) }).toEqual({ path: route.path, found: true });
      expect(page?.file).toBe(`${route.path.slice(1)}index.html`);
      expect(Boolean(page?.noindex)).toBe(!route.current);
    });
    // No page claims a document path that is not a version (one left behind after a version was removed).
    Object.values(PAGES)
      .filter((page) => page.path && /^\/yeoun\/(terms|privacy)\//.test(page.path))
      .forEach((page) => expect(ROUTES.map((route) => route.path)).toContain(page.path));
  });

  test('titles name the document, an earlier version with its date; the one in force gives its date in the description', () => {
    ROUTES.forEach((route) => {
      const page = pageAt(route.path) as Page;
      const date = formatDate(route.date);
      const expected = route.current
        ? { title: `여운 ${NAMES[route.key]}`, description: new RegExp(`^${date}부터 시행하는 여운 ${NAMES[route.key]}이에요`) }
        : { title: `여운 ${NAMES[route.key]} (${date} 시행)`, description: new RegExp(`^${date}부터 시행한 여운 ${NAMES[route.key]}의 이전 판이에요`) };
      expect(page.title).toBe(expected.title);
      expect(page.description).toMatch(expected.description);
      expect(page.description).not.toMatch(/khasui|김한석/);
    });
  });

  test.each(ROUTES.map((route) => [ route.path, route ] as const))('%s is served with its title, canonical, robots and the document', (_path, route) => {
    const page = pageAt(route.path) as Page;
    const html = pageHtml(SHELL, page, undefined, staticMarkup(route.path));
    const url = `${ORIGIN}${route.path}`;
    expect(titlesOf(html)).toEqual([ page.title ]);
    expect(metaValues(html, 'description')).toEqual([ page.description ]);
    expect(tagsOf(html, 'link').filter((attrs) => attrs.rel === 'canonical').map((attrs) => attrs.href)).toEqual([ url ]);
    expect(metaValues(html, 'og:url')).toEqual([ url ]);
    expect(metaValues(html, 'robots')).toEqual(route.current ? [] : [ 'noindex' ]);
    // The document itself, readable without the script; no line saying it needs JavaScript.
    const content = legalContent(route.key, route.date);
    expect(html).toContain(`<div id="root"><!--prerendered--><div class="app">`);
    expect(html).toContain(`<h1 class="legal-doc__title">${content?.title}</h1>`);
    expect(html).toContain(content?.blocks.join(''));
    expect(html).not.toContain('<noscript>');
    expect(html.includes('이전 판입니다.')).toBe(!route.current);
  });

  test('rendering a document page again replaces the document instead of adding a second one', () => {
    const [ route ] = ROUTES;
    const page = pageAt(route.path) as Page;
    const once = pageHtml(SHELL, page, undefined, staticMarkup(route.path));
    expect(pageHtml(once, page, undefined, staticMarkup(route.path))).toBe(once);
    expect(once.match(/<!--prerendered-->/g)).toHaveLength(1);
  });

  test('postbuild writes each document into its route, and the other pages keep an empty root', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'page-meta-'));
    try {
      writeFileSync(path.join(dir, 'index.html'), SHELL);
      writeRoutes(dir);
      ROUTES.forEach((route) => {
        const html = readFileSync(path.join(dir, route.path.slice(1), 'index.html'), 'utf8');
        expect(html).toContain(legalContent(route.key, route.date)?.blocks.join(''));
        expect(titlesOf(html)).toEqual([ pageAt(route.path)?.title ]);
      });
      [ 'index.html', 'yeoun/index.html', '404.html' ].forEach((file) => {
        const html = readFileSync(path.join(dir, file), 'utf8');
        expect(html).toContain('<div id="root"></div>');
        expect(html).toContain('<noscript>');
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a page for every version keeps legalDoc and pageMeta.json in step', () => {
    ([ 'terms', 'privacy' ] as LegalDocKey[]).forEach((key) => {
      legalDoc(key).versions.forEach((version) => expect(pageAt(version.path)).toBeDefined());
    });
  });
});

// The page Google Play's account deletion policy links to: found by search and readable without JavaScript.
describe('account deletion page', () => {
  const PATH = '/yeoun/account-deletion/';
  const page = PAGES.yeounAccountDeletion;

  test('is written where GitHub Pages serves it, indexed, with a plain title and description', () => {
    expect(page).toMatchObject({ path: PATH, file: 'yeoun/account-deletion/index.html', title: '여운 계정 삭제' });
    expect(page.noindex).toBeUndefined();
    expect(page.description).toBe('여운 계정과 서버에 저장된 기록을 지우는 방법이에요. 앱에서 탈퇴하거나, 앱 없이 메일로 삭제를 요청할 수 있어요.');
    expect(page.image).toEqual(PAGES.yeounPrivacy.image);
    expect(page.twitterCard).toBe('summary');
  });

  test('is served with its title, canonical URL and the whole guide, and no line saying it needs JavaScript', () => {
    const html = pageHtml(SHELL, page, undefined, staticMarkup(PATH));
    const url = `${ORIGIN}${PATH}`;
    expect(titlesOf(html)).toEqual([ page.title ]);
    expect(metaValues(html, 'description')).toEqual([ page.description ]);
    expect(tagsOf(html, 'link').filter((attrs) => attrs.rel === 'canonical').map((attrs) => attrs.href)).toEqual([ url ]);
    expect(metaValues(html, 'og:url')).toEqual([ url ]);
    expect(metaValues(html, 'og:title')).toEqual([ page.title ]);
    expect(metaValues(html, 'robots')).toEqual([]);
    expect(html).toContain('<div id="root"><!--prerendered--><div class="app">');
    expect(html).toContain(`<h1 class="legal-doc__title">${accountDeletionContent.title}</h1>`);
    expect(html).toContain(accountDeletionContent.blocks.join(''));
    expect(html).not.toContain('<noscript>');
  });

  test('postbuild writes the guide into its route', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'page-meta-'));
    try {
      writeFileSync(path.join(dir, 'index.html'), SHELL);
      writeRoutes(dir);
      const html = readFileSync(path.join(dir, 'yeoun', 'account-deletion', 'index.html'), 'utf8');
      expect(titlesOf(html)).toEqual([ page.title ]);
      expect(html).toContain(accountDeletionContent.blocks.join(''));
      expect(html).toContain('<a href="mailto:hasuidev@gmail.com">hasuidev@gmail.com</a>');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
