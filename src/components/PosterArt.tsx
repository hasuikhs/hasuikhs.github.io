import type { CSSProperties } from 'react';

import { HUB_STUB_LABEL, SITE, YEOUN } from '../data/apps';

type PosterArtProps = {
  // <768: a 96px band across the top of a vertical ticket (64px icon, no floor lines).
  compact?: boolean;
};

// The poster of the 여운 ticket: the app icon over a stage floor. Decorative only.
function PosterArt({ compact = false }: PosterArtProps) {
  return (
    <div className={ `poster${compact ? ' poster--compact' : ''}` } aria-hidden="true">
      <div className="poster__meta">
        <span>{ HUB_STUB_LABEL }</span>
        <span>{ SITE.platform }</span>
      </div>
      <img
        className="poster__icon appear appear--icon"
        style={ { '--d': '.2s' } as CSSProperties }
        src={ YEOUN.iconSrc }
        alt=""
        width={ 512 }
        height={ 512 }
        decoding="async"
      />
      <div className="poster__floor" />
      <p className="poster__title display">{ YEOUN.name }</p>
    </div>
  );
}

export default PosterArt;
