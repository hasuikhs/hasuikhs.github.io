import { CONTACT_EMAIL } from '../data/apps';
import type { AppInfo } from '../data/apps';

type SupportLinksProps = {
  app: AppInfo;
  // 'list' = tappable rows with a hint arrow, 'inline' = compact footer row.
  variant: 'list' | 'inline';
};

type SupportLink = {
  label: string;
  detail?: string;
  href: string;
  external: boolean;
};

function SupportLinks({ app, variant }: SupportLinksProps) {
  const links: SupportLink[] = [
    { label: '개인정보처리방침', href: app.privacyPolicyUrl, external: true },
    { label: '이용약관', href: app.termsUrl, external: true },
    { label: '문의하기', detail: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
  ];

  return (
    <ul className={ `support-links support-links--${variant}` }>
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
            { variant === 'list' && (
              <span className="support-links__hint" aria-hidden="true">{ link.external ? '↗' : '→' }</span>
            ) }
          </a>
        </li>
      )) }
    </ul>
  );
}

export default SupportLinks;
