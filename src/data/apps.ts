// Single source for every string and link the pages render. The legal documents' names, paths and page labels
// live in src/content/legal/legal.json, which the build scripts read too (scripts/legal-docs.js).
// Phone captures are served from `${screenshotDir}/${key}-{light,dark}-{540,810}.webp`, with a 540x1200
// `${key}-{light,dark}.jpg` fallback (see ShotPicture).
import LEGAL from '../content/legal/legal.json';

export type AppScreenshot = {
  key: string;
  alt: string;
  // Which end of the capture a feature tile's poster shows. The grid window holds only the top ~70-75% of the
  // screen, so a capture whose feature sits low (the N차 list under a ticket detail) shows its bottom instead.
  anchor?: 'top' | 'bottom';
};

// A sample ticket stub: badge or star line, a big number, a small line under it.
type StubBase = {
  badge?: string;
  star?: string;
  sub: string;
};

// The big line is fixed text.
export type FixedStub = StubBase & { value: string };

// The big line is the date `dayOffset` days after today in Korea, drawn as MM.DD when the stub
// renders (see lib/kstDate), so it is never frozen at build or module load.
export type DatedStub = StubBase & { dayOffset: number };

export type AppStub = FixedStub | DatedStub;

// In-page menu entry; `href` is the id of a section on the app page.
export type AppAnchor = {
  href: '#acts' | '#archive' | '#support';
  label: string;
};

// What the act's sample stub does when the act plays (see lib/stubScenes and stage.css):
// countdown: the badge runs D-N, ..., D-1 to the hero stub's badge ('오늘');
// rating: after the show the badge flips over to the star rating, which counts up in half stars.
export type AppActScene = { kind: 'countdown'; from: number } | { kind: 'rating' };

export type AppAct = {
  id: 'booked' | 'curtain' | 'archive';
  label: string;
  titleLines: [string, string];
  body: string;
  points: string[];
  screenshot: AppScreenshot;
  stub: AppStub;
  scene?: AppActScene;
};

// The app's icon for a feature, drawn before its title (components/FeatureIcon).
export type FeatureIconName =
  | 'scan'
  | 'search'
  | 'sameWork'
  | 'wishlist'
  | 'calendar'
  | 'stats'
  | 'reminders'
  | 'tags'
  | 'casting'
  | 'filters'
  | 'photos'
  | 'cost'
  | 'account'
  | 'draft'
  | 'lock'
  | 'twoPane';

export type AppTile = {
  icon: FeatureIconName;
  title: string;
  body: string;
  meta: string;
  screenshot: AppScreenshot;
};

export type AppTileGroup = {
  label: string;
  tiles: AppTile[];
};

// A plain list under the feature tiles: what the app also does, without a screenshot.
export type AppFeatureList = {
  label: string;
  items: { icon: FeatureIconName; title: string; detail: string }[];
};

export type AppInfo = {
  slug: string;
  name: string;
  tagline: string;
  catchphrase: string;
  summary: string;
  iconSrc: string;
  screenshotDir: string;
  playStoreUrl: string;
  // A path on this site ('/yeoun/privacy/') opens in place; anything else is an outside link.
  privacyPolicyUrl: string;
  termsUrl: string;
  // Menu across the top of the app page, in page order.
  nav: AppAnchor[];
  eyebrow: string;
  heroLede: string;
  // Secondary hero button (scrolls to the acts). The hint under the stage ticket is an icon.
  heroMore: string;
  // Decoration only (hidden from screen readers): a ticket for a show tonight.
  heroStub: DatedStub;
  actsEyebrow: string;
  actsHeading: string;
  acts: AppAct[];
  archive: {
    eyebrow: string;
    titleLines: [string, string];
    lede: string;
    groups: AppTileGroup[];
    more: AppFeatureList;
  };
  noticeTitle: string;
  recommendedTitle: string;
  recommendedFor: string[];
  notesTitle: string;
  notes: string[];
  closing: {
    eyebrow: string;
    titleLines: [string, string];
    sub: string;
  };
  closingStub: FixedStub;
};

// Labels shared by every page: skip link, header, Play badge, footer, terms and contact links.
export const SITE = {
  platform: 'Android',
  skipLink: '본문으로 건너뛰기',
  backToHub: '앱 소개',
  pageNavLabel: '페이지 안 이동',
  themeToDark: '다크 모드로 보기',
  themeToLight: '라이트 모드로 보기',
  backToTop: '맨 위로',
  playBadgeAlt: 'Google Play에서 다운로드',
  playTrademark: 'Google Play 및 Google Play 로고는 Google LLC의 상표입니다.',
  privacyPolicy: LEGAL.documents.privacy.name,
  terms: LEGAL.documents.terms.name,
  contact: '문의하기',
};

