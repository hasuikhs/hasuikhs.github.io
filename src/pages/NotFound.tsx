import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import SiteFooter from '../components/SiteFooter';
import ThemeToggle from '../components/ThemeToggle';
import { NOT_FOUND } from '../data/apps';
import PAGE_META from '../data/pageMeta.json';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useEntrance from '../hooks/useEntrance';

const delay = (d: string) => ({ '--d': d } as CSSProperties);

function NotFound() {
  useDocumentTitle(PAGE_META.notFound.title);
  useEntrance('not-found');

  return (
    <>
      <div className="container page-tools appear appear--soft">
        <ThemeToggle />
      </div>
      <main className="container not-found">
        <h1 className="not-found__title display appear appear--soft">{ NOT_FOUND.title }</h1>
        <p className="appear appear--soft" style={ delay('.1s') }>{ NOT_FOUND.body }</p>
        <div className="appear appear--soft" style={ delay('.2s') }>
          <Link className="btn" to="/">{ NOT_FOUND.homeLink }</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default NotFound;
