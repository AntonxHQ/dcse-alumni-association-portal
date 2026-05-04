'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from '../../../../components/events/tiptap-editor';

const CATEGORIES = ['reunion', 'networking', 'webinar', 'workshop', 'sports', 'cultural'];
const EVENT_TYPES = ['in_person', 'virtual', 'hybrid'];

type EventData = {
  id?: string;
  title: string;
  description: string;
  category: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  location: string;
  capacity: string;
  allows_guests: boolean;
  is_paid: boolean;
  price: string;
  published: boolean;
  cancel_cutoff_hours: string;
};

const DEFAULT: EventData = {
  title: '',
  description: '',
  category: 'networking',
  event_type: 'in_person',
  starts_at: '',
  ends_at: '',
  location: '',
  capacity: '',
  allows_guests: false,
  is_paid: false,
  price: '',
  published: false,
  cancel_cutoff_hours: '24',
};

export function EventSheet({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<EventData> & { id?: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState<EventData>({ ...DEFAULT, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...DEFAULT, ...initial });
  }, [initial, open]);

  if (!open) return null;

  const set = (key: keyof EventData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        event_type: form.event_type,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        location: form.location || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        allows_guests: form.allows_guests,
        is_paid: form.is_paid,
        price: form.is_paid && form.price ? parseFloat(form.price) : null,
        published: publish,
        cancel_cutoff_hours: parseInt(form.cancel_cutoff_hours) || 24,
      };

      const url = form.id ? `/api/events/${form.id}` : '/api/events';
      const method = form.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Save failed');
      }

      toast.success(form.id ? 'Event updated' : 'Event created');
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-md border border-border-control bg-surface-200 px-3 py-2 text-sm text-foreground placeholder:text-foreground-lighter focus:border-brand focus:outline-none';
  const labelClass = 'block text-xs font-medium text-foreground-light mb-1.5';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-[600px] flex-col border-l border-default bg-surface-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-default px-6 py-4">
          <h2 className="text-base font-medium text-foreground">
            {form.id ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-foreground-lighter hover:bg-surface-200 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div>
            <label className={labelClass}>Event Title *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Annual Reunion Gala"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputClass}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={form.event_type} onChange={(e) => set('event_type', e.target.value)} className={inputClass}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', '-')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date & Time *</label>
              <input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>End Date & Time *</label>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Venue name or leave blank for Online" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Capacity (blank = unlimited)</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} placeholder="e.g. 100" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cancel Cutoff (hours)</label>
              <input type="number" min="0" value={form.cancel_cutoff_hours} onChange={(e) => set('cancel_cutoff_hours', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <TiptapEditor
              content={form.description}
              onChange={(html) => set('description', html)}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.allows_guests}
                onChange={(e) => set('allows_guests', e.target.checked)}
                className="accent-brand"
              />
              Allow Guests
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_paid}
                onChange={(e) => set('is_paid', e.target.checked)}
                className="accent-brand"
              />
              Paid Event
            </label>
          </div>

          {form.is_paid && (
            <div>
              <label className={labelClass}>Price (USD)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" className={inputClass} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set('published', e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-surface-300 peer-checked:bg-brand after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-foreground-contrast after:transition-transform peer-checked:after:translate-x-4" />
            </label>
            <span className="text-sm text-foreground">Publish immediately</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-default px-6 py-4">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || !form.title}
            className="flex-1 rounded-full bg-brand py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save event'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving || !form.title}
            className="flex-1 rounded-md border border-border-secondary bg-button py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-300 disabled:opacity-60"
          >
            Save as draft
          </button>
        </div>
      </div>
    </>
  );
}
