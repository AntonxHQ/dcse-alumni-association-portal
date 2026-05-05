'use server';

import { adminClient } from '../../../../../lib/supabase/admin';
import { createClient as createServerClient } from '../../../../../lib/supabase/server';
import { generateICS } from '../../../../../lib/ics';
import { render } from '@react-email/render';
import { ConfirmationEmail } from '../../../../../lib/email/confirmation';

async function getSessionProfile() {
  const supabase = await createServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Unauthenticated');

  const { data: profile, error: profileErr } = await adminClient
    .from('profiles')
    .select('id, full_name, email, status')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) throw new Error('Profile not found');
  if (profile.status !== 'active') throw new Error('Account not active');
  return profile;
}

export async function registerForEvent(
  eventId: string,
  formData: { dietary_requirements?: string; guest_count?: number }
) {
  const profile = await getSessionProfile();

  // Fetch event
  const { data: event, error: evErr } = await adminClient
    .from('events')
    .select('id, title, description, starts_at, ends_at, location, capacity, cancel_cutoff_hours')
    .eq('id', eventId)
    .eq('published', true)
    .single();

  if (evErr || !event) throw new Error('Event not found');

  // Check existing registration for this user (any status)
  const { data: existing } = await adminClient
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('profile_id', profile.id)
    .maybeSingle();

  if (existing && existing.status !== 'cancelled') {
    throw new Error('Already registered for this event');
  }

  // Check capacity (confirmed count)
  const { count: confirmedCount } = await adminClient
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'confirmed');

  const isWaitlisted = event.capacity != null && (confirmedCount ?? 0) >= event.capacity;

  let waitlistPosition: number | null = null;
  if (isWaitlisted) {
    const { count: wCount } = await adminClient
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'waitlisted');
    waitlistPosition = (wCount ?? 0) + 1;
  }

  const qr_token = crypto.randomUUID();
  const newRow = {
    event_id: eventId,
    profile_id: profile.id,
    status: isWaitlisted ? 'waitlisted' : 'confirmed',
    waitlist_position: waitlistPosition,
    qr_token,
    dietary_requirements: formData.dietary_requirements ?? null,
    guest_count: formData.guest_count ?? 0,
  };

  let registration: { id: string; status: string; waitlist_position: number | null } | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let regErr: any = null;

  if (existing?.status === 'cancelled') {
    // Re-registration after cancellation — update the existing row
    const { data, error } = await adminClient
      .from('event_registrations')
      .update({
        status: newRow.status,
        waitlist_position: newRow.waitlist_position,
        qr_token: newRow.qr_token,
        dietary_requirements: newRow.dietary_requirements,
        guest_count: newRow.guest_count,
        registered_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, status, waitlist_position')
      .single();
    registration = data;
    regErr = error;
  } else {
    // Fresh registration
    const { data, error } = await adminClient
      .from('event_registrations')
      .insert(newRow)
      .select('id, status, waitlist_position')
      .single();
    registration = data;
    regErr = error;
  }

  if (regErr || !registration) throw new Error('Registration failed');

  // Audit log
  await adminClient.from('audit_logs').insert({
    actor_id: profile.id,
    action: isWaitlisted ? 'event.waitlisted' : 'event.registered',
    target_type: 'registration',
    target_id: registration.id,
    metadata: { event_id: eventId, event_title: event.title },
  });

  // Send confirmation email
  try {
    const dateStr = new Date(event.starts_at).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

    const emailHtml = await render(
      ConfirmationEmail({
        attendeeName: profile.full_name ?? 'Alumnus',
        eventTitle: event.title,
        eventDate: dateStr,
        eventLocation: event.location ?? 'Online',
        isWaitlisted,
        waitlistPosition: waitlistPosition ?? undefined,
      }) as React.ReactElement
    );

    const icsContent = !isWaitlisted ? generateICS(event) : null;

    // Only attempt email if RESEND_API_KEY is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const payload: Record<string, unknown> = {
        from: 'CSE Alumni <no-reply@alumni.cse.edu>',
        to: [profile.email],
        subject: isWaitlisted
          ? `Waitlist confirmation: ${event.title}`
          : `Registration confirmed: ${event.title}`,
        html: emailHtml,
      };

      if (icsContent) {
        payload.attachments = [{
          filename: 'event.ics',
          content: Buffer.from(icsContent).toString('base64'),
        }];
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    // Email failure is non-fatal
  }

  return {
    status: registration.status as 'confirmed' | 'waitlisted',
    waitlist_position: registration.waitlist_position,
    registration_id: registration.id,
  };
}

export async function cancelRegistration(registrationId: string) {
  const profile = await getSessionProfile();

  const { data: reg, error: regErr } = await adminClient
    .from('event_registrations')
    .select('id, event_id, status, profile_id')
    .eq('id', registrationId)
    .single();

  if (regErr || !reg) throw new Error('Registration not found');
  if (reg.profile_id !== profile.id) throw new Error('Forbidden');
  if (reg.status === 'cancelled') throw new Error('Already cancelled');

  // Check cancel cutoff
  const { data: event } = await adminClient
    .from('events')
    .select('starts_at, cancel_cutoff_hours, title')
    .eq('id', reg.event_id)
    .single();

  if (event) {
    const cutoffMs = (event.cancel_cutoff_hours ?? 24) * 60 * 60 * 1000;
    const startsAt = new Date(event.starts_at).getTime();
    if (Date.now() > startsAt - cutoffMs) {
      throw new Error('Cancellation deadline has passed');
    }
  }

  const wasConfirmed = reg.status === 'confirmed';

  await adminClient
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('id', registrationId);

  // Promote next waitlisted person if this was a confirmed registration
  if (wasConfirmed && event) {
    const { data: nextWaitlisted } = await adminClient
      .from('event_registrations')
      .select('id, profile_id, waitlist_position')
      .eq('event_id', reg.event_id)
      .eq('status', 'waitlisted')
      .order('waitlist_position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextWaitlisted) {
      await adminClient
        .from('event_registrations')
        .update({ status: 'confirmed', waitlist_position: null })
        .eq('id', nextWaitlisted.id);

      // Audit
      await adminClient.from('audit_logs').insert({
        actor_id: null,
        action: 'event.waitlist_promoted',
        target_type: 'registration',
        target_id: nextWaitlisted.id,
        metadata: { event_id: reg.event_id },
      });
    }
  }

  await adminClient.from('audit_logs').insert({
    actor_id: profile.id,
    action: 'event.cancelled',
    target_type: 'registration',
    target_id: registrationId,
    metadata: { event_id: reg.event_id },
  });

  return { success: true };
}
