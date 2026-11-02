import PlayStoreButton from '../components/PlayStoreButton';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { CONTACT_EMAIL, YEOUN } from '../data/apps';
import useDocumentTitle from '../hooks/useDocumentTitle';

function Yeoun() {
  useDocumentTitle(`${YEOUN.name} — ${YEOUN.tagline}`);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="container hero__inner">
            <img className="hero__icon" src={ YEOUN.iconSrc } alt="" width={ 112 } height={ 112 } />
            <h1 className="hero__title">{ YEOUN.name }</h1>
            <p className="hero__tagline">{ YEOUN.tagline }</p>
            <span className="hero__divider" aria-hidden="true" />
            <p className="hero__catchphrase">{ YEOUN.catchphrase }</p>
            <p className="hero__summary">{ YEOUN.summary }</p>
            <PlayStoreButton href={ YEOUN.playStoreUrl } />
          </div>
        </section>

        <div className="container">
          <section className="section" aria-labelledby="features-heading">
            <h2 id="features-heading" className="section__title">주요 기능</h2>
            <ul className="feature-grid">
              { YEOUN.features.map((feature) => (
                <li key={ feature.title } className="feature-card">
                  <span className="feature-card__icon" aria-hidden="true">{ feature.icon }</span>
                  <h3 className="feature-card__title">{ feature.title }</h3>
                  <ul className="feature-card__items">
                    { feature.items.map((item) => <li key={ item }>{ item }</li>) }
                  </ul>
                </li>
              )) }
            </ul>
          </section>

          <section className="section" aria-labelledby="recommend-heading">
            <h2 id="recommend-heading" className="section__title">이런 분께 추천해요</h2>
            <ul className="check-list">
              { YEOUN.recommendedFor.map((item) => <li key={ item }>{ item }</li>) }
            </ul>
          </section>

          <section className="section notes" aria-label="이용 안내">
            { YEOUN.notes.map((note) => <p key={ note }>{ note }</p>) }
          </section>

          <section className="section" aria-labelledby="support-heading">
            <h2 id="support-heading" className="section__title">약관 및 문의</h2>
            <ul className="link-list">
              <li>
                <a href={ YEOUN.privacyPolicyUrl } target="_blank" rel="noopener noreferrer">개인정보처리방침</a>
              </li>
              <li>
                <a href={ YEOUN.termsUrl } target="_blank" rel="noopener noreferrer">이용약관</a>
              </li>
              <li>
                <a href={ `mailto:${CONTACT_EMAIL}` }>문의하기 · { CONTACT_EMAIL }</a>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default Yeoun;
