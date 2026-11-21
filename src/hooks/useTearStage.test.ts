import { STAGE_QUERY, stackedTearLine, stubReadyToTear, stubSettledInView } from './useTearStage';

const rect = (top: number, height: number) => ({ top, bottom: top + height, height });

describe('tear mode', () => {
  // A 1366x768 laptop's browser window is about 620px tall: it gets the scroll stage (2026-11-21).
  test('the stage needs 1024 x 600 and motion', () => {
    expect(STAGE_QUERY).toBe('(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)');
  });
});

describe('stacked tear', () => {
  test('a short stub (the phone ticket) tears once it is in the top 65% of the viewport', () => {
    expect(stackedTearLine(844, 64)).toBeCloseTo(548.6);
    expect(stubReadyToTear(rect(520, 64), 844)).toBe(false);
    expect(stubReadyToTear(rect(480, 64), 844)).toBe(true);
  });

  // The horizontal ticket's stub is the whole right end (about 480px): in a 600px or 523px window it can
  // never sit in the top 65%, so it tears once it is all on screen instead of never.
  test.each([ 600, 523 ])('the horizontal stub tears in a %ipx-tall window once it is all on screen', (vh) => {
    const line = stackedTearLine(vh, 480);
    expect(line).toBe(496);
    expect(stubReadyToTear(rect(40, 480), vh)).toBe(false);
    expect(stubReadyToTear(rect(16, 480), vh)).toBe(true);
    expect(stubReadyToTear(rect(-200, 480), vh)).toBe(true);
  });

  test('a stub taller than the viewport tears once its bottom edge is on screen', () => {
    expect(stackedTearLine(186, 480)).toBe(186);
    expect(stubReadyToTear(rect(-300, 480), 186)).toBe(true);
    expect(stubReadyToTear(rect(-200, 480), 186)).toBe(false);
  });

  test('nothing tears while the stub is off screen or not laid out', () => {
    expect(stubReadyToTear(rect(-480, 480), 600)).toBe(false);
    expect(stubReadyToTear(rect(900, 64), 844)).toBe(false);
    expect(stubReadyToTear({ top: 0, bottom: 0, height: 0 }, 768)).toBe(false);
  });
});

// A flick on a phone carried the stub past its line and played the whole tear off screen: the tear waits
// for the scroll to rest with most of the stub still on screen.
describe('stacked tear once the scroll rests', () => {
  test('the phone stub tears at rest in the top of the screen, not once mostly scrolled past', () => {
    expect(stubSettledInView(rect(480, 64), 844)).toBe(true);
    expect(stubSettledInView(rect(-20, 64), 844)).toBe(true);
    expect(stubSettledInView(rect(-30, 64), 844)).toBe(false);
  });

  test('the horizontal stub in a short window tears while 60% of it is on screen', () => {
    expect(stubSettledInView(rect(16, 480), 523)).toBe(true);
    expect(stubSettledInView(rect(-150, 480), 523)).toBe(true);
    expect(stubSettledInView(rect(-250, 480), 523)).toBe(false);
  });
});
