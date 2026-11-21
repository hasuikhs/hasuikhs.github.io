// Dates on the sample stubs follow the calendar in Korea, whatever the visitor's own time zone:
// the year, month and day come from Intl in Asia/Seoul, and day sums run on UTC dates, so
// neither the device clock's zone nor its daylight saving can shift them.
export type CivilDate = { year: number; month: number; day: number };

const TIME_ZONE = 'Asia/Seoul';

let formatter: Intl.DateTimeFormat | null = null;
const seoulFormatter = () => {
  formatter ??= new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  return formatter;
};

// Today's date in Korea at the instant `now`.
export function kstToday(now: Date): CivilDate {
  const parts = seoulFormatter().formatToParts(now);
  const part = (type: 'year' | 'month' | 'day') => Number(parts.find((p) => p.type === type)?.value);
  return { year: part('year'), month: part('month'), day: part('day') };
}

// The calendar date `days` days after `date` (month and year ends and leap days included).
export function addDays(date: CivilDate, days: number): CivilDate {
  const sum = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: sum.getUTCFullYear(), month: sum.getUTCMonth() + 1, day: sum.getUTCDate() };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

// 'MM.DD' of today in Korea plus `dayOffset` days: the stub date format of the app.
export function kstStubDate(dayOffset: number, now: Date = new Date()): string {
  const { month, day } = addDays(kstToday(now), dayOffset);
  return `${pad2(month)}.${pad2(day)}`;
}
