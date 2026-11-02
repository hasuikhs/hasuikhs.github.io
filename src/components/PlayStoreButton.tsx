type PlayStoreButtonProps = {
  href: string;
  variant?: 'primary' | 'secondary';
};

function PlayStoreButton({ href, variant = 'primary' }: PlayStoreButtonProps) {
  return (
    <a
      className={ `button button--${variant}` }
      href={ href }
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg className="button__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
      </svg>
      Google Play에서 받기
    </a>
  );
}

export default PlayStoreButton;
