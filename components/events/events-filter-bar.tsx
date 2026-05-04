'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, Calendar } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'reunion', label: 'Reunion' },
  { value: 'networking', label: 'Networking' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
];

const EVENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'in_person', label: 'In-person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hybrid', label: 'Hybrid' },
];

const AVAILABILITY = [
  { value: '', label: 'All Events' },
  { value: 'available', label: 'Available' },
];

export function EventsFilterBar({
  view,
  onViewChange,
}: {
  view: 'grid' | 'calendar';
  onViewChange: (v: 'grid' | 'calendar') => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? '';
  const eventType = searchParams.get('event_type') ?? '';
  const availability = searchParams.get('availability') ?? '';

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const selectClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs bg-surface-200 cursor-pointer appearance-none outline-none transition-colors ${
      active
        ? 'border-brand text-brand bg-brand/5'
        : 'border-border-control text-foreground'
    }`;

  return (
    <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center gap-2 border-b border-muted bg-surface-100 py-3">
      <select
        className={selectClass(!!category)}
        value={category}
        onChange={(e) => setParam('category', e.target.value)}
        aria-label="Filter by category"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        className={selectClass(!!eventType)}
        value={eventType}
        onChange={(e) => setParam('event_type', e.target.value)}
        aria-label="Filter by type"
      >
        {EVENT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select
        className={selectClass(!!availability)}
        value={availability}
        onChange={(e) => setParam('availability', e.target.value)}
        aria-label="Filter by availability"
      >
        {AVAILABILITY.map((a) => (
          <option key={a.value} value={a.value}>{a.label}</option>
        ))}
      </select>

      <div className="ml-auto flex items-center rounded-md border border-border-control bg-surface-200 p-0.5">
        <button
          type="button"
          onClick={() => onViewChange('grid')}
          aria-label="Grid view"
          className={`rounded p-1.5 transition-colors ${
            view === 'grid'
              ? 'bg-surface-400 text-foreground'
              : 'text-foreground-lighter'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewChange('calendar')}
          aria-label="Calendar view"
          className={`rounded p-1.5 transition-colors ${
            view === 'calendar'
              ? 'bg-surface-400 text-foreground'
              : 'text-foreground-lighter'
          }`}
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
