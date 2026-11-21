import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import LEGAL from '../content/legal/legal.json';
import {
  CONTENT_DIR,
  OUTPUT,
  buildDocuments,
  fill as scriptFill,
  formatDate as scriptFormatDate,
  joinDots as scriptJoinDots,
  legalRoutes,
  renderDocument,
  serialize,
  staticMarkup,
  versionLabel,
  versionPath,
} from '../../scripts/legal-docs';
import { LEGAL_DOC_KEYS, fill, formatDate, legalContent, legalDoc } from './legal';
import type { LegalDocKey } from './legal';
import { joinDots } from './text';

// The served markup as a DOM.
const served = (sitePath: string) => {
  const holder = document.createElement('div');
  holder.innerHTML = staticMarkup(sitePath);
  return holder;
};

describe('documents.json', () => {
  test('is the rendering of the .md files legal.json lists (run `yarn legal` after changing them)', () => {
    expect(readFileSync(OUTPUT, 'utf8')).toBe(serialize(buildDocuments()));
  });

  test('holds every listed version of every document, and the folders hold nothing else', () => {
    LEGAL_DOC_KEYS.forEach((key) => {
      const files = readdirSync(path.join(CONTENT_DIR, key)).sort();
      expect(files).toEqual(LEGAL.documents[key].versions.map((date) => `${date}.md`).sort());
      LEGAL.documents[key].versions.forEach((date) => expect(legalContent(key, date)).toBeDefined());
    });
  });

  test('two documents, each in force since 2026-11-20 with the 2026-11-10 version before it', () => {
    expect(LEGAL_DOC_KEYS).toEqual([ 'terms', 'privacy' ]);
    LEGAL_DOC_KEYS.forEach((key) => expect(LEGAL.documents[key].versions).toEqual([ '2026-11-20', '2026-11-10' ]));
    expect(legalContent('terms', '2026-11-20')?.title).toBe('여운(Yeoun) 이용약관');
    expect(legalContent('privacy', '2026-11-20')?.title).toBe('여운(Yeoun) 개인정보처리방침');
  });

  test('keeps a middle dot on the line of the word before it, as the rest of the site does', () => {
    const html = legalContent('terms', '2026-11-20')?.blocks.join('') ?? '';
    expect(html).toContain('개발자\u2060·이용자');
    expect(html).not.toMatch(/[^\s\u2060]·/);
  });
});

describe('build checks', () => {
  // buildDocuments over a scratch content folder holding `files`, with legal.json listing `versions`.
  const build = (files: Record<string, string>, versions: Record<string, string[]>) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'legal-'));
    const legal = {
      documents: Object.fromEntries(Object.entries(versions).map(([ key, list ]) => [ key, { versions: list } ])),
    };
    try {
      Object.entries(files).forEach(([ file, text ]) => {
        mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        writeFileSync(path.join(dir, file), text);
      });
      return buildDocuments(dir, legal);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const doc = (date: string) => `# 제목\n\n시행일: ${scriptFormatDate(date)} (공고일: 2026년 1월 1일)\n\n## 제1조\n\n본문\n`;

  test('a file the list does not name, or a listed file that is missing, stops the build', () => {
    expect(() => build({ 'a/2026-01-02.md': doc('2026-01-02'), 'a/2026-01-01.md': doc('2026-01-01') }, { a: [ '2026-01-02' ] }))
      .toThrow(/holds 2026-01-01.md, 2026-01-02.md but legal.json lists 2026-01-02.md/);
    expect(() => build({ 'a/2026-01-02.md': doc('2026-01-02') }, { a: [ '2026-01-02', '2026-01-01' ] })).toThrow(/legal.json lists/);
  });

  test('versions run newest first, as real dates', () => {
    const files = { 'a/2026-01-02.md': doc('2026-01-02'), 'a/2026-01-01.md': doc('2026-01-01') };
    expect(() => build(files, { a: [ '2026-01-01', '2026-01-02' ] })).toThrow(/newest first/);
    expect(() => build({ 'a/2026-02-30.md': doc('2026-01-01') }, { a: [ '2026-02-30' ] })).toThrow(/not a YYYY-MM-DD date/);
    expect(build(files, { a: [ '2026-01-02', '2026-01-01' ] })).toMatchObject({ a: { '2026-01-02': { title: '제목' } } });
  });

  test('a file whose own date line names another date stops the build', () => {
    expect(() => build({ 'a/2026-01-02.md': doc('2026-01-01') }, { a: [ '2026-01-02' ] })).toThrow(/a\/2026-01-02.md: .*시행일: 2026년 1월 2일/);
    expect(() => renderDocument('제목 없이 본문만\n', '2026-01-01')).toThrow(/starts with its # title/);
  });

  test('markdown the renderer does not draw stops the build, naming the file and line', () => {
    const quoted = `${doc('2026-01-02')}\n> 인용\n`;
    expect(() => build({ 'a/2026-01-02.md': quoted }, { a: [ '2026-01-02' ] }))
      .toThrow(/a\/2026-01-02.md: markdown: line 9: unsupported blockquote/);
  });
});

