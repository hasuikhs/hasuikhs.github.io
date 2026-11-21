import { useEffect } from 'react';

// Load entrances: `.appear`, masked headline lines and the perforation draw.
// Scroll-revealed lines and the stage's act titles have their own triggers and are left alone.
const SELECTOR = '.appear, .mask-line > span, .ticket--draw .ticket__perf';
const OWN_TRIGGER = '[data-reveal-lines], .act';

type Animatable = HTMLElement & { getAnimations?: () => Animation[] };

// Fail-safe for the entrance vocabulary: each element settles into `.is-in` on its own
// animationend; if two frames after mount nothing is animating at all (animations
// unsupported, or switched off), everything settles at once so nothing stays hidden.
function useEntrance(key?: string) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<Animatable>(SELECTOR)).filter(
      (el) => !el.closest(OWN_TRIGGER) && !el.classList.contains('is-in')
    );
    const settle = (el: HTMLElement) => el.classList.add('is-in');
    const settleAll = () => els.forEach(settle);

    if (els.length === 0) {
      return undefined;
    }
    if (typeof els[0].getAnimations !== 'function') {
      settleAll();
      return undefined;
    }

    const onEnd = (event: AnimationEvent) => {
      if (event.target === event.currentTarget) {
        settle(event.currentTarget as HTMLElement);
      }
    };
    els.forEach((el) => el.addEventListener('animationend', onEnd));

    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        // Paused animations count: they are waiting for the font gate, not missing.
        const animating = els.some((el) => (el.getAnimations?.() ?? []).length > 0);
        if (!animating) {
          settleAll();
        }
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      els.forEach((el) => el.removeEventListener('animationend', onEnd));
    };
  }, [ key ]);
}

export default useEntrance;
