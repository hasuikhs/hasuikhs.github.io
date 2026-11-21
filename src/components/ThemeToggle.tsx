import type { CSSProperties } from 'react';

import { SITE } from '../data/apps';
import { switchTheme, useOrbitTurns, useTheme } from '../lib/theme';
import { MoonIcon, SunIcon } from './Icons';

// Light/dark switch. The sky in it shows the theme in effect: the sun over the horizon by day, the moon by
// night. Each switch turns their orbit another half circle, always the same way (sections.css), so one sets
// on the right as the other rises on the left, back to light as well. The label says what pressing does.
function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? SITE.themeToDark : SITE.themeToLight;
  // Half turns so far (lib/theme, counted at every change from any source): even = the sun up, odd = the moon.
  const orbitStyle = { '--orbit-turn': `${useOrbitTurns() * 180}deg` } as CSSProperties;

  return (
    <button
      type="button"
      className={ `theme-toggle${className ? ` ${className}` : ''}` }
      aria-label={ label }
      title={ label }
      onClick={ () => switchTheme(next) }
    >
      <span className="theme-toggle__sky" aria-hidden="true">
        <span className="theme-toggle__orbit" style={ orbitStyle }>
          <span className="theme-toggle__body theme-toggle__body--sun">
            <SunIcon />
          </span>
          <span className="theme-toggle__body theme-toggle__body--moon">
            <MoonIcon />
          </span>
        </span>
      </span>
    </button>
  );
}

export default ThemeToggle;
