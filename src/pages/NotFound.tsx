import { Link } from 'react-router-dom';

import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

function NotFound() {
  useDocumentTitle('페이지를 찾을 수 없습니다');

  return (
    <>
      <SiteHeader />
      <main className="container not-found">
        <h1 className="not-found__title">페이지를 찾을 수 없습니다</h1>
        <p>주소가 바뀌었거나 없는 페이지예요.</p>
        <Link className="button button--primary" to="/">처음으로</Link>
      </main>
      <SiteFooter />
    </>
  );
}

export default NotFound;
