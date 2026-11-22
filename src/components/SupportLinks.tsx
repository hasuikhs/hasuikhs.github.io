import { Link } from 'react-router-dom';

import { CONTACT_EMAIL, SITE } from '../data/apps';
import type { AppInfo } from '../data/apps';

// Terms, account deletion and contact as one compact row (the footer).
type SupportLinksProps = {
  app: AppInfo;
};

type SupportLink = {
  label: string;
  detail?: string;
  href: string;
};

// The documents are pages of this site (a path), opened in place; the contact is a mailto: link.
const isPage = (href: string) => href.startsWith('/');

function SupportLinks({ app }: SupportLinksProps) {
  const links: SupportLink[] = [
    { label: SITE.privacyPolicy, href: app.privacyPolicyUrl },
    { label: SITE.terms, href: app.termsUrl },
    { label: SITE.accountDeletion, href: app.accountDeletionUrl },
    { label: SITE.contact, detail: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  ];

  return (
    <ul className="support-links">
      { links.map((link) => {
        const label = (
          <span className="support-links__label">
            { link.label }
            { link.detail && <span className="support-links__detail"> · { link.detail }</span> }
          </span>
        );
        return (
          <li key={ link.href }>
            { isPage(link.href) ? (
              <Link className="support-links__link" to={ link.href }>{ label }</Link>
            ) : (
              <a className="support-links__link" href={ link.href }>{ label }</a>
            ) }
          </li>
        );
      }) }
    </ul>
  );
}

export default SupportLinks;
