import type { AppScreenshot } from '../data/apps';
import ShotPicture from './ShotPicture';

type PhoneScreenshotProps = {
  dir: string;
  screenshot: AppScreenshot;
  // 'phone' = inside a phone frame at 9:20; 'poster' = the screen rising from a poster panel, shown from its top.
  variant?: 'phone' | 'poster';
  // Only above-the-fold images should load eagerly.
  eager?: boolean;
};

// The JPG fallback is 540x1200; the explicit size reserves space before the image loads.
const SCREEN_WIDTH = 540;
const SCREEN_HEIGHT = 1200;

// Drawn widths (measured 2026-11-21): in a phone frame 157-217px on the stage, 264px stacked on tablets,
// 175-188px on phones; as a tile poster 220px (203 on tablets), 76px on phones. A 3x phone gets the 810px
// WebP, a 2x laptop the 540px.
const SIZES = {
  phone: '(max-width: 767px) 200px, (min-width: 1024px) 220px, 280px',
  poster: '(max-width: 767px) 96px, 220px',
} as const;

function PhoneScreenshot({ dir, screenshot, variant = 'phone', eager = false }: PhoneScreenshotProps) {
  const picture = (className: string) => (
    <ShotPicture
      className={ className }
      base={ `${dir}/${screenshot.key}` }
      alt={ screenshot.alt }
      width={ SCREEN_WIDTH }
      height={ SCREEN_HEIGHT }
      sizes={ SIZES[variant] }
      eager={ eager }
    />
  );

  if (variant === 'poster') {
    const wrapClass = `shot-poster-wrap${screenshot.anchor === 'bottom' ? ' shot-poster-wrap--bottom' : ''}`;
    return <div className={ wrapClass }>{ picture('shot-poster') }</div>;
  }

  return <div className="phone">{ picture('phone__screen') }</div>;
}

export default PhoneScreenshot;