describe('the page and the build scripts agree', () => {
  test('on dates, templates and the middle-dot joiner', () => {
    [ '2026-11-20', '2026-01-05', '2027-12-31' ].forEach((date) => expect(formatDate(date)).toBe(scriptFormatDate(date)));
    expect(formatDate('2026-01-05')).toBe('2026년 1월 5일');
    expect(fill(LEGAL.labels.toCurrent, { name: '이용약관' })).toBe(scriptFill(LEGAL.labels.toCurrent, { name: '이용약관' }));
    [ '포스터·좌석·캐스팅', 'a · b', '·앞' ].forEach((text) => expect(scriptJoinDots(text)).toBe(joinDots(text)));
  });

  test.each(LEGAL_DOC_KEYS)('on the versions of %s: labels and paths', (key) => {
    const doc = legalDoc(key);
    const source = LEGAL.documents[key];
    expect(doc.versions.map((version) => version.label)).toEqual(source.versions.map((date) => versionLabel(LEGAL.labels, source, date)));
    expect(doc.versions.map((version) => version.path)).toEqual(source.versions.map((date) => versionPath(source, date)));
    expect(doc.versions.map((version) => version.label)).toEqual([ '2026년 11월 20일 시행 (현행)', '2026년 11월 10일 시행' ]);
    expect(doc.versions.map((version) => version.path)).toEqual([ source.path, `${source.path}2026-11-10/` ]);
    expect(legalRoutes().filter((route) => route.key === key).map((route) => route.path))
      .toEqual(doc.versions.map((version) => version.path));
  });
});

describe('served markup', () => {
  test.each(legalRoutes().map((route) => [ route.path, route ] as const))('%s holds the header, the title and the whole document', (_path, route) => {
    const root = served(route.path);
    const content = legalContent(route.key as LegalDocKey, route.date);
    expect(root.querySelector('.site-header__back')?.getAttribute('href')).toBe('/yeoun/');
    expect(root.querySelector('.site-header__back')?.textContent).toBe('여운 소개');
    expect(root.querySelector('main#main.legal')).not.toBeNull();
    expect(root.querySelector('h1')?.textContent).toBe(content?.title);
    expect(root.querySelector('.legal-doc__body')?.innerHTML).toBe(content?.blocks.join(''));
    expect(root.querySelector('.legal__notice')?.getAttribute('role')).toBe('status');
    expect(Boolean(root.querySelector('.legal-notice'))).toBe(!route.current);
  });

  test('lists the versions as links, the one shown marked as the current page', () => {
    const root = served('/yeoun/terms/2026-11-10/');
    const links = Array.from(root.querySelectorAll('.legal-doc__versions a'));
    expect(links.map((link) => [ link.textContent, link.getAttribute('href'), link.getAttribute('aria-current') ])).toEqual([
      [ '2026년 11월 20일 시행 (현행)', '/yeoun/terms/', null ],
      [ '2026년 11월 10일 시행', '/yeoun/terms/2026-11-10/', 'page' ],
    ]);
    expect(root.querySelector('.legal-doc__label')?.textContent).toBe('시행일');
    // A group named by that label (role and id the same as the page's, src/pages/Legal.test.tsx).
    const group = root.querySelector('.legal-doc__versions');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-labelledby')).toBe(root.querySelector('.legal-doc__label')?.id);
    expect(root.querySelector('select')).toBeNull();
    expect(root.querySelector('.legal-notice')?.textContent)
      .toBe('이전 판입니다. 현행 이용약관은 2026년 11월 20일부터 시행하고 있어요. 현행 이용약관 보기');
    expect(root.querySelector('.legal-notice a')?.getAttribute('href')).toBe('/yeoun/terms/');
    expect(root.querySelector('.legal-doc__other')?.getAttribute('href')).toBe('/yeoun/privacy/');
  });

  test('the version in force has no notice and links to the other document', () => {
    const root = served('/yeoun/privacy/');
    expect(root.querySelector('.legal-notice')).toBeNull();
    expect(root.querySelector('h1')?.textContent).toBe('여운(Yeoun) 개인정보처리방침');
    expect(root.querySelector('.legal-doc__other')?.textContent).toBe('이용약관 보기');
    expect(root.querySelector('.legal-doc__other')?.getAttribute('href')).toBe('/yeoun/terms/');
  });

  test('is empty for any other page', () => {
    [ '/', '/yeoun/', '/yeoun/terms/2026-11-20/', '/yeoun/terms', '/nope/' ].forEach((route) => expect(staticMarkup(route)).toBe(''));
  });
});
