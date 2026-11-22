import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import App from '../App';
import PAGE_META from '../data/pageMeta.json';
import { ACCOUNT_DELETION, accountDeletionContent, legalContent, legalDoc } from '../lib/legal';
import { staticMarkup } from '../../scripts/legal-docs';

// The page Google Play links to for deleting a Yeoun account without the app (src/content/legal/account-deletion.md).
const PATH = '/yeoun/account-deletion/';
const EMAIL = 'hasuidev@gmail.com';

function LocationProbe() {
  const { pathname } = useLocation();
  return <output data-testid="location">{ pathname }</output>;
}

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={ [ path ] }>
    <App />
    <LocationProbe />
  </MemoryRouter>,
);

// A node as markup with its attributes sorted (React and the build script write them in different orders).
const canonical = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return JSON.stringify(node.textContent);
  }
  if (!(node instanceof Element)) {
    return '';
  }
  const attrs = Array.from(node.attributes).map((attr) => `${attr.name}=${JSON.stringify(attr.value)}`).sort();
  return `<${[ node.localName, ...attrs ].join(' ')}>${Array.from(node.childNodes).map(canonical).join('')}</${node.localName}>`;
};

const mainText = () => (screen.getByRole('main').textContent ?? '').replace(/⁠/g, '');

beforeEach(() => {
  jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('lives at /yeoun/account-deletion/, with or without the trailing slash, under the title its served HTML has', () => {
  expect(ACCOUNT_DELETION.path).toBe(PATH);
  expect(PAGE_META.yeounAccountDeletion).toMatchObject({ path: PATH, file: 'yeoun/account-deletion/index.html', title: '여운 계정 삭제' });
  [ PATH, PATH.replace(/\/$/, '') ].forEach((path) => {
    const { unmount } = renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name: '여운 계정 삭제' })).toBeInTheDocument();
    expect(document.title).toBe(PAGE_META.yeounAccountDeletion.title);
    unmount();
  });
});

test('names the app and gives both ways to delete: in the app, and by mail without it', () => {
  renderAt(PATH);
  const article = within(screen.getByRole('main')).getByRole('article');
  expect(within(article).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
    '앱에서 탈퇴하기',
    '앱 없이 삭제 요청하기',
    '구독 중이라면',
    '삭제되는 데이터',
    '남는 데이터와 보관 기간',
    '계정은 두고 일부만 지우기',
    '문의',
  ]);
  const text = mainText();
  expect(text).toContain('Google Play 앱 여운(Yeoun)');
  // In the app: the path, then who confirms with a password and who with Google.
  expect(within(article).getByText('설정 → 회원 탈퇴').tagName).toBe('STRONG');
  expect(text).toContain('비밀번호를 입력해 본인 확인을 해요');
  expect(text).toContain('비밀번호가 없는 계정(Google 계정으로 가입한 계정 등)은 Google 계정으로 다시 인증해요');
  // Without it: where to write, from which address, what happens next. No deadline in days (the policy gives none).
  expect(text).toContain('메일 제목: 계정 삭제 요청');
  expect(text).toContain('본인 확인을 위해 꼭 가입한 이메일 주소에서 보내 주세요');
  expect(text).toContain('지체 없이 삭제하고, 처리 결과를 그 주소로 회신해요');
  expect(text).not.toMatch(/\d+ ?일 ?(이내|안에|내에|만에)|영업일/);
  const mails = within(article).getAllByRole('link', { name: EMAIL });
  expect(mails.length).toBeGreaterThanOrEqual(2);
  mails.forEach((link) => expect(link).toHaveAttribute('href', `mailto:${EMAIL}`));
});

test('says what is deleted, what is kept and for how long', () => {
  renderAt(PATH);
  const article = within(screen.getByRole('main')).getByRole('article');
  // The bullet lists in order: the mail to write, what is deleted, what is kept.
  const [ , deleted, kept ] = within(article).getAllByRole('list').filter((list) => list.tagName === 'UL');
  expect(within(deleted).getAllByRole('listitem').map((item) => (item.textContent ?? '').replace(/⁠/g, ''))).toEqual([
    '계정 정보(이메일 주소·이름 등)',
    '서버에 저장된 관람 기록과 첨부 이미지',
    '찜 목록',
    '알림 설정',
    '푸시 알림 토큰',
    '서버에 저장된 구독 정보',
    '소셜 로그인(Google 계정) 연결 정보',
  ]);
  const keptText = (kept.textContent ?? '').replace(/⁠/g, '');
  expect(keptText).toContain('1년간 보관한 뒤 파기해요');
  expect(keptText).toContain('탈퇴하면 계정과의 연결은 바로 끊어요');
  expect(keptText).toContain('Google Play가 처리하고 보관해요');
  expect(keptText).toContain('보관 기간은 Google 각 서비스의 정책을 따라요');
  expect(keptText).toContain('앱을 삭제하면 함께 지워져요');
  expect(mainText()).toContain('삭제한 데이터는 되돌릴 수 없어요');
  expect(mainText()).toContain('Premium 구독은 탈퇴나 앱 삭제만으로 해지되지 않아요');
});

