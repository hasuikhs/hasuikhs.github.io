import { readFileSync } from 'fs';
import path from 'path';

const css = (file: string) => readFileSync(path.join(__dirname, file), 'utf8');
// The declarations of every rule whose selector list is exactly `selector` (grouped selectors excluded),
// whether it follows another rule or a comment.
const rule = (source: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(source.matchAll(new RegExp(`(?:^|\\}|\\*\\/)\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g')), (m) => m[1]).join('\n');
};

describe('feature tile posters (the screen rising from a panel)', () => {
  // The visible window's height changes with the column width, so a percentage focus lands on a
  // different row at every width and its top edge cut through the search field. The screen shows from
  // its own top instead: the rounded top corners are the device's, and the only cut is the panel's bottom.
  test('the poster shows the capture from its top at every width', () => {
    expect(rule(css('ticket.css'), '.shot-poster img')).toMatch(/object-position:\s*50% 0;/);
    expect(css('ticket.css')).not.toMatch(/--shot-focus/);
  });

  // The window holds the top ~70% of a capture; the N차 list sits under a ticket detail, so that tile shows the bottom.
  test('a bottom-anchored capture shows its lower end, and only the N차 tile uses it', () => {
    expect(rule(css('ticket.css'), '.shot-poster-wrap--bottom .shot-poster img')).toMatch(/object-position:\s*50% 100%;/);
    const data = readFileSync(path.join(__dirname, '..', 'data', 'apps.ts'), 'utf8');
    expect(data.match(/anchor: 'bottom'/g)).toHaveLength(1);
    expect(data).toMatch(/key: 'nth',[^}]*anchor: 'bottom'/);
  });

  // In a phone card a long body makes the panel taller than the screen; stretching the screen to fill it
  // would crop the capture's sides, so the screen keeps 9:20 and sits on the panel's bottom edge.
  test('the phone card screen keeps 9:20 and sits on the bottom edge', () => {
    const screen = rule(css('sections.css'), '.ticket--tile .ticket__poster .shot-poster');
    expect(screen).toMatch(/aspect-ratio:\s*9 \/ 20;/);
    expect(screen).toMatch(/align-self:\s*flex-end;/);
  });
});
