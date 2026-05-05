'use client';

import { useState } from 'react';
import { CheckCircle, Clock, Loader2, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { registerForEvent } from './actions';

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
};

type Event = {
  id: string;
  title: string;
  allows_guests: boolean;
  capacity: number | null;
};

type ExistingReg = {
  id: string;
  status: string;
  waitlist_position: number | null;
} | null;

type RegResult = {
  status: 'confirmed' | 'waitlisted';
  waitlist_position: number | null;
};

export function RegistrationForm({
  event,
  profile,
  confirmedCount,
  existingRegistration,
}: {
  event: Event;
  profile: Profile;
  confirmedCount: number;
  existingRegistration: ExistingReg;
}) {
  const [dietary, setDietary] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegResult | null>(
    existingRegistration?.status === 'confirmed' || existingRegistration?.status === 'waitlisted'
      ? { status: existingRegistration.status as 'confirmed' | 'waitlisted', waitlist_position: existingRegistration.waitlist_position }
      : null
  );

  const isFull = event.capacity != null && confirmedCount >= event.capacity;

  if (result?.status === 'confirmed') {
    return (
      <div className="rounded-lg border border-default bg-surface-100 p-8 flex flex-col items-center text-center">
        <CheckCircle className="h-12 w-12 text-brand mb-4" />
        <p className="text-lg font-medium text-foreground">You&apos;re registered!</p>
        <p className="mt-2 text-sm text-foreground-light">A confirmation email has been sent.</p>
        <button
          type="button"
          onClick={() => {
            const icsUrl = `/api/events/${event.id}/ics`;
            window.open(icsUrl, '_blank');
          }}
          className="mt-6 rounded-md border border-border-secondary bg-button px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-300"
        >
          Add to Calendar
        </button>
      </div>
    );
  }

  if (result?.status === 'waitlisted') {
    return (
      <div className="rounded-lg border border-default bg-surface-100 p-8 flex flex-col items-center text-center">
        <Clock className="h-12 w-12 text-warning mb-4" />
        <p className="text-lg font-medium text-foreground">You&apos;re on the waitlist</p>
        {result.waitlist_position && (
          <p className="mt-1 text-sm text-foreground-light">Position #{result.waitlist_position}</p>
        )}
        <p className="mt-2 text-sm text-foreground-light">We&apos;ll email you if a spot opens up.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerForEvent(event.id, {
        dietary_requirements: dietary || undefined,
        guest_count: event.allows_guests ? guestCount : 0,
      });
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-default bg-surface-100 p-5">
      <h2 className="text-base font-medium text-foreground mb-5">
        {isFull ? 'Join Waitlist' : 'Register for Event'}
      </h2>

      {/* Pre-filled fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-foreground-lighter mb-1.5">
            Name
          </label>
          <p className="rounded-md border border-border-control bg-surface-200 px-3 py-2 text-sm text-foreground-light">
            {profile.full_name ?? '—'}
          </p>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-foreground-lighter mb-1.5">
            Email
          </label>
          <p className="rounded-md border border-border-control bg-surface-200 px-3 py-2 text-sm text-foreground-light">
            {profile.email}
          </p>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-foreground-lighter mb-1.5">
            Dietary / Accessibility Requirements
            <span className="ml-1 normal-case text-foreground-muted">(optional)</span>
          </label>
          <textarea
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            rows={3}
            placeholder="e.g. vegetarian, wheelchair access..."
            className="w-full rounded-md border border-border-control bg-surface-200 px-3 py-2 text-sm text-foreground placeholder:text-foreground-lighter focus:border-brand focus:outline-none resize-none"
          />
        </div>

        {event.allows_guests && (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-foreground-lighter mb-1.5">
              Number of Guests
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGuestCount((n) => Math.max(0, n - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border-control bg-surface-200 text-foreground-light hover:bg-surface-300 hover:text-foreground"
                aria-label="Decrease guests"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-medium text-foreground">{guestCount}</span>
              <button
                type="button"
                onClick={() => setGuestCount((n) => n + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border-control bg-surface-200 text-foreground-light hover:bg-surface-300 hover:text-foreground"
                aria-label="Increase guests"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Processing…
          </>
        ) : (
          <>{isFull ? 'Join Waitlist' : 'Register for Event'}</>
        )}
      </button>
    </form>
  );
}
