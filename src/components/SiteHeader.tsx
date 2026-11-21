import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';

import { SITE } from '../data/apps';
import type { AppAnchor } from '../data/apps';
import { useScrollState } from '../hooks/useScrollState';
import ThemeToggle from './ThemeToggle';

type SiteHeaderProps = {
  anchors: AppAnchor[];
  // The '#acts' entry opens act one directly while the scroll stage is on.
  onActsClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

// Sticky: it slides away while the reader scrolls down and comes back on any scroll up (and whenever focus
// is inside it, sections.css), so the menu and the theme switch are one flick away on a long page.
function SiteHeader({ anchors, onActsClick }: SiteHeaderProps) {
  const { down } = useScrollState();
  return (
    <header className="site-header" data-hidden={ down ? '' : undefined }>
      <div className="container site-header__inner appear appear--down" style={ { animationDuration: '.6s' } }>
        <Link to="/" className="site-header__back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M7.5 3.5 3 8l4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          { SITE.backToHub }
        </Link>
        <div className="site-header__end">
          <nav className="site-header__nav" aria-label={ SITE.pageNavLabel }>
            { anchors.map((anchor) => (
              <a
                key={ anchor.href }
                href={ anchor.href }
                onClick={ anchor.href === '#acts' ? onActsClick : undefined }
              >
                { anchor.label }
              </a>
            )) }
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
