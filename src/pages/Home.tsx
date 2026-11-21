import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import MaskLines from '../components/MaskLines';
import PlayStoreButton from '../components/PlayStoreButton';
import SiteFooter from '../components/SiteFooter';
import ThemeToggle from '../components/ThemeToggle';
import Ticket from '../components/Ticket';
import { APPS, HUB, HUB_STUB_LABEL, SITE } from '../data/apps';
import PAGE_META from '../data/pageMeta.json';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useEntrance from '../hooks/useEntrance';
import useMediaQuery from '../hooks/useMediaQuery';

const delay = (d: string) => ({ '--d': d } as CSSProperties);

// The hub: one ticket per app.
function Home() {
  useDocumentTitle(PAGE_META.hub.title);
  const isPhone = useMediaQuery('(max-width: 767px)');
  useEntrance('home');

  return (
    <>
      <div className="container page-tools appear appear--soft">
        <ThemeToggle />
      </div>
      <main className="container hub">
        <h1 className="hub__title display">
          <MaskLines lines={ [ HUB.title ] } delays={ [ '.1s' ] } />
        </h1>
        <p className="hub__sub appear appear--soft" style={ delay('.25s') }>{ HUB.sub }</p>
        <ul className="app-list appear appear--rise" style={ delay('.35s') }>
          { APPS.map((app) => {
            const icon = <img className="hub-icon" src={ app.iconSrc } alt="" width={ 96 } height={ 96 } />;
            return (
              <li key={ app.slug }>
                <Ticket
                  orientation={ isPhone ? 'v' : 'h' }
                  className="ticket--hub"
                  poster={ isPhone ? undefined : <div className="hub-poster">{ icon }</div> }
                  body={ (
                    <>
                      { isPhone && icon }
                      <h2 className="hub-card__name display">{ app.name }</h2>
                      <p className="hub-card__tagline">{ app.tagline }</p>
                      <p className="hub-card__summary">{ app.summary }</p>
                      <div className="hub-card__actions">
                        <Link className="btn" to={ `/${app.slug}` }>{ HUB.more }</Link>
                        <PlayStoreButton href={ app.playStoreUrl } height={ 40 } eager />
                      </div>
                    </>
                  ) }
                  stub={ isPhone ? (
                    <p className="micro">{ HUB_STUB_LABEL } · { SITE.platform }</p>
                  ) : (
                    <p className="hub-stub">
                      <span className="hub-stub__label display">{ HUB_STUB_LABEL }</span>
                      <span className="micro">{ SITE.platform }</span>
                    </p>
                  ) }
                />
              </li>
            );
          }) }
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}

export default Home;
