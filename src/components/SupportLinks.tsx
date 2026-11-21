import { CONTACT_EMAIL, SITE } from '../data/apps';
import type { AppInfo } from '../data/apps';

// Terms and contact as one compact row (the footer).
type SupportLinksProps = {
  app: AppInfo;
};

type SupportLink = {
  label: string;
  detail?: string;
  href: string;
  external: boolean;
};

function SupportLinks({ app }: SupportLinksProps) {
  const links: SupportLink[] = [
    { label: SITE.privacyPolicy, href: app.privacyPolicyUrl, external: true },
    { label: SITE.terms, href: app.termsUrl, external: true },
    { label: SITE.contact, detail: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
  ];

  return (
    <ul className="support-links">
      { links.map((link) => (
        <li key={ link.href }>
          <a
            className="support-links__link"
            href={ link.href }
            target={ link.external ? '_blank' : undefined }
            rel="noopener noreferrer"
          >
            <span className="support-links__label">
              { link.label }
              { link.detail && <span className="support-links__detail"> · { link.detail }</span> }
            </span>
          </a>
        </li>
      )) }
    </ul>
  );
}

export default SupportLinks;
