import { readFileSync } from 'fs';
import path from 'path';

import { YEOUN } from '../data/apps';
import { COUNTDOWN_END, COUNTDOWN_START, countdownDay, countdownLabels, ratingSteps } from './stubScenes';

const ticketCss = readFileSync(path.join(__dirname, '..', 'styles', 'ticket.css'), 'utf8');
const stageCss = readFileSync(path.join(__dirname, '..', 'styles', 'stage.css'), 'utf8');
const actOf = (kind: string) => YEOUN.acts.find((act) => act.scene?.kind === kind);

describe('stub scenes', () => {
  test('the countdown runs D-N down to the hero badge', () => {
    expect(countdownLabels(3, '오늘')).toEqual([ 'D-3', 'D-2', 'D-1', '오늘' ]);
  });

  test('the rating counts up in the app\'s half stars', () => {
    expect(ratingSteps('5.0')).toEqual([ '0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0' ]);
    expect(ratingSteps('3.5')).toHaveLength(7);
  });

  test('on the stage the countdown follows the scroll and holds its last label', () => {
    expect(countdownDay(0, 3)).toBe(3);
    expect(countdownDay(COUNTDOWN_START, 3)).toBe(3);
    expect(countdownDay(COUNTDOWN_START + 0.05, 3)).toBe(2);
    expect(countdownDay(COUNTDOWN_START + 0.1, 3)).toBe(1);
    expect(countdownDay(COUNTDOWN_END - 0.01, 3)).toBe(0);
    expect(countdownDay(0.46, 3)).toBe(0);
    // Monotonic: scrolling on never counts back up.
    const days = Array.from({ length: 101 }, (_, i) => countdownDay(i / 100, 3));
    days.slice(1).forEach((day, i) => expect(day).toBeLessThanOrEqual(days[i]));
  });

  // The countdown stub is the hero's show (tonight) on the day it was booked: same date, the badge
  // its first label, and every day it can show has a CSS rule.
  test('act one is the hero ticket counting down, and the CSS covers each of its days', () => {
    const booked = actOf('countdown');
    const scene = booked?.scene;
    expect(scene?.kind).toBe('countdown');
    if (scene?.kind !== 'countdown') {
      return;
    }
    const { from } = scene;
    expect(booked?.stub).toMatchObject({ badge: `D-${from}`, dayOffset: YEOUN.heroStub.dayOffset });
    expect(YEOUN.heroStub.badge).toBe('오늘');
    Array.from({ length: from + 1 }, (_, day) => day).forEach((day) => {
      expect(ticketCss).toContain(`[data-day='${day}'] .stub__count > [data-d='${day}']`);
    });
  });

  test('act two is tonight\'s show, rated after it ends', () => {
    expect(actOf('rating')?.stub).toMatchObject({ star: '5.0', dayOffset: YEOUN.heroStub.dayOffset });
  });

  // With no state the parts draw the scene's end (reduced motion, no script): the star line, the full rating.
  test('the static look of the rating scene is its end', () => {
    const rule = (selector: string) => {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return ticketCss.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    };
    expect(rule('.stub__flip-front')).toMatch(/opacity:\s*0;/);
    expect(rule('.stub__roll-strip')).toMatch(/var\(--roll-n, 0\) \* -1\.15em/);
    expect(rule("[data-scene='armed'] .stub__roll-strip")).toMatch(/transform:\s*none;/);
  });

  // Stage: an act's stub fades out when the act changes while its wrapper is already back at 'armed'.
  // The reset waits for the fade, so act two's stub leaves as ★ 5.0 rather than flashing '오늘'.
  test('on the stage a leaving stub keeps its end until it has faded out', () => {
    const fadeOut = stageCss.match(/\.tear\[data-mode='stage'\] \.act__stub \{[^}]*?transition:\s*opacity ([\d.]+)s ease,\s*transform ([\d.]+)s ease;/);
    expect(fadeOut?.[1]).toBeDefined();
    const hold = stageCss.match(/\[data-scene='armed'\] \.stub__roll-strip \{\s*transition:\s*opacity 0s linear ([\d.]+)s,\s*transform 0s linear ([\d.]+)s;/);
    expect(hold?.slice(1)).toEqual([ fadeOut?.[1], fadeOut?.[2] ]);
  });
});
