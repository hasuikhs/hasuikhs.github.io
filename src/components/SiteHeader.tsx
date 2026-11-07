import { Link } from 'react-router-dom';

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand">← 앱 소개</Link>
      </div>
    </header>
  );
}

export default SiteHeader;
