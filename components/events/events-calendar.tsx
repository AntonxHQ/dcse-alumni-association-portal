'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { EventItem } from './event-card';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_DOT_COLORS: Record<string, string> = {
  reunion: 'bg-brand',
  networking: 'bg-blue-500',
  webinar: 'bg-purple-500',
  workshop: 'bg-amber-500',
  sports: 'bg-orange-500',
  cultural: 'bg-pink-500',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function EventsCalendar({ events }: { events: EventItem[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const eventsInMonth = events.filter((e) => {
    const d = new Date(e.starts_at);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const eventsByDay: Record<number, EventItem[]> = {};
  for (const e of eventsInMonth) {
    const day = new Date(e.starts_at).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-lg border border-default bg-surface-100">
      {/* Month header */}
      <div className="flex items-center justify-between border-b border-muted p-4">
        <p className="text-base font-medium text-foreground">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="rounded p-1 text-foreground-lighter hover:bg-surface-200 hover:text-foreground"
            aria-label="Previous month"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded p-1 text-foreground-lighter hover:bg-surface-200 hover:text-foreground"
            aria-label="Next month"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 border-b border-muted bg-surface-200">
        {WEEKDAYS.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-mono uppercase tracking-wide text-foreground-lighter">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const isToday =
            day !== null &&
            today.getDate() === day &&
            today.getMonth() === viewMonth &&
            today.getFullYear() === viewYear;

          const dayEvents = day != null ? (eventsByDay[day] ?? []) : [];

          return (
            <div
              key={idx}
              className={`min-h-[80px] border-b border-r border-muted p-1.5 ${day == null ? 'bg-surface-200/30' : ''}`}
            >
              {day != null && (
                <>
                  <div className="flex">
                    <span
                      className={`flex h-5 w-5 items-center justify-center text-xs ${
                        isToday
                          ? 'rounded-full bg-brand text-foreground-contrast font-medium'
                          : 'text-foreground-lighter'
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <Link key={e.id} href={`/events/${e.id}`}>
                        <div className="flex items-center gap-1 truncate rounded bg-surface-300 px-1.5 py-0.5 text-[10px] text-foreground-light hover:bg-surface-400">
                          <span className={`h-1 w-1 shrink-0 rounded-full ${CATEGORY_DOT_COLORS[e.category] ?? 'bg-surface-400'}`} />
                          <span className="truncate">{e.title}</span>
                        </div>
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="px-1.5 text-[10px] text-foreground-lighter">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
