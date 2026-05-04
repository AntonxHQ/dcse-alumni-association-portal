'use client';

import { useState } from 'react';
import { Plus, Edit2, Users } from 'lucide-react';
import { EventSheet } from './event-sheet';

const CATEGORY_DOT: Record<string, string> = {
  reunion: 'bg-brand',
  networking: 'bg-blue-500',
  webinar: 'bg-purple-500',
  workshop: 'bg-amber-500',
  sports: 'bg-orange-500',
  cultural: 'bg-pink-500',
};

type EventRow = {
  id: string;
  title: string;
  category: string;
  event_type: string;
  starts_at: string;
  published: boolean;
  capacity: number | null;
  confirmed_count: number;
  description: string | null;
  ends_at: string;
  location: string | null;
  allows_guests: boolean;
  is_paid: boolean;
  price: number | null;
  cancel_cutoff_hours: number;
};

export function AdminEventsClient({ events }: { events: EventRow[] }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<EventRow> | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setSheetOpen(true);
  };

  const openEdit = (event: EventRow) => {
    setEditing({
      ...event,
      starts_at: event.starts_at.slice(0, 16),
      ends_at: event.ends_at.slice(0, 16),
    });
    setSheetOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-foreground">Events</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-default bg-surface-100">
        <table className="w-full">
          <thead>
            <tr className="border-b border-default bg-surface-200">
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Event</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Registrations</th>
              <th className="w-24 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-foreground-lighter">
                  No events yet. Create your first event.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="group border-b border-muted last:border-0 hover:bg-surface-400">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[event.category] ?? 'bg-surface-300'}`} />
                      <span className="text-sm font-medium text-foreground">{event.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground-lighter">
                    {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded border px-2 py-0.5 text-xs ${event.published ? 'border-brand/30 bg-brand/10 text-brand' : 'border-transparent bg-surface-300 text-foreground-lighter'}`}>
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-light">
                    {event.confirmed_count}{event.capacity != null ? ` / ${event.capacity}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={`/admin/events/${event.id}/registrants`}
                        title="View registrants"
                        className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
                      >
                        <Users className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEdit(event)}
                        title="Edit event"
                        className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EventSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initial={editing as Parameters<typeof EventSheet>[0]['initial']}
      />
    </>
  );
}
