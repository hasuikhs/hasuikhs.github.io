import React from 'react';
import { readFileSync } from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';

import PlayStoreButton, { BADGE_HEIGHTS, badgeSize } from './PlayStoreButton';

const PUBLIC = path.join(__dirname, '..', '..', 'public');

// Width and height from a PNG's IHDR chunk.
const pngSize = (publicPath: string) => {
  const bytes = readFileSync(path.join(PUBLIC, publicPath));
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

describe('Play badge', () => {
  // The official artwork is 478x142. Drawn at 40-48px tall the browser shrinks it about 3x on a 1x screen,
  // which smears the small '다운로드' line; each height ships proportionally scaled copies at exactly 1x and 2x.
  test.each(BADGE_HEIGHTS)('height %i has exact 1x and 2x copies of the official artwork', (height) => {
    const { width } = badgeSize(height);
    expect(width).toBe(Math.round((478 * height) / 142));
    expect(pngSize(`badges/google-play-ko-h${height}.png`)).toEqual({ width, height });
    expect(pngSize(`badges/google-play-ko-h${height}@2x.png`)).toEqual({ width: width * 2, height: height * 2 });
    expect(pngSize('badges/google-play-ko.png')).toEqual({ width: 478, height: 142 });
  });

  test.each(BADGE_HEIGHTS)('height %i serves 1x, 2x and the original as 3x at an integer size', (height) => {
    const { width } = badgeSize(height);
    render(<PlayStoreButton href="https://play.google.com/store/apps/details?id=x" height={ height } />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', `/badges/google-play-ko-h${height}.png`);
    expect(img).toHaveAttribute(
      'srcset',
      `/badges/google-play-ko-h${height}.png 1x, /badges/google-play-ko-h${height}@2x.png 2x, /badges/google-play-ko.png 3x`,
    );
    expect(img).toHaveAttribute('width', String(width));
    expect(img).toHaveAttribute('height', String(height));
  });
});
