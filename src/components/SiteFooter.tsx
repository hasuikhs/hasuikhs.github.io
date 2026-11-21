import SupportLinks from './SupportLinks';
import { SITE, YEOUN } from '../data/apps';

function SiteFooter() {
  return (
    // The menu's '문의' (#support) scrolls here: terms and contact live only in the footer.
    <footer className="site-footer" id="support">
      <div className="container site-footer__inner">
        <SupportLinks app={ YEOUN } />
        <p className="site-footer__legal">{ SITE.playTrademark }</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
