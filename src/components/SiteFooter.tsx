import { CONTACT_EMAIL } from '../data/apps';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <a href={ `mailto:${CONTACT_EMAIL}` }>{ CONTACT_EMAIL }</a>
        <p className="site-footer__legal">Google Play 및 Google Play 로고는 Google LLC의 상표입니다.</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
