import Link from 'next/link';
import { MapPin, Video, Monitor, Calendar } from 'lucide-react';

export type EventItem = {
  id: string;
  title: string;
  category: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  capacity: number | null;
  confirmed_count: number;
  is_paid: boolean;
  price: number | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  reunion: 'bg-brand',
  networking: 'bg-blue-500',
  webinar: 'bg-purple-500',
  workshop: 'bg-amber-500',
  sports: 'bg-orange-500',
  cultural: 'bg-pink-500',
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
  reunion: 'bg-brand',
  networking: 'bg-blue-500',
  webinar: 'bg-purple-500',
  workshop: 'bg-amber-500',
  sports: 'bg-orange-500',
  cultural: 'bg-pink-500',
};

function getStatus(event: EventItem): 'open' | 'full' | 'closed' {
  const now = new Date();
  if (new Date(event.ends_at) < now) return 'closed';
  if (event.capacity != null && event.confirmed_count >= event.capacity) return 'full';
  return 'open';
}

const STATUS_CLASSES = {
  open: 'bg-brand/10 text-brand border border-brand/30',
  full: 'bg-warning/10 text-warning border border-warning/30',
  closed: 'bg-surface-300 text-foreground-lighter border border-transparent',
};

const STATUS_LABELS = { open: 'Open', full: 'Full', closed: 'Closed' };

const EVENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  in_person: <MapPin className="h-3 w-3" />,
  virtual: <Video className="h-3 w-3" />,
  hybrid: <Monitor className="h-3 w-3" />,
};

export function EventCard({ event }: { event: EventItem }) {
  const status = getStatus(event);
  const accentBar = CATEGORY_COLORS[event.category] ?? 'bg-surface-300';
  const categoryDot = CATEGORY_DOT_COLORS[event.category] ?? 'bg-surface-300';

  const dateStr = new Date(event.starts_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();

  return (
    <Link href={`/events/${event.id}`}>
      <article className="group overflow-hidden rounded-lg border border-default bg-surface-100 transition-colors hover:border-border-secondary cursor-pointer">
        <div className={`h-1 w-full ${accentBar}`} />
        <div className="p-4">
          <p className="text-xs font-mono uppercase tracking-wide text-foreground-lighter">
            {dateStr}
          </p>
          <h3 className="mt-1 text-sm font-medium text-foreground line-clamp-2">
            {event.title}
          </h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-foreground-light">
            {EVENT_TYPE_ICONS[event.event_type]}
            <span>{event.location ?? 'Online'}</span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${STATUS_CLASSES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-surface-300 px-2 py-0.5 text-[11px] text-foreground-lighter">
              <span className={`h-1.5 w-1.5 rounded-full ${categoryDot}`} />
              {event.category}
            </span>
            {event.is_paid && event.price != null ? (
              <span className="ml-auto text-xs text-foreground-light">${event.price}</span>
            ) : (
              <span className="ml-auto text-xs text-brand">Free</span>
            )}
          </div>
          <div className="mt-4">
            <div className="flex w-full items-center justify-center rounded-md border border-border-secondary bg-button px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-300">
              <Calendar className="mr-2 h-3.5 w-3.5" />
              View Event
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