// Every fact the page restates is the privacy policy's (or the terms') in force. When a new version changes one,
// this fails, so the page is read again against it.
test('restates only what the privacy policy and the terms in force say', () => {
  const policy = (legalContent('privacy', legalDoc('privacy').versions[0].date)?.blocks.join('') ?? '').replace(/⁠/g, '');
  const terms = (legalContent('terms', legalDoc('terms').versions[0].date)?.blocks.join('') ?? '').replace(/⁠/g, '');
  [
    '탈퇴 시 지체 없이 파기합니다',
    '탈퇴는 앱 내 설정에서 비밀번호 확인(비밀번호가 없는 계정은 Google 계정 재인증) 후 직접 할 수 있으며',
    '계정 정보와 서버에 저장된 관람 기록·이미지·찜·푸시 토큰·소셜 로그인 연결 정보가 삭제됩니다',
    '알림 설정, 푸시 토큰, 구독 정보, 소셜 로그인 연결 정보, 접속기록',
    '1년간 보관한 뒤 파기하며, 회원 탈퇴 시에는 계정과의 연결을 즉시 해제합니다',
    '구독 결제 내역(결제·환불 기록)은 Google Play가 처리·보관하며, 개발자 서버의 구독 정보는 탈퇴 시 즉시 삭제됩니다',
    '게스트 모드 데이터와 티켓 스캔 인식 모델은 기기에만 존재하며, 앱 삭제 시 함께 삭제됩니다',
    'Google Firebase Analytics가 앱 인스턴스 ID, 화면 조회·앱 실행 등 사용 통계를 자동 수집할 수 있습니다',
    '각 서비스 정책에 따름',
    '<strong>삭제·탈퇴</strong>: 설정 → 회원 탈퇴에서',
    '개인정보 관련 문의·불만·피해구제는 위 연락처로',
    `<a href="mailto:${EMAIL}">${EMAIL}</a>`,
  ].forEach((phrase) => expect({ phrase, inPolicy: policy.includes(phrase) }).toEqual({ phrase, inPolicy: true }));
  [
    '삭제된 데이터는 복구할 수 없습니다',
    '앱 삭제나 회원 탈퇴만으로는 구독이 해지되지 않습니다',
  ].forEach((phrase) => expect({ phrase, inTerms: terms.includes(phrase) }).toEqual({ phrase, inTerms: true }));
});

test('links back to the app page and to the privacy policy, under the site header and footer', () => {
  renderAt(PATH);
  const header = screen.getByRole('banner');
  expect(within(header).getByRole('link', { name: '여운 소개' })).toHaveAttribute('href', '/yeoun/');
  expect(within(header).queryByRole('navigation')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '본문으로 건너뛰기' })).toHaveAttribute('href', '#main');
  const main = screen.getByRole('main');
  expect(main).toHaveAttribute('id', 'main');
  // Not a dated document: no versions, no earlier-version notice.
  expect(within(main).queryByRole('group', { name: '시행일' })).not.toBeInTheDocument();
  expect(within(main).queryByRole('status')).not.toBeInTheDocument();
  const footer = screen.getByRole('contentinfo');
  expect(within(footer).getByRole('link', { name: '계정 삭제' })).toHaveAttribute('href', PATH);
  fireEvent.click(within(main).getByRole('link', { name: '개인정보처리방침 보기' }));
  expect(screen.getByTestId('location').textContent).toBe('/yeoun/privacy/');
  expect(screen.getByRole('heading', { level: 1, name: '여운(Yeoun) 개인정보처리방침' })).toBeInTheDocument();
});

test('the page draws the same main as the served HTML, so nothing moves when the script starts', () => {
  renderAt(PATH);
  const holder = document.createElement('div');
  holder.innerHTML = staticMarkup(PATH);
  expect(canonical(screen.getByRole('main'))).toBe(canonical(within(holder).getByRole('main')));
  expect(screen.getByRole('article').innerHTML).toContain(accountDeletionContent.blocks.join(''));
});

test('the footer links here from every page; the hub and the app page keep it out of their main', () => {
  [ '/', '/yeoun', '/yeoun/terms/', '/yeoun/privacy/', '/nope' ].forEach((path) => {
    const { unmount } = renderAt(path);
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: '계정 삭제' })).toHaveAttribute('href', PATH);
    const main = screen.getByRole('main');
    expect(within(main).queryByRole('link', { name: '계정 삭제' })).not.toBeInTheDocument();
    unmount();
  });
  renderAt('/yeoun');
  fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: '계정 삭제' }));
  expect(screen.getByTestId('location').textContent).toBe(PATH);
  expect(screen.getByRole('heading', { level: 1, name: '여운 계정 삭제' })).toBeInTheDocument();
});

test('draws no app version number, developer handle or developer name', () => {
  renderAt(PATH);
  const text = document.body.textContent ?? '';
  expect(text).not.toMatch(/(^|[^\d.])\d{1,2}\.\d{1,2}\.\d{1,3}(?![\d.])|버전 ?\d|새 버전/);
  expect(text).not.toMatch(/khasui|1인 개발자|김한석/);
  expect(staticMarkup(PATH)).not.toMatch(/khasui|김한석/);
  expect(`${PAGE_META.yeounAccountDeletion.title} ${PAGE_META.yeounAccountDeletion.description}`).not.toMatch(/khasui|김한석/);
});
