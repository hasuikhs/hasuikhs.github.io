import { useEffect, useState } from 'react';

// How far down counts as the reader's first scroll: a jitter of a few pixels, or a scroll event that leaves the
// page at the top (App's ScrollToTop after a link), does not. The stacked tear arms on the same line
// (useTearStage), so the scroll hint is always on its way out before the stub tears.
export const SCROLLED_AFTER = 8;

// True from the first time the page is scrolled more than `after` px down, and from then on: back at the top it
// stays true. Read once a frame while scrolling, and not at all once true.
// The first read waits a frame after the page has rendered, because the window is still where the last page was
// scrolled to while this one renders:
// - a link inside the site: App's ScrollToTop (a layout effect) then takes it to the top;
// - back / forward: the browser restores this page's own position only after the popstate handlers have run,
//   and React renders the page (effects included) inside that handler. Read in the effect itself, a page that
//   comes back at the top took the scroll of the page being left for its own, and hid the hint for good.
// A page that opens part way down (a reload) is read on that frame or at its scroll.
function useHasScrolled(after = SCROLLED_AFTER) {
  const [ scrolled, setScrolled ] = useState(false);

  useEffect(() => {
    if (scrolled) {
      return undefined;
    }
    let raf = 0;
    const read = () => {
      raf = 0;
      if (window.scrollY > after) {
        setScrolled(true);
      }
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(read);
      }
    };
    raf = requestAnimationFrame(read);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ scrolled, after ]);

  return scrolled;
}

export default useHasScrolled;
