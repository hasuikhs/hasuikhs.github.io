import { useEffect } from 'react';

const SELECTOR = '[data-reveal], [data-reveal-lines]';

// Items already on screen when the page first reveals wait this long, so they come in after the hero's own
// entrance (its buttons start at .72s) instead of before it.
export const FIRST_SCREEN_DELAY = '0.9s';

// How far an element's own transform moves it down: a hidden [data-reveal] waits --y below its place (App.css).
// Reads a computed `transform`: 'none', 'matrix(a, b, c, d, x, y)' or 'matrix3d(... x, y, z, w)'.
export const ownOffsetY = (transform: string) => {
  const match = /^matrix(3d)?\(([^)]*)\)$/.exec(transform.trim());
  if (!match) {
    return 0;
  }
  const values = match[2].split(',').map(Number);
  const y = match[1] ? values[13] : values[5];
  return Number.isFinite(y) ? y : 0;
};

type Box = Pick<DOMRect, 'top' | 'bottom' | 'width' | 'height'>;

// On screen where it will rest (its box less its own offset): the top edge above the bottom of the viewport and
// the bottom edge below its top, so a sliver peeking in at the bottom counts. A box with no size is not drawn.
export const onScreenAtRest = (box: Box, offsetY: number, viewportH: number) =>
  (box.width > 0 || box.height > 0) && box.top - offsetY < viewportH && box.bottom - offsetY > 0;

type RevealOptions = {
  // Phones: the first pass also brings in what peeks in at the bottom of the screen. The observer below leaves
  // the bottom 10% out, so the next section's heading sat there transparent and the page looked finished.
  revealPeeking?: boolean;
};

// One-shot scroll reveal: `.is-in` once an element is 15% inside the viewport
// (bottom 10% excluded). Without IntersectionObserver everything shows at once.
// `key` re-scans when the set of revealable elements changes (e.g. the tear's mode).
//
// On load it waits for `.fonts-ready` on <html> (index.tsx: the display face, at most 1.5s). Revealed
// earlier, a heading near the top of a tall phone ('공연 하나, 세 장면') showed before the hero and in the
// fallback face, then swapped faces.
function useReveal(key?: string, { revealPeeking = false }: RevealOptions = {}) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter(
      (el) => !el.classList.contains('is-in')
    );
    if (els.length === 0) {
      return undefined;
    }
    if (typeof window.IntersectionObserver !== 'function') {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }

    const html = document.documentElement;
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;

    const begin = (firstScreen: boolean) => {
      // With revealPeeking, anything already on screen comes in now, with the rest of the first screen's delay.
      const later = revealPeeking
        ? els.filter((el) => {
          const shown = onScreenAtRest(
            el.getBoundingClientRect(),
            ownOffsetY(window.getComputedStyle(el).transform || 'none'),
            window.innerHeight
          );
          if (shown) {
            if (firstScreen) {
              el.style.transitionDelay = FIRST_SCREEN_DELAY;
            }
            el.classList.add('is-in');
          }
          return !shown;
        })
        : els;
      if (later.length === 0) {
        return;
      }

      let firstBatch = firstScreen;
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (firstBatch && entry.target instanceof HTMLElement) {
                entry.target.style.transitionDelay = FIRST_SCREEN_DELAY;
              }
              entry.target.classList.add('is-in');
              io?.unobserve(entry.target);
            }
          });
          firstBatch = false;
        },
        { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
      );
      later.forEach((el) => io?.observe(el));
    };

    // Waiting only applies to a scripted page load (index.tsx sets `.js`); a later re-scan starts at once.
    const waiting = html.classList.contains('js') && !html.classList.contains('fonts-ready');
    if (!waiting || typeof window.MutationObserver !== 'function') {
      begin(false);
    } else {
      mo = new MutationObserver(() => {
        if (html.classList.contains('fonts-ready')) {
          mo?.disconnect();
          mo = null;
          begin(true);
        }
      });
      mo.observe(html, { attributes: true, attributeFilter: [ 'class' ] });
    }

    return () => {
      mo?.disconnect();
      io?.disconnect();
    };
  }, [ key, revealPeeking ]);
}

export default useReveal;
