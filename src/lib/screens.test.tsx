import React from 'react';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
// Aliased: the testing-library lint rules take any `render*` call for a component render.
import { renderToStaticMarkup as staticHtml } from 'react-dom/server';

import PhoneScreenshot from '../components/PhoneScreenshot';
import { WEBP_WIDTHS } from '../components/ShotPicture';
import { YEOUN } from '../data/apps';

const PUBLIC = path.join(__dirname, '..', '..', 'public');
const THEMES = [ 'light', 'dark' ] as const;

// Every capture the page draws: the acts and the feature tiles.
const KEYS = Array.from(new Set([
  ...YEOUN.acts.map((act) => act.screenshot.key),
  ...YEOUN.archive.groups.flatMap((group) => group.tiles.map((tile) => tile.screenshot.key)),
]));

// Width and height from a WebP header (lossy 'VP8 ', lossless 'VP8L' or extended 'VP8X').
const webpSize = (file: string) => {
  const b = readFileSync(file);
  expect(b.toString('latin1', 0, 4)).toBe('RIFF');
  expect(b.toString('latin1', 8, 12)).toBe('WEBP');
  const chunk = b.toString('latin1', 12, 16);
  if (chunk === 'VP8X') {
    return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  }
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  expect(chunk).toBe('VP8 ');
  return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
};

describe('app screen captures', () => {
  // A <source> whose file 404s does not fall back to the <img>, so a missing WebP would blank the screen.
  test.each(KEYS.flatMap((key) => THEMES.map((theme) => [ key, theme ] as const)))('%s (%s): every WebP width and the JPG fallback exist', (key, theme) => {
    const base = path.join(PUBLIC, YEOUN.screenshotDir, `${key}-${theme}`);
    expect(existsSync(`${base}.jpg`)).toBe(true);
    WEBP_WIDTHS.forEach((width) => {
      const file = `${base}-${width}.webp`;
      expect({ file, exists: existsSync(file) }).toEqual({ file, exists: true });
      // 9:20 like the 1080x2400 capture.
      expect(webpSize(file)).toEqual({ width, height: (width * 20) / 9 });
    });
    // Lighter than the fallback JPG it replaces at the same width.
    expect(statSync(`${base}-540.webp`).size).toBeLessThan(statSync(`${base}.jpg`).size);
  });

  test('the picture offers the WebP widths with the drawn size, and keeps the JPG as its <img>', () => {
    const screenshot = YEOUN.acts[0].screenshot;
    const phone = staticHtml(<PhoneScreenshot dir={ YEOUN.screenshotDir } screenshot={ screenshot } />);
    const base = `${YEOUN.screenshotDir}/${screenshot.key}-light`;
    expect(phone).toContain(`<source type="image/webp" srcSet="${base}-540.webp 540w, ${base}-810.webp 810w" sizes="(max-width: 767px) 200px, (min-width: 1024px) 220px, 280px"/>`);
    expect(phone).toContain(`src="${base}.jpg"`);
    const poster = staticHtml(<PhoneScreenshot dir={ YEOUN.screenshotDir } screenshot={ screenshot } variant="poster" />);
    expect(poster).toContain('sizes="(max-width: 767px) 96px, 220px"');
  });
});
