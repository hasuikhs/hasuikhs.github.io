import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
import { YEOUN } from '../data/apps';

const tiles = YEOUN.archive.groups.flatMap((group) => group.tiles);
const items = YEOUN.archive.more.items;

describe('feature icons', () => {
  test('every feature tile and list item has its own icon', () => {
    const icons = [ ...tiles, ...items ].map((feature) => feature.icon);
    expect(icons).toHaveLength(tiles.length + items.length);
    expect(new Set(icons).size).toBe(icons.length);
  });

  // The title already names the feature, so the icon is hidden from screen readers and sits before it.
  test('each title starts with its decorative icon', () => {
    render(
      <MemoryRouter initialEntries={ [ '/yeoun' ] }>
        <App />
      </MemoryRouter>,
    );
    [ ...tiles, ...items ].forEach(({ title }) => {
      const heading = screen.getByRole('heading', { level: 4, name: title });
      expect(heading.innerHTML).toMatch(/^<svg class="feature-icon"[^>]*aria-hidden="true"[^>]*focusable="false"[^>]*><path[^>]*><\/path><\/svg>/);
      expect(heading).toHaveTextContent(title);
    });
  });
});
