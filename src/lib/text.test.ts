import { joinDots } from './text';

test('a middle dot stays on the line of the word before it', () => {
  expect(joinDots('내 티켓·검색·캘린더')).toBe('내 티켓⁠·검색⁠·캘린더');
  expect(joinDots('티켓 상세 · 이 작품')).toBe('티켓 상세 · 이 작품');
  expect(joinDots('점 없음')).toBe('점 없음');
});
