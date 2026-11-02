import { Link } from 'react-router-dom';

import { DEVELOPER_NAME } from '../data/apps';

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand">{ DEVELOPER_NAME }</Link>
      </div>
    </header>
  );
}

export default SiteHeader;
