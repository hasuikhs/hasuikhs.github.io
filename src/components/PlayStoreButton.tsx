import { SITE } from '../data/apps';

export const BADGE_HEIGHTS = [ 40, 44, 48 ] as const;
type BadgeHeight = typeof BADGE_HEIGHTS[number];

type PlayStoreButtonProps = {
  href: string;
  // Rendered badge height; the clear space around it must stay at least a quarter of this.
  height?: BadgeHeight;
  // Only above-the-fold badges load eagerly.
  eager?: boolean;
  className?: string;
};

// Official artwork from Google Partner Marketing Hub (478x142). Use it unmodified: no transform,
// filter, shadow or border on the image. Shrinking it about 3x in the browser smears the small
// '다운로드' line, so every height ships the same artwork proportionally scaled to exactly 1x and 2x
// (public/badges/google-play-ko-h{height}[@2x].png); the original serves 3x screens.
const BADGE_DIR = '/badges';
const ORIGINAL = { width: 478, height: 142 };

export function badgeSize(height: BadgeHeight) {
  return { width: Math.round((ORIGINAL.width * height) / ORIGINAL.height), height };
}

function PlayStoreButton({ href, height = 48, eager = false, className }: PlayStoreButtonProps) {
  const { width } = badgeSize(height);
  const base = `${BADGE_DIR}/google-play-ko-h${height}`;

  return (
    <a
      className={ `play-badge${className ? ` ${className}` : ''}` }
      href={ href }
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className={ `play-badge__image play-badge__image--${height}` }
        src={ `${base}.png` }
        srcSet={ `${base}.png 1x, ${base}@2x.png 2x, ${BADGE_DIR}/google-play-ko.png 3x` }
        alt={ SITE.playBadgeAlt }
        width={ width }
        height={ height }
        loading={ eager ? 'eager' : 'lazy' }
      />
    </a>
  );
}

export default PlayStoreButton;
