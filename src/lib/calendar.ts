// Calendar data shared by the calendar page, event pages and .ics files.
// One-off events and repeating activities come from src/content/events;
// the weekly services come from src/data/site.json so service times live in one place.
import { getCollection, type CollectionEntry } from 'astro:content';
import site from '../data/site.json';

export const TZ = 'Africa/Lagos';

export const categories = [
  { name: 'Weekly activity', key: 'weekly' },
  { name: 'Special meeting', key: 'special' },
  { name: 'Programme', key: 'programme' },
  { name: 'Church event', key: 'church' },
  { name: 'Department meeting', key: 'department' },
] as const;

export const categoryKey = (name: string) => categories.find((c) => c.name === name)?.key ?? 'church';

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...o }).format(d);
/** YYYY-MM-DD in Lagos time. */
export const isoDay = (d: Date) => fmt(d, { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
export const longDate = (d: Date) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const clock = (d: Date) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d);
export const weekdayName = (d: Date) => fmt(d, { weekday: 'long' });
const weekdayIndex = (d: Date) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(weekdayName(d));

export type EventEntry = CollectionEntry<'events'>;

/** Human date line, e.g. "Friday 11 December 2026" or "11–12 December 2026". */
export function dateLine(e: EventEntry) {
  const { start, end } = e.data;
  if (e.data.repeat === 'weekly') return `Every ${weekdayName(start)}`;
  if (!end || isoDay(end) === isoDay(start)) return longDate(start);
  const sameMonth = fmt(start, { month: 'long', year: 'numeric' }) === fmt(end, { month: 'long', year: 'numeric' });
  return sameMonth
    ? `${fmt(start, { day: 'numeric' })}–${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : `${fmt(start, { day: 'numeric', month: 'long' })} – ${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

/** Time line: the `time` field if given, otherwise start (and end) clock times. Null for samples. */
export function timeLine(e: EventEntry) {
  if (e.data.time) return e.data.time;
  if (e.data.sample) return null;
  const { start, end } = e.data;
  return end && isoDay(end) === isoDay(start) ? `${clock(start)} – ${clock(end)}` : clock(start);
}

export interface CalItem {
  id: string;
  title: string;
  category: string;
  key: string;
  href: string;
  time: string | null;
  venue: string | null;
  sample: boolean;
  department?: string;
  /** One-off: first and last day (YYYY-MM-DD). */
  from?: string;
  to?: string;
  /** Weekly: weekday 0–6 (Sunday = 0), first day and optional last day. */
  weekday?: number;
  until?: string;
}

const serviceWeekday = (day: string) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);

export async function getEvents() {
  return (await getCollection('events')).sort((a, b) => +a.data.start - +b.data.start);
}

export async function getCalendarItems(): Promise<CalItem[]> {
  const services: CalItem[] = site.services.map((s) => ({
    id: s.name.toLowerCase().replace(/\s+/g, '-'),
    title: s.name,
    category: 'Weekly activity',
    key: 'weekly',
    href: '/services',
    time: s.time,
    venue: 'GMI, Ojurin, Ashi-Bodija',
    sample: false,
    weekday: serviceWeekday(s.day),
    from: '2000-01-01',
  }));

  const events: CalItem[] = (await getEvents()).map((e) => {
    const base = {
      id: e.id,
      title: e.data.title,
      category: e.data.category,
      key: categoryKey(e.data.category),
      href: `/calendar/${e.id}`,
      time: timeLine(e),
      venue: e.data.venue ?? null,
      sample: e.data.sample,
      department: e.data.department,
      from: isoDay(e.data.start),
    };
    return e.data.repeat === 'weekly'
      ? { ...base, weekday: weekdayIndex(e.data.start), until: e.data.repeatUntil ? isoDay(e.data.repeatUntil) : undefined }
      : { ...base, to: isoDay(e.data.end ?? e.data.start) };
  });

  return [...services, ...events];
}

/** Start and end as Date objects (end defaults to two hours after start). */
export function span(e: EventEntry) {
  const start = e.data.start;
  const end = e.data.end && +e.data.end > +start ? e.data.end : new Date(+start + 2 * 3600 * 1000);
  return { start, end };
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Google Calendar "add event" link. */
export function googleCalendarUrl(e: EventEntry, venue: string, pageUrl: string) {
  const { start, end } = span(e);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.data.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `${e.data.summary ?? ''}\n\n${pageUrl}`.trim(),
    location: venue,
    ctz: TZ,
  });
  if (e.data.repeat === 'weekly') p.set('recur', 'RRULE:FREQ=WEEKLY');
  return `https://calendar.google.com/calendar/render?${p}`;
}

const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);

/** iCalendar file for one event. */
export function toIcs(e: EventEntry, venue: string, pageUrl: string) {
  const { start, end } = span(e);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gloryville Ministries International//Church Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.id}@gloryville`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    ...(e.data.repeat === 'weekly' ? [`RRULE:FREQ=WEEKLY${e.data.repeatUntil ? `;UNTIL=${stamp(e.data.repeatUntil)}` : ''}`] : []),
    `SUMMARY:${icsText(e.data.title)}`,
    `DESCRIPTION:${icsText(`${e.data.summary ?? ''}\n\n${pageUrl}`.trim())}`,
    `LOCATION:${icsText(venue)}`,
    `URL:${pageUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

/** Venue line: the event's venue, or the church address. */
export const venueOf = (e: EventEntry) => e.data.venue ?? `${site.name}, ${site.address.mapsQuery}`;