export const CONTACT_EMAIL = 'hasuidev@gmail.com';

export const YEOUN: AppInfo = {
  slug: 'yeoun',
  name: '여운',
  tagline: '나만의 공연 기록 다이어리',
  catchphrase: '막이 내린 뒤에도, 그 순간은 남는다',
  summary:
    '막이 내린 뒤에도 오래 남는 순간이 있어요. 여운은 그 순간을 티켓 한 장씩 모아 두는 공연 기록 다이어리예요.',
  iconSrc: '/apps/yeoun-icon.png',
  screenshotDir: '/apps/yeoun/screens',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hskim.yeoun',
  // The documents are pages of this site now (src/pages/Legal, src/content/legal), no longer on Notion.
  privacyPolicyUrl: LEGAL.documents.privacy.path,
  termsUrl: LEGAL.documents.terms.path,
  nav: [
    { href: '#acts', label: '주요 기능' },
    { href: '#archive', label: '더 많은 기능' },
    { href: '#support', label: '문의' },
  ],
  eyebrow: '여운 · 공연 기록 다이어리',
  heroLede:
    '관람한 공연의 좌석과 캐스팅, 별점과 감상평을 티켓 한 장에 모아 두세요. 보러 갈 공연은 시작 전에 알려 드려요.',
  heroMore: '주요 기능 보기',
  heroStub: { badge: '오늘', dayOffset: 0, sub: '19:30' },
  actsEyebrow: '주요 기능',
  actsHeading: '공연 하나, 세 장면',
  acts: [
    {
      id: 'booked',
      label: '1막 · 예매한 날',
      titleLines: [ '보러 갈 공연은', '하루씩 다가와요' ],
      body: "관람 예정으로 남긴 공연은 내 티켓 '다가오는 공연'에 모여요. 옆으로 넘기며 D-N과 시작 시각을 확인하세요.",
      points: [
        '공연 시작 전에 공연 알림',
        '시작 시각을 비워 두면 공연 당일 오전 9시에 알림',
        '찜한 공연은 종료 7일 전 낮 12시에 알림',
      ],
      screenshot: {
        key: 'home',
        alt: '여운 내 티켓 화면 — 관람하셨나요?, 다가오는 공연 카드 줄, 지난 기록의 티켓 카드',
      },
      // The same show as the hero ticket (tonight), seen on the day it was booked: the date stays, the badge counts down.
      stub: { badge: 'D-3', dayOffset: 0, sub: '19:30' },
      scene: { kind: 'countdown', from: 3 },
    },
    {
      id: 'curtain',
      label: '2막 · 막이 내린 밤',
      titleLines: [ '막이 내린 밤엔', '별점과 감상평을' ],
      body: "시작 시각이 지난 관람 예정은 '관람하셨나요?'로 다시 보여요. 관람 완료로 바꾸고 0.5점 단위 별점과 감상평, 감상 태그를 남기세요.",
      points: [
        '시작 시각을 넣은 관람 예정은 공연이 끝난 뒤 관람 기록 리마인드',
        '티켓 상세 날짜에는 요일까지: 2026.11.07 (토) 19:30',
        '좌석·캐스팅·티켓 가격도 한 장에',
      ],
      screenshot: {
        key: 'detail',
        alt: '관람 완료 티켓 상세 — 별점, 요일이 붙은 날짜, 장소와 좌석, 캐스팅, 감상평',
      },
      stub: { star: '5.0', dayOffset: 0, sub: '19:30' },
      scene: { kind: 'rating' },
    },
    {
      id: 'archive',
      label: '3막 · 다시 꺼내 보는 날',
      titleLines: [ '지난 기록은', '포스터로 쌓여요' ],
      body: "관람 완료는 '지난 기록'에 달마다 모여요. '포스터로 보기'로 바꾸면 3열 포스터로 한눈에 보고, 같은 작품을 또 보면 N차 관람으로 이어져요.",
      points: [
        '같은 작품의 회차·좌석·캐스팅·별점을 한 목록에',
        '통계에서 여러 번 본 공연과 관람 패턴까지',
        '내 티켓 검색은 감상평·감상 태그·좌석까지 찾아요',
      ],
      screenshot: {
        key: 'archive',
        alt: '내 티켓 관람 완료 — 포스터로 보기, 달마다 포스터 3열',
      },
      // The same ticket again, now filed under '관람 완료' (the tab the archive screenshot shows selected).
      stub: { star: '5.0', dayOffset: 0, sub: '관람 완료' },
    },
  ],
  archive: {
    eyebrow: '더 많은 기능',
    titleLines: [ '공연을 오래 기억하는', '여섯 가지 방법' ],
    lede: '티켓 스캔부터 관람 통계까지, 기록을 돕는 기능 여섯 가지예요.',
    groups: [
      {
        label: '남기고 찾기',
        tiles: [
          {
            icon: 'scan',
            title: '티켓 사진으로 빠르게 기록',
            body: '티켓을 찍거나 예매 내역 화면을 캡처하면 공연명·일시·장소·좌석·티켓 가격을 읽어 빈 칸을 채워요.',
            meta: '인식은 기기 안에서만 해요',
            screenshot: {
              key: 'scan',
              alt: '티켓 스캔으로 공연명·일시·장소·좌석·티켓 가격이 채워진 티켓 추가 화면',
            },
          },
          {
            icon: 'search',
            title: '공연 검색',
            body: '공연명·장소·캐스팅으로 찾아 포스터 2열로 훑어봐요. 공연중·공연예정·공연종료가 포스터 위에 보이고, 찾는 공연이 없으면 직접 기록해요.',
            meta: '검색 탭',
            screenshot: {
              key: 'search',
              alt: '검색 탭 — 포스터 2열 결과와 공연 상태, 찜 하트',
            },
          },
          {
            icon: 'sameWork',
            title: 'N차 관람',
            body: '같은 작품을 다시 보면 회차·좌석·캐스팅·별점을 한 목록에서 견줘 봐요.',
            meta: '티켓 상세 · 이 작품 관람 기록',
            screenshot: {
              key: 'nth',
              alt: '같은 작품의 1차·2차·3차 관람 기록 목록',
              anchor: 'bottom',
            },
          },
        ],
      },
      {
        label: '챙기고 돌아보기',
        tiles: [
          {
            icon: 'wishlist',
            title: '찜한 공연',
            body: "하트로 찜한 공연도 티켓 모양 카드로 모여요. 7일 안에 막을 내리면 스텁에 '종료 D-N'이 붙고, 종료 7일 전 낮 12시에 찜한 공연 종료 알림이 와요.",
            meta: '내 티켓 · 찜',
            screenshot: {
              key: 'wish',
              alt: '찜 카드 — 스텁의 종료 D-4, 관람 예정에 추가하는 연필과 찜에서 빼는 하트',
            },
          },
          {
            icon: 'calendar',
            title: '캘린더',
            body: '월간·주간·전체로 일정을 보고, 날짜 칸에서 그날 공연의 포스터를 확인해요.',
            meta: '캘린더 탭',
            screenshot: {
              key: 'calendar',
              alt: '캘린더 월간 보기 — 날짜 칸에 그날 공연의 포스터',
            },
          },
          {
            icon: 'stats',
            title: '관람 통계',
            body: '관람 횟수와 관람 비용, 자주 본 배우, 가장 많이 본 요일과 주로 보는 시작 시각까지 돌아봐요.',
            meta: '통계 탭',
            screenshot: {
              key: 'stats',
              alt: '관람 통계 — 관람 패턴의 요일·시작 시각 막대와 카테고리별 관람 횟수',
            },
          },
        ],
      },
    ],
    // Checked against the app code (2026-11-21): conditions such as login or 관람 완료 stay in the sentence.
    more: {
      label: '그 밖에도',
      items: [
        {
          icon: 'reminders',
          title: '공연 알림과 관람 기록 리마인드',
          detail: '공연 알림은 시작 15분·30분·1시간 전 중에 고르고, 좌석을 적어 두면 알림에 함께 보여요. 관람 기록 리마인드를 누르면 별점과 감상평을 남기는 화면이 바로 열려요.',
        },
        {
          icon: 'tags',
          title: '감상 태그와 인상 깊은 장면',
          detail: "감정·전율·즐거움·무대·관람 다섯 묶음의 태그 중 3개까지 고르고, 없는 말은 직접 추가해요. 가장 오래 남은 넘버나 장면은 '인상 깊은 장면'에 한 줄로 따로 남겨요.",
        },
        {
          icon: 'casting',
          title: '캐스팅 제안',
          detail: '캐스팅 칸 아래에 같은 작품의 내 기록에 적은 배우와 자주 적은 배우가 칩으로 떠요. 공연 정보와 연결된 기록이면 그 공연의 캐스팅도 함께 떠요.',
        },
        {
          icon: 'filters',
          title: '검색 필터와 선호 지역',
          detail: '검색 탭에서 카테고리, 내한 공연, 공연중·이번 주·이번 달 일정으로 좁혀 봐요. 공연중·공연예정·공연종료 순서 안에서 선호 지역(기본 서울) 공연이 먼저 나와요.',
        },
        {
          icon: 'photos',
          title: '사진 여러 장',
          detail: '기록마다 사진을 3장까지(Premium은 5장) 붙이고, 첫 장이 대표 사진이 돼요. 티켓 상세에서 사진을 누르면 크게 보고, 두 손가락으로 확대해요.',
        },
        {
          icon: 'cost',
          title: '관람 비용 돌아보기',
          detail: "관람 완료 기록에 티켓 가격을 적으면 통계에서 총 지출·평균 티켓가·가장 비싼 티켓을 보여 줘요. '할인가로 구매했어요'를 체크한 관람은 따로 세요.",
        },
        {
          icon: 'account',
          title: '로그인과 기록 옮기기',
          detail: '로그인 없이 남긴 기록은 이 기기에만 저장돼요. Google 계정으로 로그인하면 그 기록을 계정으로 옮길 수 있고, 다른 기기에서도 이어 봐요.',
        },
        {
          icon: 'draft',
          title: '작성 중이던 기록 이어 쓰기',
          detail: '저장하기 전에 앱이 닫혀도 쓰던 기록은 이 기기에 남아, 다시 열면 이어 쓸지 물어요. 로그인한 상태에서 인터넷에 연결되어 있지 않아 저장하지 못한 입력도 남겨 둬요.',
        },
        {
          icon: 'lock',
          title: '앱 잠금',
          detail: '로그인하면 설정에서 4자리 비밀번호로 앱 잠금을 켤 수 있어요. 앱을 새로 열거나 30초 넘게 나갔다 돌아오면 잠기고, 생체 인증이나 비밀번호로 풀어요.',
        },
        {
          icon: 'twoPane',
          title: '넓은 화면에서는 두 칸으로',
          detail: '화면이 넓은 태블릿이나 펼친 폴드형 기기에서는 내 티켓·검색·캘린더를 목록과 상세 두 칸으로 봐요.',
        },
      ],
    },
  },
  noticeTitle: '설치하기 전에',
  recommendedTitle: '이런 분께 추천해요',
  recommendedFor: [
    '공연 티켓을 모으고 기록하는 뮤지컬·연극 팬',
    '관람 후 감상평을 남기고 싶은데 마땅한 앱이 없던 분',
    '예매한 공연을 잊지 않고 챙기고 싶은 분',
    '같은 작품을 여러 번 보고 N차 관람을 정리하고 싶은 분',
  ],
  notesTitle: '이용 안내',
  notes: [
    '로그인 없이도 바로 시작할 수 있어요.',
    '로그인하면 기록이 계정에 보관돼 기기를 바꿔도 이어져요.',
    '로그인하면 4자리 비밀번호로 앱 잠금을 걸 수 있어요.',
    'Premium을 구독하면 광고 없이, 티켓당 사진을 최대 5장까지 남길 수 있어요.',
    '공연 알림·관람 기록 리마인드·찜한 공연 종료 알림은 설정에서 따로 켜고 꺼요.',
    'Android 전용 앱이에요.',
  ],
  closing: {
    eyebrow: '여운 시작하기',
    titleLines: [ '객석의 불이 켜져도', '끝나지 않는 이야기' ],
    sub: '오늘의 감동이 아직 마음에 선명할 때, 여운에 담아 두세요.',
  },
  closingStub: { value: '여운', sub: SITE.platform },
};

export const APPS: AppInfo[] = [ YEOUN ];

export const HUB = {
  title: '앱 소개',
  sub: '앱마다 기능과 약관, 문의처를 한곳에 모았어요.',
  more: '자세히 보기',
};

// Hub stub label, also drawn in the display face.
export const HUB_STUB_LABEL = '공연 기록';

export const NOT_FOUND = {
  title: '페이지를 찾을 수 없어요',
  body: '주소가 바뀌었거나 없는 페이지예요.',
  homeLink: '처음으로',
};

// Every string drawn in the display face. The face is fetched as a `text=` subset,
// so a character missing here would silently fall back to the body sans.
export const DISPLAY_STRINGS: string[] = [
  YEOUN.catchphrase,
  YEOUN.actsHeading,
  ...YEOUN.acts.flatMap((act) => act.titleLines),
  ...YEOUN.archive.titleLines,
  ...YEOUN.closing.titleLines,
  YEOUN.closingStub.value,
  YEOUN.name,
  HUB.title,
  HUB_STUB_LABEL,
  NOT_FOUND.title,
];
