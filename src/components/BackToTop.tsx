import { SITE } from '../data/apps';
import { useScrollState } from '../hooks/useScrollState';
import { ChevronUpIcon } from './Icons';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Bottom-right, once the page is scrolled past a screen and a half. Back at the top, focus moves to the
// header's first link, so a keyboard reader carries on from the top (the button itself hides there).
function BackToTop() {
  const { past } = useScrollState();

  const toTop = () => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION).matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.site-header a')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      className="back-to-top"
      data-visible={ past ? '' : undefined }
      aria-label={ SITE.backToTop }
      title={ SITE.backToTop }
      onClick={ toTop }
    >
      <ChevronUpIcon />
    </button>
  );
}

export default BackToTop;
