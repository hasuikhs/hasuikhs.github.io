import { Link } from 'react-router-dom';

import PlayStoreButton from '../components/PlayStoreButton';
import SiteFooter from '../components/SiteFooter';
import { APPS } from '../data/apps';
import useDocumentTitle from '../hooks/useDocumentTitle';

function Home() {
  useDocumentTitle('앱 소개');

  return (
    <>
      <main className="container">
        <h1 className="hub-title">앱 소개</h1>
        <ul className="app-list">
          { APPS.map((app) => (
            <li key={ app.slug } className="app-card">
              <img className="app-card__icon" src={ app.iconSrc } alt="" width={ 72 } height={ 72 } />
              <div className="app-card__body">
                <h2 className="app-card__name">{ app.name }</h2>
                <p className="app-card__tagline">{ app.tagline }</p>
                <p className="app-card__summary">{ app.summary }</p>
                <div className="app-card__actions">
                  <Link className="button button--primary" to={ `/${app.slug}` }>자세히 보기</Link>
                  <PlayStoreButton href={ app.playStoreUrl } />
                </div>
              </div>
            </li>
          )) }
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}

export default Home;
