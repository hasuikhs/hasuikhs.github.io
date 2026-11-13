import SupportLinks from './SupportLinks';
import { YEOUN } from '../data/apps';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <SupportLinks app={ YEOUN } variant="inline" />
        <p className="site-footer__legal">Google Play 및 Google Play 로고는 Google LLC의 상표입니다.</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
