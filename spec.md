# SPEC.md — Alumni Portal
### Computer Systems Engineering Department
**Version:** 1.3.0 | **Stack:** Next.js 15 App Router + Supabase | **Date:** May 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Feature 1 — Alumni Registration & Profile Fields](#3-feature-1--alumni-registration--profile-fields)
4. [Feature 2 — Public Alumni Database](#4-feature-2--public-alumni-database)
5. [Feature 3 — Activities, Events & Registration](#5-feature-3--activities-events--registration)
6. [Feature 4 — Admin Dashboard](#6-feature-4--admin-dashboard)
7. [User Stories](#7-user-stories)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Roles & Permissions](#9-roles--permissions)
10. [Delivery Roadmap](#10-delivery-roadmap)
11. [Dependencies & Assumptions](#11-dependencies--assumptions)
12. [Technical Specification — Next.js + Supabase](#12-technical-specification--nextjs--supabase)
13. [Database Schema](#13-database-schema)
14. [Row-Level Security Policies](#14-row-level-security-rls-policies)
15. [Authentication Flow](#15-authentication-flow)
16. [API Routes](#16-api-routes-nextjs-route-handlers)
17. [Supabase Storage Buckets](#17-supabase-storage-buckets)
18. [Full-Text Search](#18-full-text-search-implementation)
19. [Supabase Edge Functions](#19-supabase-edge-functions)
20. [Environment Variables](#20-environment-variables)
21. [UI/UX Design Theme — Supabase Style](#21-uiux-design-theme--supabase-style)
22. [SDD Epic Build Plan](#22-sdd-epic-build-plan--cursor)

---

## 1. Executive Summary

The Alumni Portal is a web-based platform for the Computer Systems Engineering department designed to connect graduates with their institution, peers, and the broader alumni community. It enables self-service alumni registration, a searchable public directory, event discovery and registration, and a comprehensive admin dashboard for institutional staff.

**Three primary personas:**
- **Alumni** — self-register, manage profiles, discover events
- **Visitors/Public** — browse the alumni directory
- **Administrators** — moderate content, manage events, view analytics

**Problem statement:** Institutions struggle to maintain accurate alumni records, facilitate peer-to-peer networking, and communicate events at scale. Existing solutions are fragmented across spreadsheets, email lists, and disconnected tools — creating data silos and poor alumni engagement rates.

**Proposed solution:** A single integrated portal that centralises alumni data, surfaces it through a discoverable directory, and drives engagement through an events system — all governed by a powerful admin dashboard.

---

## 2. Goals & Success Metrics

| Metric | Target |
|--------|--------|
| Alumni activation rate | ≥ 60% of known alumni complete registration within 6 months of launch |
| Profile completeness | Average completeness score ≥ 75% across all registered alumni |
| Event engagement | ≥ 40% of registered alumni sign up for at least one event per academic year |
| Directory usage | ≥ 500 unique monthly active users performing directory searches post-launch |
| Admin efficiency | Reduce manual alumni record management effort by ≥ 70% vs. current baseline |
| System reliability | 99.5% uptime SLA; page load ≤ 2s on standard broadband |

---

## 3. Feature 1 — Alumni Registration & Profile Fields

### 3.1 Department Scope Note

The portal is scoped exclusively to the **Computer Systems Engineering** department. The "Department" field is removed — it is a fixed, implicit value across all records and need not be collected or displayed.

### 3.2 Registration Requirements

- **FR-REG-01:** Multi-step registration form collecting all fields listed in the profile schema below.
- **FR-REG-02:** Email verification link sent on registration. Account remains inactive until verified.
- **FR-REG-03:** Alumni in an existing institutional database may be pre-populated upon email match.
- **FR-REG-04:** Profile photo upload (JPEG/PNG, max 5 MB). System auto-crops to square.
- **FR-REG-05:** Up to 3 social/professional profile links (LinkedIn, Twitter/X, personal website).
- **FR-REG-06:** Per-field privacy preferences (Public / Alumni-only / Private) settable at registration and updatable at any time.
- **FR-REG-07:** OAuth 2.0 sign-in via Google and LinkedIn as alternative to email/password.
- **FR-REG-08:** Password minimum strength policy (≥ 8 chars, 1 uppercase, 1 number, 1 special character). Forgotten password recovery via email.
- **FR-REG-09:** Admins can approve, reject, or flag registrations for manual review.
- **FR-REG-10:** Explicit consent checkboxes: data storage policy, communications opt-in, directory listing consent (GDPR-compliant).

### 3.3 Complete Profile Fields

| Field | Status | Privacy Control | Specification |
|-------|--------|----------------|---------------|
| Full name | Required | Public | First + last name. Max 100 chars. |
| Current email address | Required | Privacy-controlled | Used for login/notifications. Never exposed in public directory HTML. Options: Public / Alumni-only / Private. |
| Degree(s) | Required | Public | Multi-select checklist: BS, MS, PhD. At least one required. Each checked degree reveals 3 sub-fields (see §3.4). |
| Postal address | Optional | Privacy-controlled | Free-text multi-line. Default: Private. Max: Alumni-only. Never public. |
| Current city & country | Optional | Privacy-controlled | City (text) + Country (ISO 3166-1 dropdown). Default: Alumni-only. Used for directory filtering. |
| Brief description | Optional | Public | Short bio/statement. Max 500 chars. Rich-text (bold, italic, lists). |
| Career highlights & achievements | Optional | Public | Structured list: title (required) + year + description. Max 10 entries. |
| Employment history | Optional | Privacy-controlled | LinkedIn-style entries. Default: Public. See §3.5. |
| Profile picture (DP) | Optional | Public | JPEG/PNG max 5 MB. Converted to 400×400 WebP. Falls back to initials avatar. |
| Phone number | Optional | Privacy-controlled | E.164 format. Default: Private. Options: Alumni-only or Private only. **Never Public.** |
| Skills & areas of expertise | Optional | Public | Tag-style multi-select with typeahead. Predefined taxonomy + custom tags. Max 20 tags. |
| Account ID | System | — | Auto-generated UUID. Never displayed. |
| Registration date | System | — | UTC timestamp. Admin dashboard only. |
| Verification status | System | — | Enum: pending_email / pending_admin / active / suspended |
| Profile completeness score | System | — | Computed 0–100. Shown to alumnus as progress indicator. |

### 3.4 Degree Sub-Fields (Per Selected Degree)

When an alumnus checks BS, MS, or PhD, the form dynamically reveals:

| Sub-field | Type | Rules |
|-----------|------|-------|
| Registration No. | Text, required | Validated against configurable regex (e.g., `^\d{4}-CSE-\d{4}$`) |
| Intake year | Year picker, required | Range: 1980 to current year + 1 |
| Graduation year | Year picker, required | Range: intake year to current year + 1. Must be ≥ intake year. |

- **FR-DEG-01:** At least one degree must be selected to proceed with registration.
- **FR-DEG-02:** Registration No. validated against `DEGREE_REGISTRATION_REGEX` env var.
- **FR-DEG-03:** Graduation year must be ≥ intake year (enforced in Zod schema).
- **FR-DEG-04:** Alumni may hold multiple degrees; all stored as separate rows linked to the same profile.
- **FR-DEG-05:** UNIQUE constraint on `(profile_id, level)` — one BS/MS/PhD entry per alumnus.

### 3.5 Employment History (LinkedIn-Style)

Per entry fields:

| Field | Type | Rules |
|-------|------|-------|
| Job title | Text, required | Max 100 chars |
| Company / organisation name | Text, required | Max 100 chars |
| Employment type | Dropdown | full_time / part_time / contract / freelance / internship / self_employed |
| Start date | Month + year picker, required | Stored as first day of month (YYYY-MM-01) |
| End date | Month + year picker, nullable | NULL = currently employed here |
| Location | City + country, optional | — |
| Description | Optional free-text | Max 300 chars |

- Max 20 entries per profile.
- Displayed reverse-chronologically (most recent first).
- Most recent active position shown as one-line summary on directory card.
- If multiple entries marked "currently working here", system prompts review.

### 3.6 Privacy Model

| Level | Visible to | Applies to |
|-------|-----------|------------|
| Public | All visitors including unauthenticated | Full name, degree info, bio, career highlights, employment (default), skills, profile picture |
| Alumni-only | Verified logged-in alumni only | Email (if chosen), city/country (default), phone (maximum for phone) |
| Private | Owner + Super Admins only | Postal address (default), phone (default), email (if chosen) |

- **FR-PRIV-01:** Privacy settings configurable per field from profile settings page.
- **FR-PRIV-02:** Phone can never be set to Public — Alumni-only or Private only.
- **FR-PRIV-03:** Email never rendered in page HTML for public visitors regardless of setting.
- **FR-PRIV-04:** Privacy setting changes take effect within 60 seconds.
- **FR-PRIV-05:** Defaults applied at registration; admins may change defaults in system settings.

---

## 4. Feature 2 — Alumni Directory (authenticated alumni only)

> **Access change from original PRD:** The directory is no longer publicly accessible. It requires an active, verified alumni session. Unauthenticated visitors who attempt to reach `/alumni` or `/alumni/[id]` are redirected to `/auth/login?next=<path>`. Only alumni with `status = 'active'` can view the directory and individual profiles.

- **FR-DIR-01:** Paginated card grid of alumni showing: name, photo, graduation year, degree, current employer (privacy-filtered). Accessible to authenticated active alumni only.
- **FR-DIR-02:** Full-text search bar matching name, employer, degree programme, and bio.
- **FR-DIR-03:** Filters: degree level (BS/MS/PhD multi-select), graduation year range, country/city, skills.
- **FR-DIR-04:** Sort by: Relevance, Name (A–Z), Graduation year (newest/oldest).
- **FR-DIR-05:** Profile pages show fields set to Alumni-only or Public. Private fields visible only to the profile owner.
- **FR-DIR-06:** Logged-in alumni can send connection requests or messages to other alumni (if recipient has enabled this).
- **FR-DIR-07:** Email addresses never exposed in any page HTML. Contact only via in-portal messaging.
- **FR-DIR-08:** Admins can hide individual profiles from the directory without deleting the account.
- **FR-DIR-09:** Alumni can opt out of directory listing at any time; removal within 24 hours.
- **FR-DIR-10:** Admins can export directory to CSV/XLSX (logged and audit-trailed).
- **FR-DIR-11:** The directory page displays a community analytics banner above the search/filter area showing aggregate, non-personal statistics computed from the active alumni population. Analytics are read-only and visible to all authenticated alumni.

### 4.1 Directory Analytics Banner (FR-DIR-11)

The analytics banner is a compact strip of live aggregate stats derived from the `profiles`, `degrees`, `employment_history`, and `profile_skills` tables. It refreshes on every directory page load (ISR revalidate 300s). No individual data is surfaced — all values are counts, percentages, or top-N lists.

| Stat | Label | Source query |
|------|-------|-------------|
| Total registered alumni | "Alumni registered" | `COUNT(*) FROM profiles WHERE status='active'` |
| Countries represented | "Countries" | `COUNT(DISTINCT country) FROM profiles WHERE status='active' AND country IS NOT NULL` |
| Graduation year span | "Class years" | `MIN(graduation_year) || ' – ' || MAX(graduation_year) FROM degrees` |
| Most represented degree | "Top degree" | `level, COUNT(*) GROUP BY level ORDER BY COUNT(*) DESC LIMIT 1` |
| Top 5 skills | "Popular skills" | `skill name, COUNT(*) FROM profile_skills JOIN skills GROUP BY skill ORDER BY COUNT DESC LIMIT 5` |
| Alumni currently employed | "Currently employed" | `COUNT(DISTINCT profile_id) FROM employment_history WHERE end_month IS NULL` |
| Alumni abroad (outside Pakistan) | "International" | `COUNT(*) FROM profiles WHERE status='active' AND country != 'PK' AND country IS NOT NULL` |
| New alumni this year | "Joined this year" | `COUNT(*) FROM profiles WHERE status='active' AND EXTRACT(YEAR FROM created_at) = current_year` |

All analytics queries run server-side in the RSC using the **anon client** (RLS enforces active-only). Results are passed as props to a client component — no separate API route needed.

---

## 5. Feature 3 — Activities, Events & Registration

### 5.1 Events Listing Page

- **FR-EVT-01:** Card grid listing with title, date/time, location (or "Online"), category tag, registration status (Open / Full / Closed).
- **FR-EVT-02:** Filters: category (reunion, networking, webinar, sports, cultural, workshop), date range, location type (in-person / virtual / hybrid), availability.
- **FR-EVT-03:** Each event has a detail page with: full description, agenda/schedule, venue details/map, registration CTA, capacity indicator.
- **FR-EVT-04:** Recurring events supported (weekly, monthly, annually).
- **FR-EVT-05:** Free and paid events. Paid events integrate with Stripe.
- **FR-EVT-06:** Public calendar view (month/week/list) alongside card grid.

### 5.2 Event Registration

- **FR-EREG-01:** Single-page registration form: confirm name/email (pre-filled), dietary/accessibility requirements (optional), guest count (if event allows).
- **FR-EREG-02:** Confirmation email sent with event details and `.ics` calendar attachment.
- **FR-EREG-03:** Capacity limits enforced. When capacity reached, further registrations go to a waitlist automatically.
- **FR-EREG-04:** Alumni can cancel registration up to a configurable cut-off time. Cancellation triggers automatic promotion of the next waitlisted person.
- **FR-EREG-05:** Automated reminder emails at 7 days and 24 hours before the event.
- **FR-EREG-06:** QR code check-in generated per attendee registration for in-person events.
- **FR-EREG-07:** Post-event feedback survey link sent to all attendees (configurable per event).

---

## 6. Feature 4 — Admin Dashboard

### 6.1 Dashboard Home — Analytics Overview

- **FR-ADM-01:** KPI cards: total registered alumni, new registrations (last 30 days), active alumni (logged in last 90 days), upcoming events, total event registrations, pending approval requests.
- **FR-ADM-02:** Charts: alumni growth over time (line), registrations by graduation year (bar), top countries (map or bar), event attendance trend (line), profile completeness distribution (histogram).
- **FR-ADM-03:** All analytics filterable by date range, degree programme, and department.

### 6.2 Alumni Management

- **FR-ADM-04:** Full data table: searchable, sortable, paginated. Columns: name, email, programme, graduation year, status, registration date, last login.
- **FR-ADM-05:** Admin actions: approve/reject pending registrations, edit any alumni profile field, suspend or permanently delete accounts, merge duplicate records.
- **FR-ADM-06:** Bulk actions: bulk approve, bulk export, bulk email.
- **FR-ADM-07:** Import alumni records via CSV upload with field mapping and duplicate detection.

### 6.3 Events Management

- **FR-ADM-08:** Create, edit, duplicate, and delete events via rich form editor (text, images, embedded video, file attachments).
- **FR-ADM-09:** Per-event registrant list with check-in status; manual check-in by admin.
- **FR-ADM-10:** Send targeted push/email notifications to event registrants.
- **FR-ADM-11:** Event-level analytics: registration rate, attendance rate, waitlist size, cancellation rate, survey results.
- **FR-ADM-12:** Manage event categories, custom tags, and public visibility.

### 6.4 Content & System Management

- **FR-ADM-13:** Manage valid degree programmes, departments, and graduation year ranges.
- **FR-ADM-14:** Configure system-wide email templates with WYSIWYG editor and preview.
- **FR-ADM-15:** Full audit log: all admin actions (who, what, when) — searchable and exportable.
- **FR-ADM-16:** Manage admin/staff accounts: create, assign roles (Super Admin, Content Manager, Events Manager), deactivate.

---

## 7. User Stories

| ID | As a… | I want to… | So that… | Priority |
|----|-------|------------|----------|----------|
| US-01 | Graduate | Register and create my alumni profile | I can join the alumni community and be discoverable | High |
| US-02 | Alumni | Set privacy on each profile field | I control what personal info is visible to whom | High |
| US-03 | Alumni | Search the alumni directory by name or company | I can reconnect with old classmates or find industry contacts | High |
| US-04 | Alumni | Browse the alumni directory after logging in | I can discover and connect with fellow graduates | High |
| US-05 | Alumni | View and register for upcoming events | I can stay connected and attend relevant activities | High |
| US-06 | Alumni | Receive a confirmation email with calendar invite | I don't forget event details | High |
| US-07 | Alumni | Cancel my event registration | My spot can go to someone on the waitlist | Medium |
| US-08 | Admin | Review and approve new registrations | I can verify alumni before they appear in the directory | High |
| US-09 | Admin | Create and publish an event with capacity limits | Registrations are capped and managed automatically | High |
| US-10 | Admin | View dashboard analytics on alumni engagement | I can report on portal ROI to institutional leadership | High |
| US-11 | Admin | Export the alumni list to CSV | I can use the data in external reporting tools | Medium |
| US-12 | Admin | Bulk-import alumni records from an existing spreadsheet | I can pre-seed the database at launch | High |
| US-13 | Alumni | Send a message to another alumnus | I can network without exposing my email address | Medium |
| US-14 | Admin | Check in attendees using QR codes at an event | I have accurate real-time attendance records | Medium |
| US-15 | Admin | Suspend or merge duplicate alumni accounts | The directory stays clean and accurate | Low |

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Page load ≤ 2s (LCP) on 10 Mbps. Directory search ≤ 500ms. Support 1,000 concurrent users. |
| Security | HTTPS everywhere. Passwords hashed (bcrypt, cost ≥ 12). Rate limiting on auth endpoints. OWASP Top 10 compliance. Penetration test before launch. |
| Privacy & Compliance | GDPR and PDPA compliant. Right to erasure implemented. Data retention policy configurable. Consent logs stored immutably. |
| Accessibility | WCAG 2.1 AA compliance. Keyboard navigable. Screen reader compatible. Minimum 4.5:1 colour contrast. |
| Scalability | Support up to 100,000 alumni records. Horizontal scaling via Docker/K8s. |
| Availability | 99.5% uptime SLA. Daily DB backups with 30-day retention. RTO ≤ 4 hours, RPO ≤ 1 hour. |
| Internationalisation | RTL layout support. Date/time in user's local timezone. Unicode support for all text fields. |
| Mobile responsiveness | Fully responsive 320px–2560px. Core flows completable on mobile without pinch-zoom. |

---

## 9. Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | All permissions. Manage admin accounts & roles. Configure system settings. View full audit logs. Export all data. Delete alumni records. |
| **Events Manager** | Create/edit/delete events. View registrant lists. Manage waitlists. Send event notifications. QR check-in management. View event analytics. |
| **Content Manager** | Approve/reject registrations. Edit alumni profiles. Hide/show directory entries. Manage programme lists. View alumni analytics. Import alumni records. |
| **Alumni (verified)** | View & edit own profile. Browse full directory. Register for events. Send/receive messages. Update privacy settings. Opt out of directory. |
| **Public visitor** | Browse public directory. View public profiles. View events listing. View event details. Access registration form. |
| **Alumni (pending)** | Complete registration form. Verify email address. Awaiting admin approval. Cannot access directory or register for events. |

---

## 10. Delivery Roadmap

| Phase | Weeks | Deliverables |
|-------|-------|-------------|
| Phase 1 | 1–6 | Core infrastructure. Alumni registration & email verification. Basic profile management. Admin dashboard — alumni management module. CSV import. |
| Phase 2 | 7–11 | Public alumni directory with search & filters. Privacy controls. Events listing & detail pages. Event creation by admin. Event registration flow (free events). Email notifications. |
| Phase 3 | 12–16 | Paid events (Stripe integration). Waitlist management. QR code check-in. Admin analytics dashboard. Audit logs. Calendar view. Post-event survey links. |
| Phase 4 | 17–20 | In-portal messaging. OAuth SSO (Google, LinkedIn). WCAG 2.1 AA audit & remediation. Performance optimisation. UAT & penetration testing. Public launch. |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low alumni adoption | Medium | High | Email campaign to existing database; pre-seeded profiles; incentivise with early-access benefits |
| Data quality issues from CSV import | High | Medium | Robust validation; duplicate detection; admin review queue |
| GDPR non-compliance | Low | High | DPO review before launch; consent-first design; right-to-erasure in Phase 1 |
| Scope creep delaying launch | Medium | Medium | Strict MoSCoW prioritisation; Phase 4 features deprioritised if schedule slips |
| Payment integration failure (Stripe) | Low | Medium | Paid events deferred to Phase 3; fallback: manual payment confirmation |

---

## 11. Dependencies & Assumptions

**External dependencies:** Stripe (payments) · Resend (transactional email) · Google/LinkedIn OAuth · Cloud hosting (AWS / Azure / GCP)

**Institutional dependencies:** Access to existing alumni records for CSV seeding · Designated admin users identified before UAT · Brand guidelines provided for UI theming

**Key assumptions:** Institution owns and is legally entitled to use the alumni data they import. Single-institution deployment (multi-tenancy out of scope for v1).

**Out of scope (v1):** Native mobile app · Alumni mentorship matching · Job board · Donation/fundraising module · Multi-tenancy · Forum/community boards

---

## 12. Technical Specification — Next.js + Supabase

### 12.1 Technology Stack

| Layer | Package / Service | Version |
|-------|------------------|---------|
| Framework | Next.js (App Router, RSC) | 15.x |
| Language | TypeScript (strict mode) | 5.x |
| Database | Supabase Postgres (managed) | PG 15 |
| Auth | Supabase Auth (email + OAuth) | v2 |
| Storage | Supabase Storage (S3-compatible) | v2 |
| Client SDK | @supabase/ssr (server + browser) | latest |
| Realtime | Supabase Realtime | v2 |
| Styling | Tailwind CSS v4 | 4.x |
| UI components | shadcn/ui (Radix primitives) | latest |
| Forms | React Hook Form + Zod | RHF 7 |
| Search | Postgres full-text search (tsvector) | native |
| Email | Resend + React Email | v3 |
| Payments | Stripe (paid events, Phase 3) | v2025 |
| Image processing | react-image-crop + sharp (server) | latest |
| QR codes | qrcode (Node) server-side | latest |
| Rich text editor | @tiptap/react + @tiptap/starter-kit | latest |
| Charts | recharts | latest |
| CSV parsing | papaparse | latest |
| Date formatting | date-fns | latest |
| Deployment | Vercel (Next.js) + Supabase Cloud | managed |
| Migrations | Supabase CLI (supabase db push) | latest |

### 12.2 Project Structure

```
alumni-portal/
├── app/
│   ├── (public)/                   # unauthenticated routes
│   │   ├── page.tsx                # landing
│   │   ├── alumni/
│   │   │   ├── page.tsx            # searchable directory listing
│   │   │   └── [id]/page.tsx       # public profile page
│   │   ├── events/
│   │   │   ├── page.tsx            # events listing + calendar
│   │   │   └── [id]/page.tsx       # event detail + register CTA
│   │   └── auth/
│   │       ├── login/page.tsx
│   │       ├── register/page.tsx
│   │       ├── forgot-password/page.tsx
│   │       ├── reset-password/page.tsx
│   │       └── callback/route.ts   # OAuth redirect handler
│   │
│   ├── (alumni)/                   # alumni-only (middleware guards)
│   │   ├── dashboard/page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx            # view own profile
│   │   │   └── edit/page.tsx       # edit profile
│   │   ├── events/
│   │   │   └── [id]/register/page.tsx
│   │   └── messages/page.tsx
│   │
│   ├── (admin)/                    # admin-only (middleware guards)
│   │   └── admin/
│   │       ├── layout.tsx          # sidebar nav
│   │       ├── page.tsx            # dashboard home + analytics
│   │       ├── alumni/page.tsx     # alumni management DataTable
│   │       ├── events/
│   │       │   ├── page.tsx        # events list
│   │       │   └── [id]/page.tsx   # event edit + registrant list
│   │       ├── audit/page.tsx      # audit log
│   │       └── settings/page.tsx
│   │
│   └── api/
│       ├── alumni/route.ts
│       ├── events/route.ts
│       ├── registrations/route.ts
│       ├── registrations/[id]/checkin/route.ts
│       ├── upload/avatar/route.ts
│       ├── admin/export/alumni/route.ts
│       └── webhooks/stripe/route.ts
│
├── components/
│   ├── alumni/                     # AlumniCard, ProfileHeader, DegreeList...
│   ├── events/                     # EventCard, RegistrationForm...
│   ├── admin/                      # DataTable, StatsCard, AuditLog...
│   └── ui/                         # shadcn/ui re-exports
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # browser client
│   │   ├── server.ts               # server client (cookies)
│   │   └── admin.ts                # service-role client (server-only)
│   ├── validations/                # Zod schemas
│   ├── utils/                      # helpers
│   └── email/                      # React Email templates
│
├── middleware.ts                   # auth + role gating
├── supabase/
│   ├── migrations/                 # SQL migration files (numbered)
│   └── functions/                  # Edge Functions
│       ├── send-event-reminders/
│       ├── promote-waitlist/
│       └── send-post-event-survey/
├── SPEC.md                         # this file
└── .env.local
```

---

## 13. Database Schema

> All tables live in the `public` schema. UUID primary keys throughout. Timestamps are `timestamptz` stored in UTC.

### 13.1 `profiles` (extends auth.users)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | uuid | PK · FK→auth.users | Same as Supabase Auth user ID |
| full_name | text | NOT NULL | Max 100 chars |
| email | text | NOT NULL · UNIQUE | Mirrors auth.users.email; never exposed publicly |
| avatar_url | text | NULLABLE | Supabase Storage public URL |
| phone | text | NULLABLE | E.164 format (e.g., +923001234567) |
| postal_address | text | NULLABLE | Free-text, max 500 chars |
| city | text | NULLABLE | — |
| country | char(2) | NULLABLE | ISO 3166-1 alpha-2 |
| bio | text | NULLABLE | Max 500 chars, plain text |
| privacy_settings | jsonb | NOT NULL · DEFAULT | `{"email":"private","phone":"private","postal_address":"private","city":"alumni_only","employment":"public"}` |
| status | text | NOT NULL · DEFAULT 'pending_email' | CHECK: pending_email \| pending_admin \| active \| suspended |
| directory_visible | boolean | DEFAULT true | Alumni opt-out of directory |
| completeness_score | int2 | DEFAULT 0 | 0–100; updated by DB trigger |
| search_vector | tsvector | GENERATED | Full-text index over name + bio |
| created_at | timestamptz | DEFAULT now() | — |
| updated_at | timestamptz | DEFAULT now() | Updated by trigger |

### 13.2 `degrees` (one row per degree per alumnus)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | uuid | PK · DEFAULT gen_random_uuid() | — |
| profile_id | uuid | FK→profiles.id · ON DELETE CASCADE | — |
| level | text | NOT NULL | CHECK: BS \| MS \| PhD |
| registration_no | text | NOT NULL | Validated against DEGREE_REGISTRATION_REGEX |
| intake_year | int2 | NOT NULL | CHECK BETWEEN 1980 AND EXTRACT(YEAR FROM now())+1 |
| graduation_year | int2 | NOT NULL | CHECK >= intake_year |
| created_at | timestamptz | DEFAULT now() | — |

**Constraint:** UNIQUE(profile_id, level)

### 13.3 `employment_history` (LinkedIn-style)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | uuid | PK | — |
| profile_id | uuid | FK→profiles · CASCADE | — |
| job_title | text | NOT NULL | Max 100 chars |
| company | text | NOT NULL | Max 100 chars |
| employment_type | text | NULLABLE | full_time \| part_time \| contract \| freelance \| internship \| self_employed |
| start_month | date | NOT NULL | Stored as first day of month; display as MMM YYYY |
| end_month | date | NULLABLE | NULL = currently employed here |
| city | text | NULLABLE | — |
| country | char(2) | NULLABLE | — |
| description | text | NULLABLE | Max 300 chars |
| sort_order | int2 | DEFAULT 0 | Manual reorder |

### 13.4 `career_highlights`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | uuid | PK | — |
| profile_id | uuid | FK→profiles · CASCADE | — |
| title | text | NOT NULL | Max 200 chars |
| year | int2 | NULLABLE | — |
| description | text | NULLABLE | Max 500 chars |
| sort_order | int2 | DEFAULT 0 | — |

### 13.5 `skills`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | UNIQUE; e.g., "Embedded Systems", "VLSI Design" |
| is_predefined | boolean | Admin-managed taxonomy vs. alumni-created custom tag |

### 13.6 `profile_skills` (junction)

| Column | Type | Notes |
|--------|------|-------|
| profile_id | uuid | FK→profiles · CASCADE · PK (composite) |
| skill_id | uuid | FK→skills · CASCADE · PK (composite) |

### 13.7 `events`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | uuid | PK | — |
| title | text | NOT NULL | — |
| description | text | NULLABLE | Rich text stored as sanitised HTML |
| category | text | NOT NULL | reunion \| networking \| webinar \| sports \| cultural \| workshop |
| event_type | text | NOT NULL | in_person \| virtual \| hybrid |
| starts_at | timestamptz | NOT NULL | — |
| ends_at | timestamptz | NOT NULL | — |
| location | text | NULLABLE | Venue name or "Online" |
| capacity | int4 | NULLABLE | NULL = unlimited |
| allows_guests | boolean | DEFAULT false | Whether guest_count field is shown |
| is_paid | boolean | DEFAULT false | — |
| price | numeric(10,2) | NULLABLE | Required if is_paid = true |
| stripe_price_id | text | NULLABLE | Set after Stripe price object creation |
| cancel_cutoff_hours | int2 | DEFAULT 24 | Hours before event that cancellation is allowed |
| send_survey | boolean | DEFAULT false | — |
| survey_url | text | NULLABLE | Link to survey form (Tally, Google Forms, etc.) |
| published | boolean | DEFAULT false | Only published events appear publicly |
| created_by | uuid | FK→profiles | Admin who created the event |
| created_at | timestamptz | DEFAULT now() | — |

### 13.8 `event_registrations`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | uuid | PK | — |
| event_id | uuid | FK→events · CASCADE | UNIQUE(event_id, profile_id) |
| profile_id | uuid | FK→profiles · CASCADE | — |
| status | text | NOT NULL | confirmed \| waitlisted \| cancelled \| attended |
| waitlist_position | int4 | NULLABLE | Populated when status = waitlisted |
| qr_token | text | UNIQUE | UUID embedded in QR code |
| dietary_requirements | text | NULLABLE | — |
| guest_count | int2 | DEFAULT 0 | — |
| stripe_payment_intent | text | NULLABLE | For paid events |
| registered_at | timestamptz | DEFAULT now() | — |

### 13.9 `admin_roles`

| Column | Type | Notes |
|--------|------|-------|
| profile_id | uuid | FK→profiles · CASCADE · PK (composite) |
| role | text | CHECK: super_admin \| events_manager \| content_manager · PK (composite) |
| granted_by | uuid | FK→profiles; must be super_admin |
| granted_at | timestamptz | DEFAULT now() |

### 13.10 `audit_logs` (immutable write-only)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK · GENERATED ALWAYS AS IDENTITY |
| actor_id | uuid | FK→profiles (nullable for system events) |
| action | text | e.g., "profile.approved", "event.created", "role.granted" |
| target_type | text | profile \| event \| registration \| role \| system |
| target_id | text | UUID or other identifier of the affected record |
| metadata | jsonb | Before/after snapshot or event-specific data |
| created_at | timestamptz | DEFAULT now() — NO UPDATE or DELETE allowed |

---

## 14. Row-Level Security (RLS) Policies

RLS is enabled on all tables. The service-role client (used only in Server Actions and Route Handlers) bypasses RLS. All browser-side Supabase calls use the anon/user JWT.

```sql
-- Helper functions (SECURITY DEFINER STABLE)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_roles WHERE profile_id = user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_active_alumni(user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND status = 'active'
  );
$$;
```

### Policy Summary

| Table | Operation | Policy |
|-------|-----------|--------|
| profiles | SELECT | `auth.uid() = id` OR `(status = 'active' AND directory_visible = true AND is_active_alumni(auth.uid()))` |
| profiles | SELECT (own) | `auth.uid() = id` — always allowed regardless of status, so pending alumni can view their own profile |
| profiles | UPDATE | `auth.uid() = id` (own profile only) |
| profiles | UPDATE status | `is_admin(auth.uid())` |
| degrees | SELECT | `auth.uid() = profile_id` OR `(is_active_alumni(auth.uid()) AND profile is active + visible)` |
| degrees | INSERT/UPDATE/DELETE | `auth.uid() = profile_id` |
| employment_history | SELECT | respects privacy_settings field + viewer session |
| employment_history | INSERT/UPDATE/DELETE | `auth.uid() = profile_id` |
| events | SELECT | `published = true` (public) OR `is_admin(auth.uid())` |
| events | INSERT/UPDATE/DELETE | `is_admin(auth.uid())` |
| event_registrations | SELECT | `auth.uid() = profile_id` OR `is_admin(auth.uid())` |
| event_registrations | INSERT | `is_active_alumni(auth.uid())` |
| audit_logs | SELECT | `is_admin(auth.uid())` WHERE role = 'super_admin' |
| audit_logs | INSERT | service role only |
| audit_logs | UPDATE/DELETE | **DENIED for all** — `USING(false)` |

---

## 15. Authentication Flow

### Email / Password Registration
1. User submits registration form → `supabase.auth.signUp()`
2. Supabase sends verification email (Resend SMTP)
3. On verify click → `/auth/callback` route exchanges code for session
4. Server Action creates `profiles` row with `status = 'pending_admin'`
5. Admin approves → status updated to `'active'`

### OAuth (Google / LinkedIn)
1. `supabase.auth.signInWithOAuth()` with PKCE flow
2. Redirect to `/auth/callback?code=…`
3. Route Handler calls `exchangeCodeForSession(code)`
4. If new user → profile created, `status = 'pending_admin'`
5. If returning user → session refreshed, redirect to dashboard

### Middleware Route Protection

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { session } } = await supabase.auth.getSession()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAlumniRoute = request.nextUrl.pathname.startsWith('/dashboard')
    || request.nextUrl.pathname.startsWith('/profile')
    || request.nextUrl.pathname.startsWith('/messages')

  if (!session && (isAdminRoute || isAlumniRoute)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAdminRoute) {
    // Use service-role client to check admin_roles — bypasses RLS
    const { data: role } = await adminSupabase
      .from('admin_roles').select('role')
      .eq('profile_id', session.user.id).single()
    if (!role) return NextResponse.redirect('/dashboard')
  }
}
```

---

## 16. API Routes (Next.js Route Handlers)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/alumni | Paginated directory search (q, filters, sort, page) | **alumni** (active session required — 401 if unauthed, 403 if not active) |
| GET | /api/alumni/[id] | Profile detail (privacy-filtered per viewer's alumni status) | **alumni** (active session required) |
| PATCH | /api/alumni/[id] | Update own profile fields | alumni |
| POST | /api/alumni/[id]/degrees | Add/update degree entries | alumni |
| POST | /api/alumni/[id]/employment | Add employment entry | alumni |
| PATCH | /api/alumni/[id]/employment/[eid] | Update employment entry | alumni |
| DELETE | /api/alumni/[id]/employment/[eid] | Delete employment entry | alumni |
| GET | /api/events | List published events (filters, pagination) | public |
| GET | /api/events/[id] | Event detail | public |
| POST | /api/events | Create event | admin |
| PATCH | /api/events/[id] | Update event | admin |
| POST | /api/registrations | Register for event (handles capacity + waitlist) | alumni |
| DELETE | /api/registrations/[id] | Cancel registration + promote waitlist | alumni |
| POST | /api/registrations/[id]/checkin | QR check-in scan (sets status = attended) | admin |
| POST | /api/upload/avatar | Image → sharp resize → Supabase Storage | alumni |
| GET | /api/admin/export/alumni | Stream CSV export of alumni data | super_admin |
| POST | /api/webhooks/stripe | payment_intent.succeeded → confirm registration | stripe-sig |

### Key API Implementation Notes

**GET /api/alumni:**
- Use anon Supabase client (let RLS enforce `status=active` + `directory_visible=true`)
- Full-text search: `.textSearch('search_vector', q, {config:'english', type:'websearch'})`
- Never include `email`, `phone`, `postal_address` in response regardless of privacy settings
- Pagination: `range((page-1)*20, page*20-1)`, return `{data, total_count, page, total_pages}`

**POST /api/registrations:**
- Use service-role client for atomicity of the capacity check
- Manually verify session and `profile.status='active'` before operating
- Check for duplicate registration before capacity check
- Capacity lock: `SELECT COUNT(*) ... FOR UPDATE`
- `qr_token = crypto.randomUUID()`

---

## 17. Supabase Storage Buckets

| Bucket | Access | Path Pattern | Notes |
|--------|--------|-------------|-------|
| avatars | public | `{profile_id}/avatar.webp` | Converted to WebP 400×400 by Route Handler before upload |
| event-assets | public | `{event_id}/{filename}` | Uploaded by admins only |
| exports | private | `{export_id}.csv` | Signed URLs with 15-min TTL. Deleted after download. |

---

## 18. Full-Text Search Implementation

Uses Postgres `tsvector` — no external search service needed at this scale.

```sql
-- Trigger: maintain search_vector on profiles
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_search_vector_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_search_vector();

-- GIN index for fast full-text search
CREATE INDEX idx_profiles_search ON profiles USING gin(search_vector);

-- Supporting indexes
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_degrees_level_year ON degrees(level, graduation_year);
```

---

## 19. Supabase Edge Functions

All functions live in `supabase/functions/`. Written in Deno. Use `esm.sh` imports.

```typescript
// Common import pattern for all Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)
```

### Function: `send-event-reminders`

- **Schedule:** `0 8 * * *` (daily at 08:00 UTC)
- **Logic:** Query events with `starts_at BETWEEN now()+6d23h AND now()+7d1h` (7-day window) OR `BETWEEN now()+23h AND now()+25h` (24-hr window). Fetch confirmed registrations with profile data. Send Resend batch emails (max 100 per call).

### Function: `promote-waitlist`

- **Trigger:** Supabase DB webhook on `event_registrations` UPDATE where `new.status = 'cancelled'`
- **Logic:** Find the registration with the lowest `waitlist_position` for the same event, update to `confirmed`, `waitlist_position = null`, send confirmation email with ICS.

### Function: `send-post-event-survey`

- **Schedule:** `0 * * * *` (hourly)
- **Logic:** Query events where `ends_at BETWEEN now()-60m AND now()` AND `send_survey = true` AND `survey_url IS NOT NULL`. Fetch `attended` registrations. Send email with survey link.

---

## 20. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server only — never expose to client

# Email
RESEND_API_KEY=re_<key>
EMAIL_FROM=noreply@alumni.university.edu.pk

# Stripe (Phase 3)
STRIPE_SECRET_KEY=sk_<key>                      # server only
STRIPE_WEBHOOK_SECRET=whsec_<key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_<key>

# App
NEXT_PUBLIC_SITE_URL=https://alumni.university.edu.pk

# Validation
DEGREE_REGISTRATION_REGEX=^\d{4}-CSE-\d{4}$   # configurable per institution
```

---

## 21. UI/UX Design Theme — Supabase Style

> **Every Cursor prompt from E-01 onward must reference this section with `@SPEC.md section 21`.** All UI decisions — colours, spacing, typography, component patterns — are derived from here. No divergence.

---

### 21.1 Design Philosophy

The Alumni Portal UI follows the **Supabase Studio / Dashboard aesthetic** exactly: a dark-first, developer-grade interface characterised by layered dark surfaces, a single green brand accent, ultra-fine borders for depth, and restrained typography. The result feels technical, trustworthy, and clean — never decorative.

**Core principles:**
- **Dark-native.** Every surface starts dark. Light theme is a secondary consideration built via CSS variable swap.
- **Depth through borders, not shadows.** Box-shadows are absent. Hierarchy is expressed by stepping through the surface colour scale and varying border opacity.
- **Green is identity, not decoration.** `#3ECF8E` is used only for: primary CTA buttons, active nav states, links, brand logo accent, and critical focus rings. Never as a background fill on large areas.
- **Two weights only.** `400` (regular) for all body and label text. `500` (medium) for interactive elements, button labels, and nav links. `700` is never used.
- **No gradients in UI chrome.** Gradients are reserved for hero/marketing sections only.
- **Sentence case everywhere.** Headings, labels, buttons, badges — all sentence case. Never ALL CAPS (except `font-mono` technical labels) and never Title Case.

---

### 21.2 Colour System

#### Brand colour

| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-default` | `#3ECF8E` | Primary CTA bg, active nav indicator, links, focus rings |
| `--brand-600` | `#29B975` | CTA hover state |
| `--brand-400` | `#5DDBA3` | Brand text on dark backgrounds |
| `--brand-200` | `#A8EDD1` | Very light brand tint for badges |

#### Dark theme surface scale (default theme)

This is the **primary theme**. Surfaces step through dark grey from deepest background to raised foreground.

| Token | Hex | Tailwind class | Usage |
|-------|-----|----------------|-------|
| `--bg-default` | `#1C1C1C` | `bg-background` | Base page canvas — outermost shell |
| `--bg-alternative` | `#161616` | `bg-alternative` | Data grid empty space, code blocks bg |
| `--bg-surface-75` | `#1C1C1C` | `bg-surface-75` | Subtle inset within a surface (same as bg on purpose) |
| `--bg-surface-100` | `#242424` | `bg-surface-100` | **Primary content panels**, sidebar, main cards |
| `--bg-surface-200` | `#2A2A2A` | `bg-surface-200` | Secondary cards, table headers, form section bg |
| `--bg-surface-300` | `#313131` | `bg-surface-300` | Nested panels, code block inner bg |
| `--bg-surface-400` | `#3C3C3C` | `bg-surface-400` | Hover state for rows, selected states |
| `--bg-overlay` | `rgba(0,0,0,0.7)` | `bg-overlay` | Modal/dialog backdrop |
| `--bg-dash-sidebar` | `#1C1C1C` | `bg-dash-sidebar` | Left sidebar background |
| `--bg-dash-canvas` | `#161616` | `bg-dash-canvas` | Right-side canvas / main content area bg |
| `--bg-control` | `#2A2A2A` | `bg-control` | Form input backgrounds |
| `--bg-button` | `#2E2E2E` | `bg-button` | Default (secondary) button bg |
| `--bg-selection` | `rgba(62,207,142,0.1)` | `bg-selection` | Selected row / text selection highlight |

#### Foreground / Text scale

| Token | Hex (dark) | Tailwind class | Usage |
|-------|-----------|----------------|-------|
| `--foreground-default` | `#EDEDED` | `text-foreground` | Primary body text, headings |
| `--foreground-light` | `#ACACAC` | `text-foreground-light` | Secondary labels, descriptions |
| `--foreground-lighter` | `#6E6E6E` | `text-foreground-lighter` | Placeholder text, disabled states |
| `--foreground-muted` | `#4A4A4A` | `text-foreground-muted` | Lowest-emphasis hints, watermarks |
| `--foreground-contrast` | `#FFFFFF` | `text-foreground-contrast` | Text on brand-green bg (CTA buttons) |
| `--foreground-brand` | `#3ECF8E` | `text-brand` | Brand-coloured text links, active labels |
| `--foreground-destructive` | `#F87171` | `text-destructive` | Error messages, delete confirmations |
| `--foreground-warning` | `#FBBF24` | `text-warning` | Warning messages, caution states |

#### Border scale

Supabase uses a tight ladder of border opacities. No box-shadows — only borders create depth.

| Token | Value | Tailwind class | Usage |
|-------|-------|----------------|-------|
| `--border-default` | `#2E2E2E` | `border` | Standard card / panel border |
| `--border-muted` | `#242424` | `border-muted` | Subtle internal dividers |
| `--border-secondary` | `#383838` | `border-secondary` | Hover-elevated border, table row separators |
| `--border-strong` | `#4A4A4A` | `border-strong` | Emphasised borders, active input outline |
| `--border-stronger` | `#5E5E5E` | `border-stronger` | Focused input ring, drag-over states |
| `--border-control` | `#383838` | `border-control` | Form input default border |
| `--border-overlay` | `#2E2E2E` | `border-overlay` | Modal / popover border |
| `--border-alternative` | `#242424` | `border-alternative` | Alternative for bg-alternative containers |
| `--border-brand` | `#3ECF8E` | `border-brand` | Active tab underline, focused brand input |
| `--border-destructive` | `#7F1D1D` | `border-destructive` | Error input outline |

#### Semantic state colours

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Brand / Success | `#0C2B1F` | `#3ECF8E` | `#134D35` |
| Destructive / Error | `#2D1010` | `#F87171` | `#7F1D1D` |
| Warning | `#2B1D06` | `#FBBF24` | `#78350F` |
| Info | `#0A1929` | `#60A5FA` | `#1E3A5F` |

---

### 21.3 Typography

#### Font families

```css
/* Primary — load from Google Fonts or self-host */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace — for code, technical labels, registration numbers */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', ui-monospace, monospace;
```

> **Note on Circular:** Supabase's marketing site uses Circular (paid font). For the portal, Inter is the direct open-source substitute — same geometric sans structure, same weight feel.

#### Type scale

| Role | Size | Weight | Line-height | Letter-spacing | Tailwind |
|------|------|--------|------------|----------------|---------|
| Page title (h1) | 24px | 500 | 1.2 | -0.3px | `text-2xl font-medium` |
| Section heading (h2) | 18px | 500 | 1.3 | -0.2px | `text-lg font-medium` |
| Card heading (h3) | 15px | 500 | 1.4 | -0.16px | `text-base font-medium` |
| Body default | 14px | 400 | 1.6 | 0 | `text-sm` |
| Body small | 13px | 400 | 1.5 | 0 | `text-[13px]` |
| Label / caption | 12px | 400 | 1.4 | 0 | `text-xs` |
| Mono technical label | 12px | 400 | 1 | 0.8px | `text-xs font-mono uppercase tracking-wide` |
| Sidebar nav link | 13px | 500 | 1 | 0 | `text-[13px] font-medium` |
| Button label | 14px | 500 | 1 | 0 | `text-sm font-medium` |

**Rules:**
- Heading hierarchy is expressed through **size difference**, not weight difference (no 700).
- `text-foreground` for primary text. `text-foreground-light` for descriptions. `text-foreground-lighter` for placeholders.
- `font-mono` for: registration numbers, IDs, code snippets, technical timestamps.

---

### 21.4 Spacing & Layout

```
Base unit: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

| Pattern | Value | Tailwind |
|---------|-------|---------|
| Page outer padding | 24px | `p-6` |
| Card internal padding | 16px / 20px | `p-4` / `p-5` |
| Section gap | 24px | `gap-6` |
| Form field gap | 16px | `gap-4` |
| Inline element gap | 8px | `gap-2` |
| Sidebar width | 240px | `w-60` |
| Content max-width | 1280px | `max-w-[1280px]` |
| Admin panel max-width | 1440px | `max-w-[1440px]` |

---

### 21.5 Border Radius

| Element | Radius | Tailwind |
|---------|--------|---------|
| Cards, panels, modals | 8px | `rounded-lg` |
| Buttons (default/secondary) | 6px | `rounded-md` |
| Primary CTA (pill) | 9999px | `rounded-full` |
| Form inputs | 6px | `rounded-md` |
| Badges | 4px | `rounded` |
| Avatar circle | 50% | `rounded-full` |
| Table cells | 0 | — |
| Tooltips | 6px | `rounded-md` |

---

### 21.6 Component Patterns

#### Navigation sidebar (admin + alumni dashboard)

```
bg-dash-sidebar (#1C1C1C)
width: 240px, fixed left
border-right: 1px solid #2E2E2E

Logo area:
  padding: 16px
  Supabase-style wordmark: text-foreground text-sm font-medium
  Brand dot/icon: bg-brand-default rounded-sm w-5 h-5

Nav group labels:
  text-foreground-lighter text-xs uppercase tracking-wider font-mono
  padding: 8px 16px
  margin-top: 24px

Nav items:
  padding: 6px 12px
  border-radius: 6px
  text-foreground-light text-[13px] font-medium
  hover: bg-surface-200 text-foreground
  active: bg-surface-300 text-brand border-l-2 border-brand-default
  gap: 8px (icon + label)
  icon: 16px, text-foreground-lighter
```

#### Top header bar

```
bg-surface-100
border-bottom: 1px solid #2E2E2E
height: 48px
padding: 0 24px
display: flex align-items-center justify-between

Left: breadcrumb path — text-foreground-light text-[13px]
     separator: / in text-foreground-muted

Right: notification icon + avatar chip
  Avatar chip: avatar img or initials circle
    bg-surface-300 rounded-full w-7 h-7 text-xs font-medium
```

#### Cards

```
bg-surface-100
border: 1px solid #2E2E2E
border-radius: 8px
padding: 20px

Card header (when present):
  border-bottom: 1px solid #242424
  padding-bottom: 16px
  margin-bottom: 16px
  title: text-base font-medium text-foreground
  description: text-sm text-foreground-light

Hover state (clickable cards):
  border-color: #383838
  transition: border-color 150ms ease
```

#### Buttons

```
PRIMARY (brand CTA):
  bg-brand-default (#3ECF8E)
  text-foreground-contrast (#FFF) font-medium text-sm
  border-radius: 9999px  ← pill shape exclusively for primary
  padding: 8px 16px
  hover: bg-brand-600 (#29B975)
  active: scale(0.98)
  focus: ring-2 ring-brand-default/30

DEFAULT (secondary):
  bg-button (#2E2E2E)
  text-foreground font-medium text-sm
  border: 1px solid #383838
  border-radius: 6px
  padding: 7px 14px
  hover: bg-surface-300 border-strong
  focus: ring-2 ring-white/10

DESTRUCTIVE:
  bg-transparent text-destructive
  border: 1px solid #7F1D1D
  border-radius: 6px
  hover: bg-destructive/10
  
GHOST:
  bg-transparent text-foreground-light
  border: none border-radius: 6px
  hover: bg-surface-200 text-foreground

SIZE VARIANTS:
  sm: text-xs px-3 py-1.5
  md: text-sm px-3.5 py-2   ← default
  lg: text-sm px-4 py-2.5
  icon: w-8 h-8 p-0
```

#### Form inputs

```
INPUT / TEXTAREA / SELECT:
  bg-control (#2A2A2A)
  border: 1px solid #383838  (border-control)
  border-radius: 6px
  padding: 8px 12px
  text-sm text-foreground
  placeholder: text-foreground-lighter

  focus:
    border-color: #3ECF8E  (border-brand)
    ring: none (Supabase does not use Tailwind ring on inputs)
    outline: none

  error:
    border-color: border-destructive
    + below: text-destructive text-xs mt-1

LABEL:
  text-sm font-medium text-foreground-light
  margin-bottom: 6px
  display: block

HELPER TEXT:
  text-xs text-foreground-lighter
  margin-top: 4px

FORM SECTION CARD:
  bg-surface-100 rounded-lg border border-default p-5
  Form sections within cards are separated by:
    border-top: 1px solid #242424  (border-muted)
    padding-top: 16px  margin-top: 16px
```

#### Tables (admin DataTables)

```
TABLE WRAPPER:
  bg-surface-100 rounded-lg border border-default overflow-hidden

TABLE HEADER ROW:
  bg-surface-200
  text-xs font-medium text-foreground-lighter uppercase tracking-wider
  padding: 10px 16px
  border-bottom: 1px solid #2E2E2E

TABLE DATA ROW:
  bg-transparent  (inherits surface-100)
  padding: 12px 16px
  border-bottom: 1px solid #242424  (border-muted)
  text-sm text-foreground

  hover: bg-surface-400 (subtle highlight, no transition needed)
  selected: bg-selection border-l-2 border-brand-default

LAST ROW:
  border-bottom: none

PAGINATION AREA:
  bg-surface-200 border-top border-default
  padding: 10px 16px
  text-xs text-foreground-light
  flex justify-between align-center
```

#### Badges / pills

```
DEFAULT:
  bg-surface-300 text-foreground-light
  text-xs px-2 py-0.5 rounded

BRAND (active, success):
  bg-brand-default/10 text-brand
  border: 1px solid border-brand/30
  text-xs px-2 py-0.5 rounded

DESTRUCTIVE:
  bg-destructive/10 text-destructive
  border: 1px solid border-destructive/30

WARNING:
  bg-warning/10 text-warning
  border: 1px solid #78350F/30

INFO:
  bg-info/10 text-info
  border: 1px solid #1E3A5F/30
```

#### Stat / KPI cards (admin dashboard)

```
METRIC CARD:
  bg-surface-100 rounded-lg border border-default p-5

  label:  text-xs text-foreground-lighter uppercase tracking-wider font-mono
  value:  text-2xl font-medium text-foreground  mt-2
  delta:  text-xs  (positive: text-brand, negative: text-destructive)  mt-1
  icon:   16px, top-right, text-foreground-lighter

  Hover: border-secondary transition-colors 150ms
```

#### Alumni directory card

```
CARD:
  bg-surface-100 rounded-lg border border-default p-4
  hover: border-secondary cursor-pointer
  transition: border-color 150ms

AVATAR:
  w-10 h-10 rounded-full
  If image: object-cover
  If initials: bg-surface-300 text-foreground-light text-sm font-medium
    flex items-center justify-center

NAME: text-sm font-medium text-foreground  (mt-3)
ROLE LINE: text-xs text-foreground-light  (mt-0.5) — job + company
DEGREE BADGES: inline-flex gap-1 mt-2
  each: bg-surface-300 text-foreground-lighter text-[11px] px-1.5 py-0.5 rounded
LOCATION: text-[11px] text-foreground-lighter mt-2
```

#### Event card

```
CARD:
  bg-surface-100 rounded-lg border border-default overflow-hidden
  hover: border-secondary cursor-pointer

TOP ACCENT BAR (4px tall):
  category-specific colour:
    reunion: bg-brand-default
    networking: bg-blue-500
    webinar: bg-purple-500
    workshop: bg-amber-500
    sports: bg-orange-500
    cultural: bg-pink-500

BODY: p-4
  date: text-xs font-mono text-foreground-lighter uppercase tracking-wide
  title: text-sm font-medium text-foreground mt-1
  location: text-xs text-foreground-light mt-2 flex gap-1 items-center
  badges row: mt-3 flex gap-2
  CTA: mt-4 full-width default button
```

#### Auth pages (login, register)

```
PAGE LAYOUT:
  min-h-screen bg-background flex items-center justify-center
  
CARD:
  bg-surface-100 rounded-lg border border-default p-8
  width: 400px (max-w-[400px] w-full)

LOGO AREA (top of card):
  flex items-center gap-2 mb-8
  Icon: 24px brand green square rounded-sm
  Name: text-foreground text-base font-medium

TITLE: text-lg font-medium text-foreground mb-1
SUBTITLE: text-sm text-foreground-light mb-6

DIVIDER:
  flex items-center gap-3 my-4
  lines: border-t border-default flex-1
  text: text-xs text-foreground-lighter "or continue with"

OAUTH BUTTON:
  Full width, default button style
  icon: 16px left-aligned
```

---

### 21.7 Global CSS Setup

Add this to `app/globals.css` (after Tailwind imports):

```css
@import "tailwindcss";

/* ─── Supabase-style dark theme (default) ──────────────────── */
:root {
  /* Surfaces */
  --background:          220 13% 11%;     /* #1C1C1C  */
  --background-alt:      220 13%  9%;     /* #161616  */
  --surface-75:          220 13% 11%;     /* #1C1C1C  */
  --surface-100:         220 13% 14%;     /* #242424  */
  --surface-200:         220 13% 16%;     /* #2A2A2A  */
  --surface-300:         220 13% 19%;     /* #313131  */
  --surface-400:         220 10% 24%;     /* #3C3C3C  */
  --overlay:             220 13% 11%;     /* #1C1C1C  */

  /* Foreground */
  --foreground:          0 0% 93%;        /* #EDEDED  */
  --foreground-light:    0 0% 67%;        /* #ACACAC  */
  --foreground-lighter:  0 0% 43%;        /* #6E6E6E  */
  --foreground-muted:    0 0% 29%;        /* #4A4A4A  */
  --foreground-contrast: 0 0% 100%;       /* #FFFFFF  */

  /* Brand */
  --brand:               152 60% 53%;     /* #3ECF8E  */
  --brand-600:           152 60% 44%;     /* #29B975  */

  /* Borders */
  --border:              220 10% 18%;     /* #2E2E2E  */
  --border-muted:        220 13% 14%;     /* #242424  */
  --border-secondary:    220 10% 22%;     /* #383838  */
  --border-strong:       220 10% 29%;     /* #4A4A4A  */
  --border-control:      220 10% 22%;     /* #383838  */
  --border-overlay:      220 10% 18%;     /* #2E2E2E  */

  /* Semantic */
  --destructive:         0 70% 71%;       /* #F87171  */
  --destructive-bg:      0 60% 12%;       /* #2D1010  */
  --warning:             45 96% 56%;      /* #FBBF24  */
  --warning-bg:          35 80% 10%;      /* #2B1D06  */

  /* Radii */
  --radius: 0.5rem;
}

/* ─── Light theme override ────────────────────────────────── */
.light {
  --background:          0 0% 99%;
  --surface-100:         0 0% 97%;
  --surface-200:         0 0% 94%;
  --surface-300:         0 0% 91%;
  --foreground:          220 13% 10%;
  --foreground-light:    220 10% 40%;
  --foreground-lighter:  220 10% 60%;
  --border:              220 13% 88%;
  --border-muted:        220 13% 92%;
  --border-secondary:    220 13% 84%;
  --border-control:      220 13% 84%;
}

/* ─── Tailwind mapping ─────────────────────────────────────── */
@theme inline {
  --color-background:         hsl(var(--background));
  --color-background-alt:     hsl(var(--background-alt));
  --color-surface-75:         hsl(var(--surface-75));
  --color-surface-100:        hsl(var(--surface-100));
  --color-surface-200:        hsl(var(--surface-200));
  --color-surface-300:        hsl(var(--surface-300));
  --color-surface-400:        hsl(var(--surface-400));
  --color-foreground:         hsl(var(--foreground));
  --color-foreground-light:   hsl(var(--foreground-light));
  --color-foreground-lighter: hsl(var(--foreground-lighter));
  --color-foreground-muted:   hsl(var(--foreground-muted));
  --color-foreground-contrast:hsl(var(--foreground-contrast));
  --color-brand:              hsl(var(--brand));
  --color-brand-600:          hsl(var(--brand-600));
  --color-border:             hsl(var(--border));
  --color-border-muted:       hsl(var(--border-muted));
  --color-border-secondary:   hsl(var(--border-secondary));
  --color-border-strong:      hsl(var(--border-strong));
  --color-border-control:     hsl(var(--border-control));
  --color-destructive:        hsl(var(--destructive));
  --color-destructive-bg:     hsl(var(--destructive-bg));
  --color-warning:            hsl(var(--warning));
  --color-warning-bg:         hsl(var(--warning-bg));
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --radius: 0.5rem;
}

/* ─── Base resets ──────────────────────────────────────────── */
body {
  @apply bg-background text-foreground;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Input / Select global style — matches Supabase Studio exactly */
input, textarea, select {
  @apply bg-surface-200 border border-border-control rounded-md
         text-sm text-foreground placeholder:text-foreground-lighter
         px-3 py-2 w-full outline-none
         focus:border-brand transition-colors duration-150;
}

/* Scrollbar — thin Supabase-style */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: hsl(var(--background)); }
::-webkit-scrollbar-thumb { background: hsl(var(--border-secondary)); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--border-strong)); }
```

---

### 21.8 Tailwind Config Extension (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background:           'hsl(var(--background))',
        'background-alt':     'hsl(var(--background-alt))',
        'surface-75':         'hsl(var(--surface-75))',
        'surface-100':        'hsl(var(--surface-100))',
        'surface-200':        'hsl(var(--surface-200))',
        'surface-300':        'hsl(var(--surface-300))',
        'surface-400':        'hsl(var(--surface-400))',
        foreground:           'hsl(var(--foreground))',
        'foreground-light':   'hsl(var(--foreground-light))',
        'foreground-lighter': 'hsl(var(--foreground-lighter))',
        'foreground-muted':   'hsl(var(--foreground-muted))',
        'foreground-contrast':'hsl(var(--foreground-contrast))',
        brand:                'hsl(var(--brand))',
        'brand-600':          'hsl(var(--brand-600))',
        border:               'hsl(var(--border))',
        'border-muted':       'hsl(var(--border-muted))',
        'border-secondary':   'hsl(var(--border-secondary))',
        'border-strong':      'hsl(var(--border-strong))',
        'border-control':     'hsl(var(--border-control))',
        destructive:          'hsl(var(--destructive))',
        'destructive-bg':     'hsl(var(--destructive-bg))',
        warning:              'hsl(var(--warning))',
        'warning-bg':         'hsl(var(--warning-bg))',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

### 21.9 shadcn/ui Config (`components.json`)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

After init, override the shadcn default CSS variables in `globals.css` with the Supabase values above. The key overrides for shadcn compatibility:

```css
/* shadcn variable bridge — maps shadcn internals to Supabase tokens */
:root {
  --card:             hsl(var(--surface-100));
  --card-foreground:  hsl(var(--foreground));
  --popover:          hsl(var(--surface-200));
  --popover-foreground: hsl(var(--foreground));
  --primary:          hsl(var(--brand));
  --primary-foreground: hsl(var(--foreground-contrast));
  --secondary:        hsl(var(--surface-300));
  --secondary-foreground: hsl(var(--foreground));
  --muted:            hsl(var(--surface-200));
  --muted-foreground: hsl(var(--foreground-lighter));
  --accent:           hsl(var(--surface-300));
  --accent-foreground: hsl(var(--foreground));
  --destructive:      hsl(var(--destructive));
  --destructive-foreground: hsl(var(--foreground-contrast));
  --input:            hsl(var(--border-control));
  --ring:             hsl(var(--brand));
}
```

---

### 21.10 Page-Level Layout Patterns

#### Public pages (directory, events, profile)

```
<html class="dark">  ← default dark
<body class="bg-background min-h-screen">

  <nav>
    bg-surface-100 border-b border-default h-14
    max-w-[1280px] mx-auto px-6
    logo left | nav links centre | CTA right
  </nav>

  <main class="max-w-[1280px] mx-auto px-6 py-8">
    {children}
  </main>

  <footer>
    bg-surface-100 border-t border-default
    text-xs text-foreground-lighter
    padding: 24px
  </footer>
```

#### Alumni dashboard

```
<div class="flex h-screen bg-background overflow-hidden">

  <aside class="w-60 bg-dash-sidebar border-r border-default flex-shrink-0">
    {sidebar nav}
  </aside>

  <div class="flex-1 flex flex-col overflow-hidden">
    <header class="h-12 bg-surface-100 border-b border-default px-6">
      {breadcrumb + user avatar}
    </header>
    <main class="flex-1 overflow-auto p-6 bg-dash-canvas">
      {page content}
    </main>
  </div>

</div>
```

#### Admin dashboard

```
Same as alumni dashboard layout.
Sidebar width: 240px
Admin sidebar groups:
  — Overview
  — Management: Alumni, Events
  — System: Audit Log, Settings
```

---

### 21.11 Supabase-Specific UX Patterns

These interaction patterns are canonical to Supabase Studio. Use them consistently:

| Pattern | Implementation |
|---------|---------------|
| **Inline save** | Each form section has its own "Save" button — never one giant "Save all" at the bottom |
| **Optimistic updates** | Update UI immediately, revert on server error with toast |
| **Empty states** | Centred icon (40px, text-foreground-lighter) + heading + description + CTA button. Never just "No data." |
| **Loading skeletons** | `bg-surface-300 animate-pulse rounded` matching exact shape of content. Never spinners for page-level loads. |
| **Toast notifications** | Sonner, bottom-right, `bg-surface-200 border border-default text-foreground text-sm`. Duration: 4s success / 6s error |
| **Confirm destructive actions** | Always a modal with `bg-surface-200`. Input the resource name to confirm delete (Supabase-style text confirmation). |
| **Table row actions** | Appear on row hover as ghost icon buttons right-aligned. Never always-visible action columns. |
| **Pagination** | URL-based (`?page=N`). Show "Showing X–Y of Z" + prev/next + page number buttons. |
| **Filter bar** | Sticky below the page header. `bg-surface-100 border-b border-muted`. Filters as pill-shaped dropdown triggers. |
| **Section headers** | h3 text-base font-medium text-foreground + text-sm text-foreground-light description on the line below. No decorative lines or backgrounds. |

---

### 21.12 Font Loading (`app/layout.tsx`)

```typescript
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// JetBrains Mono for mono — free and excellent
import { JetBrains_Mono } from 'next/font/google'
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

---

## 22. SDD Epic Build Plan — Cursor

### The Loop (repeat for every epic)

1. Open Cursor → new chat → type `@SPEC.md` then paste the epic spec block below
2. Cursor scaffolds the files
3. Run the app, verify all "done when" gates manually
4. `git commit -m "epic-N: <short description>"`
5. Paste the next epic spec

**Rules:**
- Never start a new epic until all gates for the current one pass
- One branch per epic: `git checkout -b epic-N-<title>`
- Each epic only imports code committed in a previous epic
- The spec block is what you paste into Cursor — keep SPEC.md open alongside code
- **Every epic must reference `@SPEC.md section 21` for all UI decisions — no divergence from the Supabase theme**

---

### E-00 — UI theme retrofit (run after E-03, before E-04)

This is a **one-time retrofit** epic. Run it after E-03 gates pass to bring all existing UI (auth pages, health page, any scaffold pages) into full compliance with the Supabase design theme before feature work begins.

**Cursor spec:**
```
Context: E-01 through E-03 are complete. Auth pages, registration, login, callback,
and password reset pages exist. Now applying the full Supabase-style design system
to ALL existing UI before building any new features.
Reference: @SPEC.md section 21 — this section is the single source of truth for
every colour, spacing, typography, and component decision. Read it fully first.

Task 1 — Global setup:
  1a. Install Inter and JetBrains Mono via next/font/google. Update app/layout.tsx
      to add dark class to <html> and expose both font CSS variables per section 21.12.
  1b. Replace app/globals.css entirely with the CSS from section 21.7 (keep only
      your Tailwind directives, replace everything else).
  1c. Update tailwind.config.ts with the full color and font extension from section 21.8.
  1d. Update components.json with the shadcn config from section 21.9.
  1e. Run `npx shadcn@latest init` and accept the CSS variable option.
      Then patch the shadcn defaults with the variable bridge from section 21.9.

Task 2 — Landing page (app/(public)/page.tsx):
  Replace the placeholder with a proper dark landing card:
  - bg-background min-h-screen flex items-center justify-center
  - Center card: bg-surface-100 border border-default rounded-lg p-10 max-w-md w-full
  - Brand icon: w-8 h-8 bg-brand rounded-sm flex items-center justify-center (green square)
  - Heading: text-xl font-medium text-foreground mt-4 "CSE Alumni Portal"
  - Sub: text-sm text-foreground-light mt-1 "Computer Systems Engineering"
  - Two buttons: primary pill "Register" → /auth/register,
    default rounded-md "Sign in" → /auth/login
    gap-3 mt-8 flex

Task 3 — Auth pages (login, register, forgot-password, reset-password):
  Apply the auth page layout from section 21.6 "Auth pages" exactly:
  - Page: min-h-screen bg-background flex items-center justify-center
  - Card: bg-surface-100 rounded-lg border border-default p-8 w-full max-w-[400px]
  - Logo area: brand square icon + "CSE Alumni Portal" text-base font-medium
  - All inputs: apply global input styles from section 21.7 (bg-surface-200, border-control,
    focus:border-brand)
  - Labels: text-sm font-medium text-foreground-light mb-1.5
  - Error messages: text-xs text-destructive mt-1
  - Primary button: bg-brand text-foreground-contrast rounded-full font-medium w-full py-2
  - Secondary/OAuth button: bg-button border border-secondary rounded-md font-medium w-full py-2
  - Link text: text-brand hover:text-brand-600 text-sm
  - Divider: flex gap-3 items-center, border-t border-default, text-xs text-foreground-lighter

Task 4 — Create reusable components matching section 21.6 patterns:
  components/ui/stat-card.tsx — KPI metric card
  components/ui/page-header.tsx — page title + description + optional CTA slot
  components/ui/empty-state.tsx — icon + heading + description + CTA
  components/ui/section-card.tsx — card wrapper with optional header/description
  These will be used by E-04 onward.

Task 5 — Verify:
  All pages use bg-background body class (from layout.tsx)
  No hardcoded hex colours anywhere (all via Tailwind token classes)
  No font-bold (700) anywhere — replace with font-medium (500)
  No rounded-none on interactive elements — all use rounded-md minimum
  No box-shadow utilities used
```

**Done when:** All auth pages match the Supabase aesthetic · `dark` class on `<html>` · No TS errors · No hardcoded colours · Inter + JetBrains Mono loading in devtools · Brand green `#3ECF8E` visible on primary CTA

---

### E-01 — Project scaffold & Supabase wiring (~2 hrs)

**Goal:** Bootstrap Next.js 15, wire Supabase in server + browser contexts, confirm DB connection is live.

**Cursor spec:**
```
Context: Starting alumni portal.
Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui, @supabase/ssr.
Reference: @SPEC.md sections 12.1 and 12.2.

Task: Scaffold the project.
Create:
- lib/supabase/client.ts — createBrowserClient
- lib/supabase/server.ts — createServerClient with next/headers cookies()
- lib/supabase/admin.ts — service-role client, add import 'server-only' at top
- middleware.ts — refreshes session on every request via updateSession, no route guards yet
- app/api/health/route.ts — supabase.from('profiles').select('count',{count:'exact',head:true})
    return JSON {ok:true,count} or {ok:false,error}
- app/(public)/page.tsx — "Alumni Portal — OK" + Supabase URL from env
- .env.local.example — list all required vars from SPEC.md section 20

No other pages. No UI components yet.
```

**Done when:** `GET /api/health` → 200 · No TS errors · Supabase dashboard shows connection

---

### E-02 — Database schema & migrations (~3 hrs)

**Goal:** All 12 tables, constraints, RLS policies, helper functions, triggers, storage buckets.

**Cursor spec:**
```
Context: E-01 complete. @SPEC.md sections 13 and 14 have the full schema and RLS policies.
Write 5 migration files in supabase/migrations/ following the schema exactly.

Critical rules:
- All PKs: uuid DEFAULT gen_random_uuid() except audit_logs (bigint GENERATED ALWAYS AS IDENTITY)
- degrees: UNIQUE(profile_id, level), CHECK(graduation_year >= intake_year),
    CHECK(level IN ('BS','MS','PhD'))
- employment_history: end_month nullable DATE, dates stored as YYYY-MM-01
- profiles.privacy_settings default per SPEC.md section 3.6
- profiles.status CHECK: pending_email|pending_admin|active|suspended
- audit_logs: NO UPDATE or DELETE RLS policies — add USING(false) for both operations
- RLS helpers is_admin() and is_active_alumni() must be SECURITY DEFINER STABLE LANGUAGE sql
- search_vector trigger: BEFORE INSERT OR UPDATE ON profiles (see SPEC.md section 18)
- completeness_score trigger: AFTER INSERT OR UPDATE ON profiles, degrees, employment_history,
    profile_skills. Score formula: 20 base + 10 per optional field filled
    (bio, phone, city, avatar_url, postal_address) + 15 if has degrees
    + 15 if has employment + 10 if has skills, capped at 100

Create seed.sql (not a migration) with 10 predefined skills:
Embedded Systems, VLSI Design, Computer Networks, Machine Learning,
Operating Systems, PCB Design, IoT, Cybersecurity, Software Engineering,
Digital Signal Processing — all with is_predefined=true.
```

**Done when:** All 12 tables visible in Supabase dashboard · RLS enabled on all tables · GIN index on profiles.search_vector exists · 10 skill rows in seed

---

### E-03 — Auth: register, login, email verify, OAuth (~4 hrs)

**Goal:** Complete auth flows, profile row creation, email verify, login, Google + LinkedIn OAuth, password reset, middleware guards active.

**Cursor spec:**
```
Context: E-01 + E-02 complete. @SPEC.md section 15 has the auth flow details.

Registration Server Action:
  supabase.auth.signUp({email, password, options:{data:{full_name}}})
  → INSERT profiles {id:user.id, full_name, email, status:'pending_email'}
  → show "check your email" UI state on success

Callback route (app/(public)/auth/callback/route.ts):
  GET handler → exchangeCodeForSession(searchParams.get('code'))
  → UPDATE profiles SET status='pending_admin' WHERE id=session.user.id
  → redirect /profile/edit
  → on error redirect /auth/login?error=callback_failed

Login: signInWithPassword → redirect /dashboard on success
Google OAuth: signInWithOAuth({provider:'google',
  options:{redirectTo: process.env.NEXT_PUBLIC_SITE_URL+'/auth/callback'}})
LinkedIn OAuth: provider:'linkedin_oidc', same redirectTo pattern

Password reset:
  /auth/forgot-password → resetPasswordForEmail(email)
  /auth/reset-password → reads token_hash+type from URL params
    → verifyOtp({token_hash, type}) then updateUser({password})

Middleware update (activate route guards per SPEC.md section 15):
  Protect /dashboard/*, /profile/*, /messages/* — require valid session
  Protect /admin/* — require admin_roles row (query with admin client)
  Redirect non-authed → /auth/login?next=<current_path>
  Redirect non-admin on /admin/* → /dashboard
```

**Done when:** Email register + verify end-to-end works · Login redirects to /dashboard · /admin redirects non-admins · Password reset email received · Google OAuth returns to /profile/edit

---

### E-04 — Alumni profile: edit & view (~5 hrs)

**Goal:** Multi-section profile edit page for all 13 fields per SPEC.md section 3. Degree checklist with sub-forms. Employment CRUD. Skills typeahead. Avatar upload. Privacy controls. Public profile view. All UI must match SPEC.md section 21 exactly.

**Cursor spec:**
```
Context: E-00 through E-03 complete. Theme system live.
Reference: @SPEC.md section 3 (all field specs), section 21 (all UI decisions).

LAYOUT — profile edit:
  Alumni dashboard shell from section 21.10 (sidebar + header + canvas).
  Sidebar: bg-dash-sidebar w-60 border-r border-default.
  Active nav item: text-brand border-l-2 border-brand bg-surface-300.
  Page: max-w-[720px] mx-auto py-8 px-6 flex flex-col gap-6.
  Page header: h2 text-lg font-medium text-foreground +
    p text-sm text-foreground-light "Update your profile information."

SECTION CARDS — bg-surface-100 rounded-lg border border-default:
  card header: border-b border-muted pb-4 mb-5
    h3 text-base font-medium text-foreground + p text-sm text-foreground-light
  Each has own RHF+Zod form + Save button (default style bg-button border border-secondary rounded-md).
  Success: Sonner toast "Saved" | Error: Sonner toast text-destructive.

AVATAR SECTION:
  Current avatar: w-16 h-16 rounded-full object-cover.
  No avatar: bg-surface-300 rounded-full flex items-center justify-center
    text-lg font-medium text-foreground-light (initials).
  Upload: ghost button with camera icon below avatar.

DEGREE SECTION:
  Three shadcn Checkbox items (accent-brand green).
  Sub-form (revealed on check): bg-surface-200 rounded-md p-4 mt-3 border border-muted.
  3-column grid. Labels: text-xs text-foreground-lighter uppercase tracking-wide font-mono.
  Validation error: text-xs text-destructive mt-1.
  Server Action: upsert degrees ON CONFLICT(profile_id,level) DO UPDATE.

EMPLOYMENT SECTION:
  Entry cards: bg-surface-200 rounded-md border border-muted p-4 flex justify-between.
  Company initial avatar: bg-surface-300 w-8 h-8 rounded text-xs font-medium.
  "Add position" button: ghost full-width border border-dashed border-secondary rounded-md py-2
    text-sm text-foreground-lighter hover:border-strong hover:text-foreground-light.
  Delete button: ghost text-destructive on hover.
  Server Actions: createEmployment, updateEmployment(id), deleteEmployment(id).

SKILLS SECTION:
  Selected pills: bg-surface-300 text-foreground-light text-xs px-2.5 py-1 rounded.
  × remove: ml-1.5 text-foreground-lighter hover:text-foreground.
  Combobox dropdown: bg-surface-200 border border-default. Option hover: bg-surface-300.
  "Create new skill" option: text-brand.
  Max 20. On save: DELETE profile_skills WHERE profile_id=X then INSERT all selected.

PRIVACY SECTION:
  Row: flex justify-between items-center py-3 border-b border-muted.
  Right: shadcn Select bg-surface-200 border border-control text-sm.
  Phone: only "Alumni-only" and "Private" options (no "Public").
  Save to profiles.privacy_settings JSONB.

PUBLIC PROFILE VIEW → now ALUMNI PROFILE VIEW (app/(alumni)/alumni/[id]/page.tsx):
  NOTE: Profile pages moved to (alumni) route group — auth required.
  Layout: alumni dashboard shell (sidebar + header + canvas), NOT public layout.
  Profile header: bg-surface-100 rounded-lg border border-default p-6 mb-6.
    flex gap-5 items-start.
  Avatar: w-16 h-16 rounded-full. Name: text-xl font-medium text-foreground.
  Degree badges: bg-surface-300 text-foreground-lighter text-xs px-2 py-0.5 rounded.
  Content: grid grid-cols-[1fr_280px] gap-6.
    Left: Bio, Employment history (section cards), Career highlights.
    Right: Skills card, Contact card.
  Section titles: text-base font-medium text-foreground mb-4 pb-2 border-b border-muted.
  Privacy masking: alumni-only fields visible (viewer is authenticated alumni). NEVER render email in HTML.
  Private fields: completely absent from rendered output.
```

**Done when:** Profile edit looks like Supabase Studio settings · Degree sub-forms appear cleanly · Employment CRUD work · Avatar uploads · Skills typeahead styled · Privacy controls work · completeness_score updates in DB · Profile view at `/alumni/[id]` redirects unauthenticated visitors to login

---

### E-05 — Alumni directory (authenticated only) + community analytics (~5 hrs)

**Goal:** Move the directory entirely into the authenticated alumni zone. Add a community analytics banner above the search area showing live aggregate stats. Searchable, filterable, paginated alumni cards. Individual profile pages show alumni-only fields. Unauthenticated users are redirected to login.

**Cursor spec:**
```
Context: E-04 complete. search_vector populated.
Reference: @SPEC.md section 4 and 4.1 (requirements + analytics), section 16 (API), section 21 (UI).

ACCESS CONTROL CHANGE:
  Move app/(public)/alumni/ → app/(alumni)/alumni/ (authenticated route group).
  Move app/(public)/alumni/[id]/ → app/(alumni)/alumni/[id]/.
  Middleware already protects (alumni)/* — any unauthenticated request to /alumni
  or /alumni/[id] will redirect to /auth/login?next=<path>.
  The GET /api/alumni route handler must also verify session:
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return Response.json({error:'Unauthorized'},{status:401})
    Verify profile.status='active' using the server client.
    Return 403 if status is pending or suspended.

GET /api/alumni — server Supabase client (user JWT, not anon, not service-role).
  RLS on profiles now requires is_active_alumni(auth.uid()) for directory rows.
  Full query spec per section 16. NEVER include email/phone/postal_address.
  Returns: {data, total_count, page, total_pages}.

ANALYTICS QUERIES (run in the RSC page component server-side, anon client, Promise.all):
  All 8 stats from section 4.1 table. Use anon client — RLS handles active-only filter.
  Run with Promise.all for parallel execution.
  const [totalAlumni, countries, degreeSpan, topDegree, topSkills,
         employed, international, newThisYear] = await Promise.all([...])
  Cache result: export const revalidate = 300 (5 min ISR) on the page.

─────────────────────────────────────────────────────────────
ANALYTICS BANNER (component: components/alumni/analytics-banner.tsx)
─────────────────────────────────────────────────────────────
Position: below page header, above search bar. Full-width.

OUTER CONTAINER:
  bg-surface-100 rounded-lg border border-default p-5 mb-6

TITLE ROW (above stats grid):
  flex items-center justify-between mb-4
  Left: text-xs font-mono text-foreground-lighter uppercase tracking-wider "Community overview"
  Right: text-[11px] text-foreground-muted "Live · updates every 5 min"
         + a 6px pulsing dot: w-1.5 h-1.5 rounded-full bg-brand animate-pulse

STATS GRID:
  grid grid-cols-2 sm:grid-cols-4 gap-px
  Background of grid: bg-border (so gaps appear as 1px lines — Supabase table trick)
  Each stat cell: bg-surface-100 px-4 py-3

  Stat cell layout:
    value: text-xl font-medium text-foreground
    label: text-xs text-foreground-lighter mt-0.5

  Stats to show in cells (4 primary stats):
    Cell 1: totalAlumni value + "Alumni registered" label
    Cell 2: countries value + "Countries" label
    Cell 3: employed value + "Currently employed" label
    Cell 4: newThisYear value + "Joined this year" label  (+ "↑ this year" text-brand text-[11px])

SKILLS + DEGREE ROW (below grid, separated by border-t border-muted pt-4 mt-1):
  Two columns (flex gap-8):

  Left — Top skills:
    label: text-xs font-mono text-foreground-lighter uppercase tracking-wide mb-2 "Top skills"
    flex flex-wrap gap-1.5
    Each skill pill: bg-surface-300 text-foreground-light text-[11px] px-2 py-0.5 rounded
    The top skill: bg-brand/10 text-brand border border-brand/20 (highlighted)

  Right — Degree breakdown:
    label: text-xs font-mono text-foreground-lighter uppercase tracking-wide mb-2 "Degrees"
    Three degree rows (BS / MS / PhD):
      flex items-center gap-2 mb-1.5
      Degree label: text-[11px] font-medium text-foreground-light w-8 (e.g. "BS")
      Progress bar: flex-1 bg-surface-300 rounded-full h-1.5
        inner: bg-brand rounded-full (width = count/totalAlumni * 100%)
      Count: text-[11px] text-foreground-lighter w-6 text-right

  International stat (below, full-width):
    border-t border-muted pt-3 mt-3
    flex items-center gap-2
    Globe icon 14px text-foreground-lighter
    text-xs text-foreground-light
      "<international> alumni" + text-brand font-medium " in " + "<countries> countries"
      + " outside Pakistan"

─────────────────────────────────────────────────────────────
PAGE LAYOUT
─────────────────────────────────────────────────────────────
Use alumni dashboard shell (section 21.10) — sidebar + header + canvas.
NOT the public layout (no top nav — user is authenticated).

Sidebar nav items:
  Dashboard (/dashboard)
  Alumni (/alumni)   ← this page, active state
  Events (/events)
  Messages (/messages)
  My Profile (/profile/edit)

Page canvas: max-w-[1280px] mx-auto px-6 py-8

Page header row:
  h1 text-2xl font-medium text-foreground "Alumni Directory"
  p text-sm text-foreground-light mt-1 "Connect with fellow CSE graduates."

Analytics banner (above search/filters).

─────────────────────────────────────────────────────────────
SEARCH BAR
─────────────────────────────────────────────────────────────
bg-surface-200 border border-control rounded-md flex items-center px-3 gap-2
  Search icon 16px text-foreground-lighter (left)
  input: bg-transparent flex-1 text-sm text-foreground placeholder:text-foreground-lighter py-2
  Sort select: shadcn Select right-aligned inside bar:
    bg-transparent border-l border-control pl-3 text-xs text-foreground-light
    Options: "Relevance" | "Name A–Z" | "Grad year (newest)" | "Grad year (oldest)"
  Clear button ×: text-foreground-lighter hover:text-foreground (when q not empty)

─────────────────────────────────────────────────────────────
FILTER BAR (below search, above results)
─────────────────────────────────────────────────────────────
flex flex-wrap gap-2 mt-3

Each filter rendered as a pill-shaped dropdown trigger:
  bg-surface-200 border border-control rounded-full px-3 py-1.5 text-xs font-medium
  text-foreground-light hover:border-secondary cursor-pointer
  When active (filter applied): border-brand text-brand bg-brand/5

Filter pills:
  "Degree" → popover checklist: BS / MS / PhD (shadcn Checkbox accent-brand)
  "Grad year" → popover with two number inputs (from / to)
  "Country" → shadcn Select inside popover
  "Skills" → combobox inside popover (tag-style chips for selected)
  Active filter count badge on pill: bg-brand rounded-full w-4 h-4 text-[10px]
    text-foreground-contrast text-center ml-1

"Clear all filters" text button (text-xs text-foreground-lighter hover:text-brand)
  only visible when any filter is active. Right-aligned with filter row.

─────────────────────────────────────────────────────────────
RESULTS AREA
─────────────────────────────────────────────────────────────
Results count: text-xs text-foreground-lighter mb-4 "143 alumni found"

Grid: grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4

ALUMNI CARD (components/alumni/alumni-card.tsx) — section 21.6 exactly:
  bg-surface-100 rounded-lg border border-default p-4
  hover: border-secondary cursor-pointer transition-colors 150ms
  Avatar: w-10 h-10 rounded-full object-cover
    Initials fallback: bg-surface-300 flex items-center justify-center
      text-sm font-medium text-foreground-light
  Name: text-sm font-medium text-foreground mt-3
  Current role: text-xs text-foreground-light mt-0.5 (job_title + " at " + company)
  Degree badges: flex gap-1 mt-2
    each: bg-surface-300 text-foreground-lighter text-[11px] px-1.5 py-0.5 rounded
  Location: text-[11px] text-foreground-lighter mt-2 flex items-center gap-1
    (MapPin icon 10px + city + ", " + country)
  Click → /alumni/[id]

EMPTY STATE (components/ui/empty-state.tsx):
  Users 40px text-foreground-lighter icon
  "No alumni found" heading text-base font-medium
  "Try adjusting your search or filters." text-sm text-foreground-light
  "Clear filters" default button

─────────────────────────────────────────────────────────────
PAGINATION
─────────────────────────────────────────────────────────────
flex justify-between items-center mt-8 pt-4 border-t border-muted
Left: text-sm text-foreground-lighter "Showing 1–20 of 143"
Right: prev / page numbers (max 5) / next
  ghost rounded-md text-sm buttons
  Active page: bg-surface-300 text-foreground font-medium

─────────────────────────────────────────────────────────────
INDIVIDUAL PROFILE PAGE (app/(alumni)/alumni/[id]/page.tsx)
─────────────────────────────────────────────────────────────
Also authenticated-only (inside (alumni) route group — middleware handles it).
Layout: alumni dashboard shell (sidebar + header), not public layout.

Profile header area: bg-surface-100 rounded-lg border border-default p-6 mb-6
  flex gap-5 items-start
  Avatar: w-16 h-16 rounded-full
  Right side:
    Name: text-xl font-medium text-foreground
    Current role: text-sm text-foreground-light mt-0.5
    Degree badges: flex gap-2 mt-2
    Location + joined date: text-xs text-foreground-lighter mt-2 flex gap-4

Main content: grid grid-cols-[1fr_280px] gap-6
  Left column:
    Bio section card (section-card.tsx)
    Employment history section card (LinkedIn-style entries)
    Career highlights section card
  Right column:
    Skills card (pill tags)
    Contact/privacy info card (only shows fields the alumnus has made alumni-only or public)

All privacy masking: per section 3.6. NEVER render email in HTML.
Fields set to private: completely absent from the rendered output.
```

**Done when:**
- `/alumni` route redirects unauthenticated visitors to `/auth/login?next=/alumni`
- Pending/suspended alumni get 403 and are shown an "account pending approval" page
- Analytics banner renders all 8 stats with correct values from live DB queries
- Degree progress bars reflect actual BS/MS/PhD distribution
- Top skills pills visible, top skill highlighted in brand green
- Directory search, filters, sort all work within authenticated shell
- Individual profile at `/alumni/[id]` is also auth-gated
- Email never appears in any page HTML

---


### E-06 — Events listing, detail & calendar just like in Luma

**Goal:** Public events page — card grid and calendar, event detail with capacity bar. Category-coloured top accent bars on event cards. Follow LUMA UI/UX for events

**Cursor spec:**
```
Context: E-05 complete. Reference: @SPEC.md sections 5.1 and 21.

GET /api/events — anon client. Filter published=true. Compute confirmed_count as subquery.
Full spec per section 16. export const revalidate = 60.

EVENTS PAGE:
  Public layout. Page header: h1 text-2xl font-medium text-foreground "Events".
  Filter bar (sticky, bg-surface-100 border-b border-muted py-3 mb-6):
    Each filter: shadcn Select as pill trigger bg-surface-200 border border-control rounded-full.
    Active filter: border-brand text-brand bg-brand/5.
    View toggle (grid/calendar): bg-surface-200 rounded-md border border-control p-0.5 flex.
      Active: bg-surface-400 rounded text-foreground. Inactive: text-foreground-lighter.

EVENT CARD — section 21.6 "Event card" exactly:
  4px top accent bar (category colour per section 21.6).
  Status badges: Open=bg-brand/10 text-brand border-brand/30 |
    Full=bg-warning/10 text-warning | Closed=bg-surface-300 text-foreground-lighter.
  Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.

CALENDAR VIEW (no library):
  bg-surface-100 rounded-lg border border-default.
  Month header: flex justify-between p-4 border-b border-muted.
    text-base font-medium + prev/next ghost icon buttons.
  Weekday row: bg-surface-200 border-b border-muted. text-xs font-mono uppercase tracking-wide.
  Day cells: border-b border-r border-muted min-h-[80px] p-1.5.
    Date: text-xs text-foreground-lighter. Today: bg-brand text-foreground-contrast w-5 h-5 rounded-full.
    Event chip: text-[10px] bg-surface-300 text-foreground-light px-1.5 py-0.5 rounded truncate.
      Category colour dot (4px rounded-full) left of text.

EVENT DETAIL RSC:
  Hero: bg-surface-100 border-b border-default py-10 max-w-[1280px] mx-auto px-6.
    border-l-4 category colour accent. Category/type badges top.
    h1 text-2xl font-medium mt-3. Date/location text-sm text-foreground-light mt-2 flex gap-4.
  Content: max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-[1fr_320px] gap-8.
    Left: description text-sm text-foreground leading-relaxed.
    Right: registration card (bg-surface-100 border border-default rounded-lg p-5 sticky top-6).
      shadcn Progress — indicator bg-brand. "X of Y spots" text-xs text-foreground-lighter.
      Primary pill CTA full-width mt-4.
      Anon: same pill but bg-surface-300 text-foreground-light "Log in to register".
  generateMetadata from event title + description.
```

**Done when:** Category accent bars visible · Calendar grid correct · Detail two-column layout · Capacity bar green · CTA correctly gated

---

### E-07 — Event registration & waitlist (~4 hrs)

**Goal:** Registration flow, capacity enforcement, waitlisting, cancellation, confirmation email + ICS, alumni dashboard. Supabase-style UI throughout.

**Cursor spec:**
```
Context: E-06 complete. Install: react-email @react-email/components.
Reference: @SPEC.md sections 5.2 and 21.

REGISTRATION PAGE (app/(alumni)/events/[id]/register/page.tsx):
  Dashboard layout (sidebar + header). Breadcrumb: Events → [Name] → Register.
  Two-column: form left (flex-1) + summary card right (320px sticky).

  Summary card: bg-surface-100 border border-default rounded-lg p-5.
    4px category accent bar at top. Event title text-base font-medium.
    Date/location text-xs text-foreground-lighter mt-1. border-t border-muted my-4.
    Capacity progress: bg-brand indicator. Price text-lg font-medium if paid.

  Form card: bg-surface-100 border border-default rounded-lg p-5.
    Pre-filled name/email: read-only display.
      label: text-xs font-mono text-foreground-lighter uppercase tracking-wide.
    dietary_requirements textarea + guest_count number input (± ghost buttons).
    Submit: primary pill button full-width mt-6 "Register for event".

  SUCCESS STATE (after registration):
    CheckCircle 48px text-brand mb-4. "You're registered!" text-lg font-medium.
    "A confirmation email has been sent." text-sm text-foreground-light.
    "Add to calendar" default button.

  WAITLISTED STATE:
    Clock 48px text-warning. "You're on the waitlist" text-lg font-medium.
    "Position #N" text-sm text-foreground-light + "We'll email you if a spot opens up."

Server Action registerForEvent (service-role, verify session manually):
  Full logic per section 22 E-07 spec (unchanged). qr_token = crypto.randomUUID().
  Confirmation email: React Email template + ICS attachment (string per section 22 E-07).

Cancellation Server Action: full logic per section 22 E-07 spec.

ALUMNI DASHBOARD (app/(alumni)/dashboard/page.tsx):
  Page header: h1 "Dashboard".
  Completeness nudge (if score < 80):
    bg-brand/5 border border-brand/20 rounded-lg p-4 flex gap-3.
    AlertCircle 16px text-brand. text-sm text-foreground.
    Progress bar: bg-surface-300 rounded-full h-1.5 mt-2. Inner: bg-brand (width=score%).
    Link: text-xs text-brand "Complete profile →".
  Upcoming registrations: bg-surface-100 border border-default rounded-lg divide-y divide-border-muted.
    Row: flex justify-between p-4. Date: text-xs font-mono text-foreground-lighter.
    Title: text-sm font-medium. Status badge per section 21.6.
    Cancel: ghost button text-destructive on hover.
    Waitlisted: bg-warning/10 text-warning text-xs "Position #N".
```

**Done when:** Registration page two-column layout matches spec · Success/waitlist states · Confirmation email + ICS · Dashboard completeness nudge shows · Cancel promotes waitlist · QR check-in works

---

### E-08 — Admin dashboard (~6 hrs)

**Goal:** Full admin back-office matching Supabase Studio aesthetic. KPI home with recharts area chart, alumni DataTable, events CRUD with tiptap in a Sheet, CSV import/export, audit log.

**Cursor spec:**
```
Context: E-07 complete. Admin user in admin_roles.
CRITICAL: use lib/supabase/admin.ts (service-role) for ALL admin queries.
Reference: @SPEC.md sections 6 and 21. Every UI decision from section 21.

ADMIN LAYOUT — section 21.10 "Admin dashboard":
  Sidebar groups + nav labels (section 21.6 sidebar pattern):
    font-mono text-[10px] uppercase tracking-widest text-foreground-muted px-3 mt-5 mb-1.
  Sidebar header: bg-brand w-6 h-6 rounded-sm (brand icon) + "CSE Alumni" text-sm font-medium.

DASHBOARD HOME:
  3-column KPI grid (section 21.6 stat cards):
    label: text-xs font-mono text-foreground-lighter uppercase tracking-wide.
    value: text-2xl font-medium text-foreground mt-2.
    Pending approvals: border-brand/30 bg-brand/5 when count > 0.
  recharts AreaChart:
    bg-surface-100 rounded-lg border border-default p-5.
    area fill: #3ECF8E26 (brand/15%). stroke: #3ECF8E 2px.
    CartesianGrid stroke="#2E2E2E". axis text: #6E6E6E text-xs. 
    Tooltip: bg-surface-200 border border-default text-sm text-foreground.

ALUMNI TABLE:
  Search: bg-surface-200 border-control rounded-md with Search icon.
  Status filter pills: bg-surface-300 text-foreground (active) / text-foreground-lighter (inactive).
  Table section 21.6 tables pattern. Status badges per section 21.6 badges.
  Row actions on hover (ghost icon buttons right-aligned): Approve, Suspend, View.
  Bulk action bar: bg-surface-200 border-t border-default p-3 flex gap-3.
  CSV import Dialog: border-2 border-dashed border-control dropzone,
    hover: border-brand/50. Error rows: bg-destructive-bg/50 text-destructive.
  CSV export: GET /api/admin/export/alumni → text/csv + audit log.

EVENTS — Create/Edit as shadcn Sheet (right slide-in, w-[600px]):
  bg-surface-100 border-l border-default.
  tiptap editor: bg-surface-200 border border-control rounded-md p-3.
    Toolbar: bg-surface-300 rounded-t-md p-1 border-b border-muted.
    Icon buttons: ghost. Active: bg-surface-400 text-foreground rounded.
  Publish toggle: shadcn Switch checked=bg-brand.
  Save: primary pill "Save event" + default "Save as draft".
  Registrant Sheet: table with check-in column (CheckCircle text-brand if attended).

AUDIT LOG:
  Monospace timestamps: font-mono text-xs text-foreground-lighter.
  Action badges by prefix:
    profile.*: bg-blue-900/30 text-blue-400 border-blue-800/30.
    event.*: bg-brand/10 text-brand border-brand/30.
    alumni.*: bg-warning/10 text-warning border-warning/30.
    role.*: bg-purple-900/30 text-purple-400 border-purple-800/30.
  "Read-only" badge in page title. No delete anywhere.
```

**Done when:** Looks like Supabase Studio · KPI cards + area chart render · Approve → status + audit · Create event → public · CSV import/export · Audit log read-only with correct badge colours

---

### E-09 — Background jobs, reminders & production hardening (~4 hrs)

**Goal:** Edge Functions, security headers, rate limiting, Supabase-style pulse skeletons, SEO metadata, production deployment.

**Cursor spec:**
```
Context: E-01 through E-08 complete. Reference: @SPEC.md sections 19 and 21.11.

EDGE FUNCTIONS — per section 19 exactly (Deno, esm.sh imports).

LOADING SKELETONS — section 21.11 pattern: bg-surface-300 animate-pulse rounded.

  app/(alumni)/alumni/loading.tsx:
    grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 of 20 skeleton cards:
      bg-surface-100 rounded-lg border border-default p-4
      Circle: w-10 h-10 rounded-full bg-surface-300 animate-pulse
      Line1: h-3 w-3/4 bg-surface-300 animate-pulse rounded mt-3
      Line2: h-2.5 w-1/2 bg-surface-300 animate-pulse rounded mt-2
      Pills: h-4 w-10 bg-surface-300 animate-pulse rounded mt-2

  app/(admin)/admin/loading.tsx:
    grid-cols-3 gap-4 of 5 skeleton KPI cards:
      bg-surface-100 rounded-lg border border-default p-5
      Label line: h-2.5 w-20 bg-surface-300 animate-pulse rounded
      Value: h-7 w-16 bg-surface-300 animate-pulse rounded mt-3

  app/(admin)/admin/alumni/loading.tsx:
    bg-surface-100 rounded-lg border border-default overflow-hidden
    Header: bg-surface-200 h-10. 10 rows: h-12 border-b border-muted.
    Each row: 4 cells (w-32, w-24, w-16, w-20) h-3 bg-surface-300 animate-pulse rounded.

TOAST SETUP (root layout):
  <Toaster toastOptions={{classNames:{
    toast:'bg-surface-200 border border-default text-foreground text-sm',
    error:'text-destructive border-destructive/30',
    success:'border-brand/30'}}}
    position="bottom-right" />

SECURITY HEADERS in next.config.ts:
  X-Frame-Options: DENY | X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

RATE LIMITING for /api/auth/* in middleware:
  Map<ip,{hits,resetAt}>. If hits > 20 in 60s → Response 429.

generateMetadata — alumni/[id]: title=full_name+'·CSE Alumni', desc=bio?.slice(0,160).
  events/[id]: title=event.title+'·CSE Alumni Events'.

DEPLOYMENT CHECKLIST:
  Confirm <html className="dark ..."> correct in production.
  Lighthouse dark mode screenshot — no white flash.
  Inter + JetBrains Mono load from Google Fonts in production Network tab.
  All env vars set in Vercel dashboard.
  supabase db push to production. Smoke test all E-01–E-08 gates.
```

**Done when:** Skeleton screens match Supabase pulse style · Toasts styled correctly · Security headers in Network tab · Edge functions deployed · No white flash on load · All E-01–E-08 gates pass on production URL

---

## Quick Reference

### Profile status flow
```
pending_email → (email verified) → pending_admin → (admin approves) → active
                                                                    → suspended
```

### Registration status flow
```
confirmed → attended (via QR check-in)
confirmed → cancelled (within cutoff) → [promotes next waitlisted]
waitlisted → confirmed (when capacity frees up)
waitlisted → cancelled
```

### Completeness score formula
```
Base:        20 pts  (always, for name + email)
bio:         10 pts
phone:       10 pts
city:        10 pts
avatar_url:  10 pts
postal:      10 pts
degrees:     15 pts  (has at least one degree row)
employment:  15 pts  (has at least one employment row)
skills:      10 pts  (has at least one skill tag)
TOTAL:      110 pts → capped at 100
```

### UI colour quick-reference (most used tokens)
```
Page bg:         bg-background      (#1C1C1C)
Content panels:  bg-surface-100     (#242424)
Secondary:       bg-surface-200     (#2A2A2A)
Form inputs:     bg-surface-200 + border-border-control
Hover rows:      bg-surface-400     (#3C3C3C)
Primary text:    text-foreground    (#EDEDED)
Secondary text:  text-foreground-light  (#ACACAC)
Hint text:       text-foreground-lighter (#6E6E6E)
Brand green:     text-brand / bg-brand  (#3ECF8E)
Default border:  border             (#2E2E2E)
Strong border:   border-strong      (#4A4A4A)
Destructive:     text-destructive   (#F87171)
Warning:         text-warning       (#FBBF24)
```

### Epic sequence (with E-00 insert)
```
E-01 → E-02 → E-03 → E-00 (UI retrofit) → E-04 → E-05 → E-06 → E-07 → E-08 → E-09
```

### Key Cursor tips
- Start every chat: `@SPEC.md — Working on E-0N. Spec: [paste spec block]`
- For any UI question: `@SPEC.md section 21 — how should [X] look?`
- Commit convention: `git commit -m "epic-N: what was built"`
- If Cursor generates something wrong, paste the relevant SPEC.md section and say "this section takes priority"
- Service-role client (`lib/supabase/admin.ts`) for admin routes only — never in client components
- Every colour via Tailwind token — never hardcode hex in JSX

---

*SPEC.md v1.3.0 — Computer Systems Engineering Alumni Portal — May 2026*