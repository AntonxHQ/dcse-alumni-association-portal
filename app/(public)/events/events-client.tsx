'use client';

import { useState } from 'react';
import { EventCard, type EventItem } from '../../../components/events/event-card';
import { EventsCalendar } from '../../../components/events/events-calendar';
import { EventsFilterBar } from '../../../components/events/events-filter-bar';

export function EventsClient({ events }: { events: EventItem[] }) {
  const [view, setView] = useState<'grid' | 'calendar'>('grid');

  return (
    <>
      <EventsFilterBar view={view} onViewChange={setView} />

      {view === 'grid' ? (
        events.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-foreground-lighter text-sm">No events found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )
      ) : (
        <EventsCalendar events={events} />
      )}
    </>
  );
}
