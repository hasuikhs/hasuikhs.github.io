import { useEffect, useState } from 'react';

// True from the first time the page is scrolled more than `after` px down, and from then on: back at the top it
// stays true. Read once a frame while scrolling, and not at all once true.
// The first read is in the effect, not during render: a link inside the site renders the next page while the
// window is still where the last page was scrolled to, and App's ScrollToTop (a layout effect, so it runs before
// this) only then takes it to the top. A page that opens part way down (a reload) is read here or at its scroll.
function useHasScrolled(after = 8) {
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
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ scrolled, after ]);

  return scrolled;
}

export default useHasScrolled;
