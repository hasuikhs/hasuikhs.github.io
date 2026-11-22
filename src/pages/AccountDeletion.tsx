import { Link } from 'react-router-dom';

import BackToTop from '../components/BackToTop';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { SITE } from '../data/apps';
import PAGE_META from '../data/pageMeta.json';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { LEGAL_APP, LEGAL_LABELS, accountDeletionContent, fill, legalDoc } from '../lib/legal';

// How to delete a Yeoun account and its data, in the app or by mail without it: the page Google Play's account
// deletion policy links to. The text is src/content/legal/account-deletion.md, rendered at build time; the served
// HTML holds the same markup (scripts/legal-docs.js accountDeletionMarkup), so it reads without JavaScript.
function AccountDeletion() {
  useDocumentTitle(PAGE_META.yeounAccountDeletion.title);
  const privacy = legalDoc('privacy');

  return (
    <>
      <a className="skip-link" href="#main">{ SITE.skipLink }</a>
      <SiteHeader
        back={ { to: LEGAL_APP.path, label: LEGAL_APP.backLabel } }
        entrance={ false }
        className="site-header--text"
      />
      <main id="main" className="container legal">
        <article className="legal-doc legal-doc--guide">
          <h1 className="legal-doc__title">{ accountDeletionContent.title }</h1>
          { /* The policy this page restates, where the documents link to each other. */ }
          <div className="legal-doc__tools">
            <Link className="legal-doc__other" to={ privacy.path }>
              { fill(LEGAL_LABELS.toOther, { name: privacy.name }) }
            </Link>
          </div>
          { /* Rendered from the markdown at build time (scripts/legal-docs.js), every text escaped there. */ }
          <div className="legal-doc__body" dangerouslySetInnerHTML={ { __html: accountDeletionContent.blocks.join('') } } />
        </article>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}

export default AccountDeletion;
