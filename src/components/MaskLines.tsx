import { Fragment } from 'react';
import type { CSSProperties } from 'react';

type MaskLinesProps = {
  lines: readonly string[];
  // Load entrances pass a delay per line (--d); scroll and act entrances stagger by index (--i).
  delays?: readonly string[];
};

// Hand-broken headline lines, each rising out of its own mask. The space between lines
// keeps the heading's accessible name readable as one sentence.
function MaskLines({ lines, delays }: MaskLinesProps) {
  return (
    <>
      { lines.map((line, i) => {
        const custom: Record<string, string> = delays ? { '--d': delays[i] } : { '--i': String(i) };
        const style = custom as CSSProperties;
        return (
          <Fragment key={ line }>
            { i > 0 && ' ' }
            <span className="mask-line">
              <span style={ style }>{ line }</span>
            </span>
          </Fragment>
        );
      }) }
    </>
  );
}

export default MaskLines;
