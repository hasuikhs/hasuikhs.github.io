import { useState } from 'react';

import { useTheme } from '../lib/theme';

type ShotPictureProps = {
  base: string;
  alt: string;
  width: number;
  height: number;
  // How wide the capture is drawn (an <img sizes> value): the browser picks the WebP width from it.
  sizes: string;
  eager?: boolean;
  className?: string;
  // Called once if the capture fails to load, so a caller can drop its frame altogether.
  onMissing?: () => void;
};

// Each capture ships as WebP at these widths (`{key}-{theme}-{w}.webp`, Lanczos from the 1080x2400
// emulator capture, encoded by Chrome at quality .92), with the 540px JPG as the fallback. A <source>
// whose file 404s does not fall back to the <img>, so every width must exist (src/lib/screens.test.ts).
export const WEBP_WIDTHS = [ 540, 810 ] as const;

// The capture for the theme in effect (the header switch, else the system — src/lib/theme.ts), not a
// prefers-color-scheme <source>, which would ignore the switch. A capture that fails to load hides
// itself so the frame keeps its paper-deep fill instead of a broken-image icon.
function ShotPicture({ base, alt, width, height, sizes, eager = false, className, onMissing }: ShotPictureProps) {
  const theme = useTheme();
  const src = `${base}-${theme}`;
  const [ missingSrc, setMissingSrc ] = useState<string | null>(null);

  return (
    <picture className={ className }>
      <source
        type="image/webp"
        srcSet={ WEBP_WIDTHS.map((w) => `${src}-${w}.webp ${w}w`).join(', ') }
        sizes={ sizes }
      />
      <img
        src={ `${src}.jpg` }
        alt={ alt }
        width={ width }
        height={ height }
        loading={ eager ? 'eager' : 'lazy' }
        decoding="async"
        data-missing={ missingSrc === src ? '' : undefined }
        onError={ () => {
          setMissingSrc(src);
          onMissing?.();
        } }
      />
    </picture>
  );
}

export default ShotPicture;
