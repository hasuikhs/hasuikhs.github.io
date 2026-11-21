import { readFileSync } from 'fs';
import path from 'path';

import { DISPLAY_FONT, displayFontHref, loadDisplayFont } from './displayFont';

const read = (file: string) => readFileSync(path.join(__dirname, '..', file), 'utf8');
const css = read;
const CSS_FILES = [ 'index.css', 'App.css', 'styles/ticket.css', 'styles/stage.css', 'styles/sections.css' ];
const TSX_FILES = [ 'pages/Yeoun.tsx', 'pages/Home.tsx', 'pages/NotFound.tsx', 'components/PosterArt.tsx' ];

// Every class written next to `display` in a className, e.g. "hero__title display" -> hero__title.
const displayCarryingClasses = () => {
  const found = new Set<string>();
  TSX_FILES.forEach((file) => {
    Array.from(read(file).matchAll(/className=\{?\s*[`"]([^`"]*\bdisplay\b[^`"]*)[`"]/g), (m) => m[1])
      .flatMap((value) => value.split(/\s+/))
      .filter((token) => /^[a-z][\w-]*$/.test(token) && token !== 'display')
      .forEach((token) => found.add(token));
  });
  return Array.from(found);
};

// [selector, body] for every rule in a stylesheet, including rules nested in @media blocks.
const rules = (file: string) => Array.from(css(file).matchAll(/([^{}]+)\{([^{}]*)\}/g), (m) => [ m[1].trim(), m[2] ] as const);

// The weights a declaration block sets, from `font-weight` and from the `font` shorthand.
const declaredWeights = (body: string) => {
  const longhand = Array.from(body.matchAll(/font-weight:\s*([^;]+);/g), (m) => m[1].trim());
  const shorthand = Array.from(body.matchAll(/(?:^|[;\s])font:\s*([^;]+);/g), (m) => {
    const tokens = m[1].trim().split(/\s+/);
    const sizeAt = tokens.findIndex((token) => /^(\d|clamp\(|var\(|calc\()/.test(token) && !/^\d{3}$/.test(token));
    const before = tokens.slice(0, sizeAt < 0 ? tokens.length : sizeAt);
    return before.find((token) => /^(\d{3}|bold|bolder|lighter)$/.test(token)) ?? 'normal';
  });
  return [ ...longhand, ...shorthand ];
};

describe('display font', () => {
  test('is Gowun Dodum 400, requested as one text= subset', () => {
    expect(DISPLAY_FONT).toEqual({ family: 'Gowun Dodum', weight: 400 });
    const url = new URL(displayFontHref([ '막이 내린 뒤에도,', '여운' ]));
    expect(url.origin + url.pathname).toBe('https://fonts.googleapis.com/css2');
    expect(url.searchParams.get('family')).toBe('Gowun Dodum:wght@400');
    expect(url.searchParams.get('display')).toBe('swap');
    expect(url.searchParams.get('text')).toBe('막이내린뒤에도,여운');
  });

  // A glyph outside the subset falls back to the body sans (never a Myeongjo face).
  test('the --display stack is the loaded family, then the body sans stack', () => {
    expect(css('App.css').match(/--display:\s*([^;]+);/)?.[1]).toBe(`'${DISPLAY_FONT.family}', var(--sans)`);
  });

  test('no stylesheet or page still refers to the old serif face', () => {
    CSS_FILES.forEach((file) => expect({ file, hit: css(file).match(/--serif|\.serif\b|Noto Serif/)?.[0] ?? null })
      .toEqual({ file, hit: null }));
    TSX_FILES.forEach((file) => expect({ file, hit: read(file).match(/className=[^>]*\bserif\b/)?.[0] ?? null })
      .toEqual({ file, hit: null }));
  });

  // Gowun Dodum ships 400 only: any other weight on the display face would be synthesised (faux bold).
  test('.display draws the loaded weight and never synthesises one', () => {
    const displayRule = css('App.css').match(/\.display\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(displayRule).toMatch(new RegExp(`font-weight:\\s*${DISPLAY_FONT.weight};`));
    expect(displayRule).toMatch(/font-synthesis:\s*none;/);
  });

  test('no rule gives a display-face element, or var(--display), another weight', () => {
    const classes = displayCarryingClasses();
    expect(classes).toEqual(expect.arrayContaining([ 'hero__title', 'h2', 'act__title', 'hub-card__name', 'poster__title' ]));
    const allowed = [ String(DISPLAY_FONT.weight), 'normal' ];
    const offenders = CSS_FILES.flatMap((file) => rules(file)
      .filter(([ selector, body ]) => body.includes('var(--display)')
        || classes.some((name) => new RegExp(`\\.${name}(?![\\w-])`).test(selector)))
      .flatMap(([ selector, body ]) => declaredWeights(body)
        .filter((weight) => !allowed.includes(weight))
        .map((weight) => `${file}: ${selector} -> ${weight}`)));
    expect(offenders).toEqual([]);
  });

  const withFonts = (load: jest.Mock) => Object.defineProperty(document, 'fonts', { configurable: true, value: { load } });
  const stylesheetLink = () => document.head.querySelector<HTMLLinkElement>('link[rel="stylesheet"]');
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  afterEach(() => {
    document.head.querySelectorAll('link').forEach((link) => link.remove());
  });

  test('waits until the loaded weight and family are usable', async () => {
    let finish: () => void = () => undefined;
    const load = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    withFonts(load);
    let settled = false;
    loadDisplayFont([ '여운' ]).then(() => { settled = true; });
    expect(stylesheetLink()?.href).toBe(displayFontHref([ '여운' ]));

    stylesheetLink()?.dispatchEvent(new Event('load'));
    await flush();
    expect(load).toHaveBeenCalledWith('400 1em "Gowun Dodum"', '여운');
    expect(settled).toBe(false);

    finish();
    await flush();
    expect(settled).toBe(true);
  });

  test('still settles when the face fails to load or the stylesheet errors', async () => {
    withFonts(jest.fn(() => Promise.reject(new Error('blocked'))));
    const rejected = loadDisplayFont([ '여운' ]);
    stylesheetLink()?.dispatchEvent(new Event('load'));
    await expect(rejected).resolves.toBeUndefined();

    stylesheetLink()?.remove();
    const errored = loadDisplayFont([ '여운' ]);
    stylesheetLink()?.dispatchEvent(new Event('error'));
    await expect(errored).resolves.toBeUndefined();
  });
});
