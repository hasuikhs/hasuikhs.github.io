type PlayStoreButtonProps = {
  href: string;
};

// Official artwork from Google Partner Marketing Hub. Use it unmodified.
const BADGE_SRC = '/badges/google-play-ko.png';

function PlayStoreButton({ href }: PlayStoreButtonProps) {
  return (
    <a
      className="play-badge"
      href={ href }
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className="play-badge__image"
        src={ BADGE_SRC }
        alt="Google Play에서 다운로드"
        width={ 478 }
        height={ 142 }
      />
    </a>
  );
}

export default PlayStoreButton;
