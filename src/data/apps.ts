export type AppFeature = {
  icon: string;
  title: string;
  items: string[];
};

export type AppInfo = {
  slug: string;
  name: string;
  tagline: string;
  catchphrase: string;
  summary: string;
  iconSrc: string;
  playStoreUrl: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  features: AppFeature[];
  recommendedFor: string[];
  notes: string[];
};

export const CONTACT_EMAIL = 'hasuidev@gmail.com';

export const YEOUN: AppInfo = {
  slug: 'yeoun',
  name: '여운',
  tagline: '나만의 공연 기록 다이어리',
  catchphrase: '막이 내린 뒤에도, 그 순간은 남는다',
  summary:
    '막이 내린 뒤에도 마음에 오래 남는 순간들이 있습니다. 여운은 그 순간들을 모아두는 개인 공연 기록 다이어리입니다.',
  iconSrc: '/apps/yeoun-icon.png',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hskim.yeoun',
  privacyPolicyUrl:
    'https://app.notion.com/p/Yeoun-372be8bbcaba80089211c1460e4e128d?source=copy_link',
  termsUrl:
    'https://app.notion.com/p/Yeoun-3a5be8bbcaba807f81ddd02ac9335575?source=copy_link',
  features: [
    {
      icon: '🎭',
      title: '관람한 공연을 나만의 방식으로',
      items: [
        '포스터 사진과 함께 공연명, 일시, 공연장을 저장',
        '좌석 번호, 출연진(캐스팅)까지 상세하게',
        '별점(0.5 단위)과 감상평으로 그날의 감동을 기록',
        '뮤지컬, 연극, 콘서트, 클래식, 전시까지 카테고리별 정리',
        '포스터를 크게 보는 2열 보기와 월별 구분선으로 내 티켓을 한눈에',
      ],
    },
    {
      icon: '📷',
      title: '티켓 사진으로 빠르게 기록',
      items: [
        '티켓을 찍으면 공연명, 일시, 장소, 좌석, 가격을 읽어 빈 칸을 자동 입력',
        '앨범의 티켓 사진이나 예매 내역 화면 캡처로도 입력',
        '읽은 정보로 공연 후보를 찾아 고르면 공연 정보에 바로 연결',
        '사진은 기기 안에서만 처리하고 인식이 끝나면 바로 삭제',
      ],
    },
    {
      icon: '🔔',
      title: '관람 예정 공연은 잊지 않게',
      items: [
        '보러 갈 공연을 미리 등록하면 시작 전에 알림',
        '예매해두고 놓치는 공연이 없도록',
      ],
    },
    {
      icon: '🔍',
      title: '공연 탐색과 찜',
      items: [
        '진행 중인 공연을 검색하고 마음에 드는 공연은 찜',
        '관람 후에는 바로 기록으로 전환',
      ],
    },
    {
      icon: '📅',
      title: '캘린더로 한눈에',
      items: ['월간·주간·리스트 3가지 뷰로 관람 일정을 관리'],
    },
    {
      icon: '📊',
      title: '나의 관람 통계',
      items: [
        '기간별 관람 횟수, 카테고리 비율, 관람 비용까지',
        '숫자로 돌아보는 나의 공연 생활',
      ],
    },
  ],
  recommendedFor: [
    '공연 티켓을 모으고 기록하는 뮤지컬·연극 팬',
    '관람 후 감상을 남기고 싶은데 마땅한 앱이 없던 분',
    '예매한 공연을 잊지 않고 챙기고 싶은 분',
  ],
  notes: [
    '로그인 없이도 바로 시작할 수 있어요.',
    '로그인하면 기록이 계정에 안전하게 보관되어 기기를 바꿔도 이어집니다.',
    '프리미엄 구독 시 광고 없이, 공연당 최대 5장의 사진과 함께 더 풍성하게 기록할 수 있습니다.',
  ],
};

export const APPS: AppInfo[] = [YEOUN];
