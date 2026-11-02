import { CONTACT_EMAIL, DEVELOPER_NAME } from '../data/apps';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <a href={ `mailto:${CONTACT_EMAIL}` }>{ CONTACT_EMAIL }</a>
        <span>© { new Date().getFullYear() } { DEVELOPER_NAME }</span>
      </div>
    </footer>
  );
}

export default SiteFooter;
