import { useEffect } from 'react';

const SELECTOR = '[data-reveal], [data-reveal-lines]';

// Items already on screen when the page first reveals wait this long, so they come in after the hero's own
// entrance (its buttons start at .72s) instead of before it.
export const FIRST_SCREEN_DELAY = '0.9s';

// One-shot scroll reveal: `.is-in` once an element is 15% inside the viewport
// (bottom 10% excluded). Without IntersectionObserver everything shows at once.
// `key` re-scans when the set of revealable elements changes (e.g. the tear's mode).
//
// On load it waits for `.fonts-ready` on <html> (index.tsx: the display face, at most 1.5s). Revealed
// earlier, a heading near the top of a tall phone ('공연 하나, 세 장면') showed before the hero and in the
// fallback face, then swapped faces.
function useReveal(key?: string) {
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
      els.forEach((el) => io?.observe(el));
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
  }, [ key ]);
}

export default useReveal;
