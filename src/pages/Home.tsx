import { Link } from 'react-router-dom';

import PlayStoreButton from '../components/PlayStoreButton';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { APPS, DEVELOPER_NAME } from '../data/apps';
import useDocumentTitle from '../hooks/useDocumentTitle';

function Home() {
  useDocumentTitle(DEVELOPER_NAME);

  return (
    <>
      <SiteHeader />
      <main className="container">
        <section className="intro">
          <h1 className="intro__title">{ DEVELOPER_NAME }</h1>
          <p className="intro__text">1인 개발자 { DEVELOPER_NAME }가 만드는 앱을 소개합니다.</p>
        </section>

        <section className="section" aria-labelledby="apps-heading">
          <h2 id="apps-heading" className="section__title">앱</h2>
          <ul className="app-list">
            { APPS.map((app) => (
              <li key={ app.slug } className="app-card">
                <img className="app-card__icon" src={ app.iconSrc } alt="" width={ 72 } height={ 72 } />
                <div className="app-card__body">
                  <h3 className="app-card__name">{ app.name }</h3>
                  <p className="app-card__tagline">{ app.tagline }</p>
                  <p className="app-card__summary">{ app.summary }</p>
                  <div className="app-card__actions">
                    <Link className="button button--primary" to={ `/${app.slug}` }>자세히 보기</Link>
                    <PlayStoreButton href={ app.playStoreUrl } variant="secondary" />
                  </div>
                </div>
              </li>
            )) }
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export default Home;
