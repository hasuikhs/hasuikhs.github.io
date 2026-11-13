import type { AppScreenshot } from '../data/apps';

type PhoneScreenshotProps = {
  dir: string;
  screenshot: AppScreenshot;
  // Only above-the-fold images should load eagerly.
  eager?: boolean;
};

// Captures are 540x1200; the explicit size reserves space before the image loads.
const SCREEN_WIDTH = 540;
const SCREEN_HEIGHT = 1200;

function PhoneScreenshot({ dir, screenshot, eager = false }: PhoneScreenshotProps) {
  const base = `${dir}/${screenshot.key}`;

  return (
    <div className="phone">
      <picture className="phone__screen">
        <source srcSet={ `${base}-dark.jpg` } media="(prefers-color-scheme: dark)" />
        <img
          src={ `${base}-light.jpg` }
          alt={ screenshot.alt }
          width={ SCREEN_WIDTH }
          height={ SCREEN_HEIGHT }
          loading={ eager ? 'eager' : 'lazy' }
          decoding="async"
        />
      </picture>
    </div>
  );
}

export default PhoneScreenshot;
