function formatDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateICS(event: {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
}): string {
  const uid = `${event.id}@cse-alumni`;
  const dtstart = formatDate(new Date(event.starts_at));
  const dtend = formatDate(new Date(event.ends_at));
  const now = formatDate(new Date());
  const summary = event.title.replace(/\n/g, '\\n');
  const description = (event.description ?? '').replace(/<[^>]+>/g, '').replace(/\n/g, '\\n').slice(0, 500);
  const location = event.location ?? '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CSE Alumni Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
