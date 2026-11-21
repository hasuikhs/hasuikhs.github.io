import { useEffect, useState } from 'react';

// Scroll state for the sticky header and the back-to-top button, read once per frame while scrolling.
// `down`: the reader last scrolled down (by more than a few pixels) and is past `hideAfter`;
// `past`: the page is scrolled further than `showAfter` viewport heights.
export function useScrollState({ hideAfter = 120, showAfter = 1.5 } = {}) {
  const [ state, setState ] = useState({ down: false, past: false });

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      const dy = y - last;
      setState((prev) => {
        const past = y > window.innerHeight * showAfter;
        // Small moves (a trackpad settling, iOS bounce) keep the header as it was.
        const down = Math.abs(dy) < 4 ? prev.down && y > hideAfter : dy > 0 && y > hideAfter;
        return prev.down === down && prev.past === past ? prev : { down, past };
      });
      if (Math.abs(dy) >= 4) {
        last = y;
      }
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(read);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ hideAfter, showAfter ]);

  return state;
}
