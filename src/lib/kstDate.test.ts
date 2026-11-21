import { addDays, kstStubDate, kstToday } from './kstDate';

// Korea is UTC+9 all year, so a Korean day starts at 15:00 UTC on the day before.
const at = (iso: string) => new Date(iso);

describe('kstToday', () => {
  test('a Korean day turns over at 15:00 UTC', () => {
    expect(kstToday(at('2026-11-19T14:59:59.999Z'))).toEqual({ year: 2026, month: 11, day: 19 });
    expect(kstToday(at('2026-11-19T15:00:00.000Z'))).toEqual({ year: 2026, month: 11, day: 20 });
  });

  test('follows Korea, not the zone the device runs in', () => {
    // Tests run in America/Los_Angeles (scripts/jest-global-setup.js): 2026-11-19 23:30 there is
    // already 11-20 16:30 in Korea, so a date read off the device clock is a day behind here.
    const now = at('2026-11-20T07:30:00Z');
    expect(now.getDate()).toBe(19); // the test zone really is not Korea's
    expect(kstToday(now)).toEqual({ year: 2026, month: 11, day: 20 });
    expect(kstStubDate(3, now)).toBe('11.23');
  });
});

describe('addDays', () => {
  test('crosses month and year ends', () => {
    expect(addDays({ year: 2026, month: 11, day: 30 }, 1)).toEqual({ year: 2026, month: 12, day: 1 });
    expect(addDays({ year: 2026, month: 12, day: 30 }, 3)).toEqual({ year: 2027, month: 1, day: 2 });
  });

  test('knows leap years', () => {
    expect(addDays({ year: 2028, month: 2, day: 28 }, 1)).toEqual({ year: 2028, month: 2, day: 29 });
    expect(addDays({ year: 2028, month: 2, day: 29 }, 1)).toEqual({ year: 2028, month: 3, day: 1 });
    expect(addDays({ year: 2027, month: 2, day: 28 }, 1)).toEqual({ year: 2027, month: 3, day: 1 });
  });
});

describe('kstStubDate', () => {
  test('just before and just after midnight in Korea', () => {
    const before = at('2026-11-19T14:59:59Z'); // 11-19 23:59:59 in Korea
    const after = at('2026-11-19T15:00:00Z'); // 11-20 00:00:00 in Korea
    expect(kstStubDate(0, before)).toBe('11.19');
    expect(kstStubDate(3, before)).toBe('11.22');
    expect(kstStubDate(0, after)).toBe('11.20');
    expect(kstStubDate(3, after)).toBe('11.23');
  });

  test('carries over the month and the year: 12.30 + 3 is 01.02', () => {
    const now = at('2026-12-30T03:00:00Z'); // 12-30 12:00 in Korea
    expect(kstStubDate(0, now)).toBe('12.30');
    expect(kstStubDate(3, now)).toBe('01.02');
    // 12-31 23:59 in Korea is still the last day of the year; a second later it is 01.01.
    expect(kstStubDate(0, at('2026-12-31T14:59:59Z'))).toBe('12.31');
    expect(kstStubDate(0, at('2026-12-31T15:00:00Z'))).toBe('01.01');
    expect(kstStubDate(3, at('2026-01-30T03:00:00Z'))).toBe('02.02');
  });

  test('leap years: 2.28 and 2.29', () => {
    expect(kstStubDate(1, at('2028-02-28T03:00:00Z'))).toBe('02.29');
    expect(kstStubDate(0, at('2028-02-28T15:00:00Z'))).toBe('02.29'); // 02-29 00:00 in Korea
    expect(kstStubDate(3, at('2028-02-28T03:00:00Z'))).toBe('03.02');
    expect(kstStubDate(1, at('2028-02-29T03:00:00Z'))).toBe('03.01');
    expect(kstStubDate(1, at('2027-02-28T03:00:00Z'))).toBe('03.01');
    expect(kstStubDate(3, at('2027-02-27T03:00:00Z'))).toBe('03.02');
  });
});
