import type { CSSProperties, MouseEvent } from 'react';

import useHasScrolled from '../hooks/useHasScrolled';
import { ChevronDownIcon } from './Icons';

type ScrollCueProps = {
  href: string;
  label: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

// Phones: a quiet link right under the hero ticket that says the page goes on below (a visitor tapped the Play
// badge without ever scrolling). It comes in after the hero, its chevron nudges once (not with reduced motion,
// stage.css), and it fades out for good at the reader's first scroll. It is a visual hint for touch: it sits in the
// acts' own heading row and points at that section, so for screen readers and the keyboard it would be a link that
// goes nowhere — they skip it (the heading right after it is the next thing they reach).
function ScrollCue({ href, label, onClick }: ScrollCueProps) {
  const scrolled = useHasScrolled();
  return (
    <a
      className="scroll-cue"
      href={ href }
      onClick={ onClick }
      aria-hidden="true"
      tabIndex={ -1 }
      data-hidden={ scrolled ? '' : undefined }
      data-testid="scroll-cue"
    >
      <span
        className="scroll-cue__inner appear appear--fade"
        style={ { '--d': '1s', animationDuration: '.6s' } as CSSProperties }
      >
        { label }
        <ChevronDownIcon className="scroll-cue__chevron" />
      </span>
    </a>
  );
}

export default ScrollCue;
