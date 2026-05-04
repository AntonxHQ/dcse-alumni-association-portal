'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { cancelRegistration } from '../events/[id]/register/actions';

type Reg = {
  id: string;
  status: 'confirmed' | 'waitlisted';
  waitlist_position: number | null;
  events: { id: string; title: string; starts_at: string; category: string };
};

const STATUS_CLASSES = {
  confirmed: 'bg-brand/10 text-brand border border-brand/30',
  waitlisted: 'bg-warning/10 text-warning border border-warning/30',
};

export function DashboardRegistrations({ registrations }: { registrations: Reg[] }) {
  const [list, setList] = useState(registrations);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCancel = async (regId: string) => {
    setCancelling(regId);
    try {
      await cancelRegistration(regId);
      setList((prev) => prev.filter((r) => r.id !== regId));
      toast.success('Registration cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-default bg-surface-100 divide-y divide-border-muted">
      {list.map((reg) => (
        <div key={reg.id} className="flex items-center justify-between p-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono text-foreground-lighter uppercase tracking-wide">
              {new Date(reg.events.starts_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-foreground">
              {reg.events.title}
            </p>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-3">
            {reg.status === 'waitlisted' && reg.waitlist_position ? (
              <span className={`rounded border px-2 py-0.5 text-xs ${STATUS_CLASSES.waitlisted}`}>
                Position #{reg.waitlist_position}
              </span>
            ) : (
              <span className={`rounded border px-2 py-0.5 text-xs ${STATUS_CLASSES[reg.status]}`}>
                {reg.status}
              </span>
            )}
            <button
              type="button"
              disabled={cancelling === reg.id}
              onClick={() => handleCancel(reg.id)}
              className="rounded p-1 text-foreground-lighter transition-colors hover:text-destructive disabled:opacity-40"
              title="Cancel registration"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
