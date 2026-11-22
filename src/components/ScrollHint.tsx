import type { CSSProperties } from 'react';

import useHasScrolled from '../hooks/useHasScrolled';
import { ChevronDownIcon } from './Icons';

type ScrollHintProps = {
  // Stacked page: the hint leaves for good at the reader's first scroll.
  leaveOnScroll?: boolean;
};

// The scroll hint under the hero ticket: a short dashed tear line and a chevron that nudges down. Decoration
// only (no words, hidden from screen readers, not a link).
// stage:   placed under the stage ticket and scrubbed by the scroll position (--hint-o, useTearStage), so it
//          comes back at the top.
// stacked: in the flow between the ticket and the acts (phones, tablets), so the first screen says the page
//          goes on below (a phone visitor tapped the Play badge without ever scrolling). It fades out at the
//          first scroll and stays gone: on phones the torn stub then hangs where it was.
function ScrollHint({ leaveOnScroll = false }: ScrollHintProps) {
  const scrolled = useHasScrolled();
  return (
    <p
      className="tear__hint"
      aria-hidden="true"
      data-hidden={ leaveOnScroll && scrolled ? '' : undefined }
      data-testid="tear-hint"
    >
      <span
        className="tear__hint-inner appear appear--fade"
        style={ { '--d': '1s', animationDuration: '.6s' } as CSSProperties }
      >
        <ChevronDownIcon className="tear__hint-chevron" />
      </span>
    </p>
  );
}

export default ScrollHint;
