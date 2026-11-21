import type { CSSProperties } from 'react';

import type { AppStub } from '../data/apps';
import { kstStubDate } from '../lib/kstDate';
import { ratingSteps } from '../lib/stubScenes';
import { StarIcon } from './Icons';

type StubLinesProps = {
  stub: AppStub;
  // Countdown scene: the badges it steps through (the first shows when nothing plays).
  countdown?: string[];
  // Rating scene: the badge the stub shows before the show; it then flips over to the star line.
  flipFrom?: string;
};

// The app's stub stack: badge or star line, the big number, the small line.
// A dated stub works out its MM.DD (today in Korea plus its offset) each time it renders.
// Every sample stub is decoration, so the caller hides it from screen readers.
function StubLines({ stub, countdown, flipFrom }: StubLinesProps) {
  const value = 'dayOffset' in stub ? kstStubDate(stub.dayOffset) : stub.value;

  return (
    <>
      { countdown ? (
        <span className="stub__count">
          { countdown.map((label, i) => (
            <span key={ label } className="stub__badge" data-d={ countdown.length - 1 - i }>{ label }</span>
          )) }
        </span>
      ) : stub.badge && <span className="stub__badge">{ stub.badge }</span> }
      { stub.star && (flipFrom ? <StarFlip from={ flipFrom } star={ stub.star } /> : <StarLine star={ stub.star } />) }
      <span className="stub__num">{ value }</span>
      <span className="stub__sub">{ stub.sub }</span>
    </>
  );
}

function StarLine({ star }: { star: string }) {
  return (
    <span className="stub__star">
      <StarIcon />
      { star }
    </span>
  );
}

// The badge on the front; on the back the star line, whose number rolls up through the half stars.
function StarFlip({ from, star }: { from: string; star: string }) {
  const steps = ratingSteps(star);
  return (
    <span className="stub__flip">
      <span className="stub__badge stub__flip-front">{ from }</span>
      <span className="stub__star stub__flip-back">
        <StarIcon />
        <span className="stub__roll">
          <span className="stub__roll-strip" style={ { '--roll-n': steps.length - 1 } as CSSProperties }>
            { steps.map((step) => <span key={ step }>{ step }</span>) }
          </span>
        </span>
      </span>
    </span>
  );
}

export default StubLines;
