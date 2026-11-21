import { Link, Navigate, useParams } from 'react-router-dom';

import BackToTop from '../components/BackToTop';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { SITE } from '../data/apps';
import PAGE_META from '../data/pageMeta.json';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { LEGAL_APP, LEGAL_DOC_KEYS, LEGAL_LABELS, fill, formatDate, legalContent, legalDoc } from '../lib/legal';
import type { LegalDoc, LegalDocKey, LegalVersion } from '../lib/legal';
import NotFound from './NotFound';

// The served HTML of each route has its own title (pageMeta.json); the page sets the same one.
const titleOf = (path: string) =>
  Object.values(PAGE_META).find((page) => 'path' in page && page.path === path)?.title;

type LegalPageProps = {
  doc: LegalDoc;
  version: LegalVersion;
  title: string;
  html: string;
};

// One version of a document. The version links switch by route; this component (and so the link with focus
// on it) stays mounted across the switch, and the notice slot (a status region, there on every version) reads
// out that an earlier one is showing.
function LegalPage({ doc, version, title, html }: LegalPageProps) {
  useDocumentTitle(titleOf(version.path) ?? `${LEGAL_APP.name} ${doc.name}`);
  const [ current ] = doc.versions;
  const others = LEGAL_DOC_KEYS.filter((key) => key !== doc.key).map(legalDoc);

  return (
    <>
      <a className="skip-link" href="#main">{ SITE.skipLink }</a>
      <SiteHeader
        back={ { to: LEGAL_APP.path, label: LEGAL_APP.backLabel } }
        entrance={ false }
        className="site-header--text"
      />
      <main id="main" className="container legal">
        <div className="legal__notice" role="status">
          { !version.current && (
            <p className="legal-notice">
              <strong>{ LEGAL_LABELS.previous }</strong>{ ' ' }
              <span>{ fill(LEGAL_LABELS.previousDetail, { name: doc.name, date: formatDate(current.date) }) }</span>{ ' ' }
              <Link to={ current.path }>{ fill(LEGAL_LABELS.toCurrent, { name: doc.name }) }</Link>
            </p>
          ) }
        </div>
        <article className="legal-doc">
          <h1 className="legal-doc__title">{ title }</h1>
          { /* The same markup as the served HTML (scripts/legal-docs.js staticMarkup), so nothing moves when the
               script takes over. Links, not a select: arrow keys never switch the version. */ }
          <div className="legal-doc__tools">
            <div className="legal-doc__versions" role="group" aria-labelledby="legal-versions-label">
              <span className="legal-doc__label" id="legal-versions-label">{ LEGAL_LABELS.version }</span>
              <span className="legal-doc__version-links">
                { doc.versions.map((option) => (
                  <Link
                    key={ option.date }
                    to={ option.path }
                    aria-current={ option.path === version.path ? 'page' : undefined }
                  >
                    { option.label }
                  </Link>
                )) }
              </span>
            </div>
            { others.map((other) => (
              <Link key={ other.key } className="legal-doc__other" to={ other.path }>
                { fill(LEGAL_LABELS.toOther, { name: other.name }) }
              </Link>
            )) }
          </div>
          { /* Rendered from the markdown at build time (scripts/legal-docs.js), every text escaped there. */ }
          <div className="legal-doc__body" dangerouslySetInnerHTML={ { __html: html } } />
        </article>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}

type LegalProps = {
  doc: LegalDocKey;
};

// /yeoun/terms/ is the version in force, /yeoun/terms/2026-11-10/ an earlier one. The newest version's own date
// goes to the plain path; a date that is not a version is not found.
function Legal({ doc: key }: LegalProps) {
  const { version: date } = useParams();
  const doc = legalDoc(key);
  const [ current ] = doc.versions;
  if (date === current.date) {
    return <Navigate to={ current.path } replace />;
  }
  const version = date === undefined ? current : doc.versions.find((candidate) => candidate.date === date);
  const content = version && legalContent(key, version.date);
  if (!version || !content) {
    return <NotFound />;
  }
  return <LegalPage doc={ doc } version={ version } title={ content.title } html={ content.blocks.join('') } />;
}

export default Legal;
