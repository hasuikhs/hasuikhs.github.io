// The sample stubs' small scenes (see AppActScene): the labels and values they step through, and where
// the stage's scroll position puts the countdown.

// D-3, D-2, D-1, then the hero stub's badge for the day itself ('오늘').
export function countdownLabels(from: number, today: string): string[] {
  return [ ...Array.from({ length: from }, (_, i) => `D-${from - i}`), today ];
}

// The rating act two's stub counts up through, in the app's half-star steps: 0.5, 1.0, ..., 5.0.
export function ratingSteps(star: string): string[] {
  const halves = Math.round(Number(star) * 2);
  return Array.from({ length: halves }, (_, i) => ((i + 1) / 2).toFixed(1));
}

// Stage: act one's stub is on screen from the ticket opening (r ~ .2) to act two (r .47). Its countdown
// runs over r .22-.40, one step each sixth of a screen or so, and stays on the last label until act two.
export const COUNTDOWN_START = 0.22;
export const COUNTDOWN_END = 0.4;

export function countdownDay(r: number, from: number): number {
  const t = Math.min(1, Math.max(0, (r - COUNTDOWN_START) / (COUNTDOWN_END - COUNTDOWN_START)));
  return from - Math.min(from, Math.floor(t * (from + 1)));
}
