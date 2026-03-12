# Mano — Project Status

> Last updated: 12 March 2026 (evening)

## Overview

Privacy-first SaaS practice management platform for independent therapists in India.

- **Repo**: https://github.com/blureonlabs/mano.git (branch: `dev`)
- **Vercel**: Deployed from `dev` branch, root directory `apps/web`
- **Supabase**: Project `bjodimpnpwuuoogwufso` (Mumbai, ap-south-1)
- **Storage**: Public `assets` bucket on Supabase CDN

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.5 (App Router), React 19, Tailwind CSS 3.4 |
| Backend/API | tRPC 11 (type-safe, extractable) |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (email/password) |
| Encryption | AES-256-GCM column encryption (clinical data at rest) |
| Icons | Lucide React |
| Payments | Razorpay (UPI, cards, netbanking) |
| Video | Zoom SDK (OAuth) |
| Calendar | Google Calendar API (OAuth) |
| Reminders | WhatsApp Business API (Gupshup) |
| Email | Resend |
| Hosting | Vercel + Supabase Mumbai |
| Monorepo | Turborepo + pnpm |

## Architecture

```
apps/web  →  @mano/api  →  @mano/domain  →  @mano/shared
                         →  @mano/db      →  @mano/shared
                         →  @mano/integrations
```

## What's DONE

### Infrastructure
- [x] Turborepo monorepo with 6 workspace packages
- [x] Git repo on GitHub (blureonlabs/mano), dev branch active
- [x] Vercel deployment (auto-deploy from dev)
- [x] Supabase project (Mumbai region, linked)
- [x] Supabase Storage (public assets bucket, logo uploaded)
- [x] Environment variables set on Vercel (all 3 environments, including ENCRYPTION_KEY)

### Database (8 migrations, all pushed to remote)
- [x] Full schema — 12 tables: therapists, availability, blocked_slots, clients, sessions, session_notes, messages, invoices, treatment_plans, resources, client_resources
- [x] 8 custom enums: session_status, payment_status, note_type, sender_type, invoice_status, treatment_plan_status, therapy_modality, resource_type
- [x] RLS policies on all tables (therapist-scoped access)
- [x] Performance indexes (15+, including GIN index on resource modality_tags)
- [x] Auto-updated_at triggers on all mutable tables
- [x] `handle_new_user()` trigger — auto-creates therapist profile on signup
- [x] Booking policies columns on therapists (cancellation, late, rescheduling)
- [x] Column type migration for encrypted fields (text[] → text, jsonb → text)
- [x] Migration 00008: session_type_name column on sessions, JSONB session_types on therapists

### Security & Encryption
- [x] **AES-256-GCM column encryption** — clinical data encrypted before DB insert, decrypted after select
- [x] Encryption utility (`packages/api/src/utils/encryption.ts`) — encrypt/decrypt strings, JSON, and field sets
- [x] **Encrypted session notes**: subjective, objective, assessment, plan, freeform_content, homework, techniques_used, risk_flags
- [x] **Encrypted treatment plans**: presenting_concerns, diagnosis, goals, notes
- [x] **Encrypted messages**: content
- [x] Legacy data fallback — try/catch handles unencrypted pre-migration data gracefully
- [x] Server-managed key via `ENCRYPTION_KEY` env var (32-byte base64)
- [x] Row-Level Security (RLS) on all tables — therapist can only access their own data

### Auth
- [x] Signup page — Supabase signUp with full_name, auto therapist profile via trigger
- [x] Login page — signInWithPassword, redirect support, Suspense boundary
- [x] Protected routes via middleware (dashboard, settings → redirect to /login)

### Landing Page (/)
- [x] Full marketing page — 14 React components
- [x] Navbar with scroll blur, hamburger menu, Sign In + Get Started CTAs
- [x] Hero section with interactive demo browser mockup
- [x] **How It Works** — 3-step flow (create account → set availability → share link) with dashed connectors
- [x] Problem section (6 broken tools → Mano solution)
- [x] Features grid (AI assistant, booking, payments, encryption, messaging)
- [x] **Booking Preview** — mockup of client-facing booking page with calendar, time slots, therapist header
- [x] Privacy principles + "Mano vs. the rest" comparison
- [x] 3-tier pricing cards (Starter ₹999, Pro ₹1,999, Clinic ₹4,999)
- [x] Testimonials (3 therapists)
- [x] **FAQ** — 7-question accordion (data residency, client access, Zoom, payments, free trial, import)
- [x] **Blog Teaser** — 3 placeholder article cards with Unsplash images
- [x] CTA section → /signup
- [x] Footer
- [x] Fade-up scroll animations, responsive design

### Branding
- [x] Logo on Supabase CDN — nav, dashboard sidebar, favicon, OG image
- [x] Color system: sage #4A7C6F, cream #F5F0E8, card #FDFAF5, ink #2C2825, amber #C8873A
- [x] Typography: Lora (headings), DM Sans (body)
- [x] Border radius tokens: card 16px, small 10px, pill 100px

### API Layer (@mano/api) — 10 routers
- [x] tRPC setup with Supabase context + auth middleware
- [x] **therapist** — profile CRUD, getBySlug (public), updateSessionTypes
- [x] **client** — list, create, update, delete, getDetail (with session count/last session)
- [x] **session** — byClient, today, upcoming, listByDateRange, create (manual), approve, reject, complete, cancel, markNoShow, reschedule, delete, createNote, updateNote, getNote, getNoteById, listNotes, deleteNote (notes encrypted at rest)
- [x] **booking** — availableSlots (public), createBooking (public)
- [x] **blockedSlot** — list (date range), create, update, delete (with overlap detection)
- [x] **payment** — list, create
- [x] **message** — list, send (content encrypted at rest)
- [x] **integration** — status, connect/disconnect
- [x] **treatmentPlan** — list, getById, create, update, updateStatus, delete (clinical fields encrypted at rest)
- [x] **resource** — list, getById, create, update, delete, share, unshare, listShared

### Domain Logic (@mano/domain)
- [x] Slot calculator — available slots from availability rules minus booked/blocked
- [x] Session service — conflict detection, booking, cancellation
- [x] Billing service — invoice number generation (MANO-YYYYMM-XXXX), GST calculation
- [x] Therapist, client, message services

### Shared (@mano/shared)
- [x] Zod schemas: therapist, client, session, booking, payment, message, treatment-plan, resource, blocked-slot
- [x] Constants: pricing tiers, session types, note templates (SOAP/DAP/BIRP/Freeform), therapy modalities (11), common techniques (15), risk flags (6), session durations
- [x] Exported types: Goal, SubGoal, TherapyModality, TherapyModalityKey, ResourceType, SessionType, BlockedSlot, etc.

### Booking Page (`/booking/[slug]`)
- [x] Full booking flow: session type picker → date picker → time slot → client form → confirmation (4-step)
- [x] Configurable session types (e.g., Intro Call 30 min free, Regular 50 min ₹2,000)
- [x] Policy notice (collapsible card showing cancellation/late/rescheduling policies)
- [x] Sessions created with `pending_approval` status
- [x] Polished UI with multi-step flow

### Dashboard — Sidebar Navigation
- [x] Lucide icons on all nav items: Today, Schedule, Clients, Notes, Resources, Payments, Messages, Settings
- [x] Active state highlighting (sage background, bold stroke)
- [x] Logo + brand in sidebar header

### Dashboard — Today (`/dashboard`)
- [x] Stats cards: Today's sessions, this week total, active clients (with colored icon badges)
- [x] Today's sessions list with time, client name, status badges, notes link
- [x] Empty states

### Dashboard — Schedule (`/dashboard/schedule`) — Full Calendar Control Center
- [x] **Three view modes**: Week view (7-column grid), Day view (single-column), List view (date-grouped)
- [x] **Week view**: 8AM–9PM IST time grid, session blocks color-coded by status, blocked slot hatched blocks, today column highlight
- [x] **Day view**: Single-day expanded timeline with all sessions/breaks
- [x] **List view**: Date-grouped session list with all action buttons
- [x] **Header**: View toggle (Calendar/List), week navigation arrows, Today button, "+ Add Session" button, pending count badge
- [x] **Session detail popover**: Client info, time, status/payment badges, Zoom link, Notes link
- [x] **Session actions**: Approve, Reject, Complete, Cancel, No Show, Reschedule (inline date/time editor), Delete (with confirmation)
- [x] **Break management**: Click empty cell to add break, click existing break to edit (timing/reason) or delete
- [x] **Create session modal**: Client picker, session type dropdown (auto-calculates end time), date/time inputs
- [x] **Overlap detection**: Session creation, approval, and break creation all check for conflicts
- [x] **Toast notifications**: Sonner (bottom-right) for success/error feedback on all mutations
- [x] **Loading overlay**: Global spinner during any action (approve, cancel, reschedule, delete, etc.)
- [x] **Pending banner**: Amber banner showing count of pending approval requests

### Dashboard — Clients (`/dashboard/clients`)
- [x] Client list with avatar initials, contact info, search/filter
- [x] Add/delete client functionality
- [x] Clickable rows → client detail page

### Dashboard — Client Detail (`/dashboard/clients/[id]`)
- [x] Client header with avatar, name, contact info, stats (session count, last session, since)
- [x] 4-tab navigation: Sessions | Notes | Treatment Plan | Resources
- [x] **Sessions tab**: Session history, reverse chronological, status badges, notes link
- [x] **Notes tab**: Filtered notes for this client, note type badges, risk flag indicators
- [x] **Treatment Plan tab**: Plan cards with status badge, modality pill, goal progress bar, "New Plan" button
- [x] **Resources tab**: Shared resources list with type badges, unshare button, "Share Resource" modal

### Dashboard — Notes (`/dashboard/notes`)
- [x] Notes list with client filter dropdown
- [x] Note cards: type badge, risk flag indicator, preview text, session date
- [x] **Create note** (`/dashboard/notes/new`): NoteEditor with template type tabs (SOAP/DAP/BIRP/Freeform), dynamic fields, homework, techniques multi-select, risk flags
- [x] **Edit note** (`/dashboard/notes/[noteId]`): Loads existing note with session context
- [x] `?session_id=xxx` deep link from schedule/dashboard

### Dashboard — Treatment Plans (`/dashboard/clients/[id]/treatment-plan/...`)
- [x] **Create** (`/new`): PlanEditor with modality selector (11 pill buttons), presenting concerns, diagnosis, goal/sub-goal editor, date range, notes
- [x] **Edit** (`/[planId]`): Loads existing plan into PlanEditor
- [x] GoalList component: add/remove goals and sub-goals, completion checkboxes
- [x] Plans stored as encrypted text (was JSONB, migrated for encryption support)

### Dashboard — Resources (`/dashboard/resources`)
- [x] Resource library grid with type badges (file/link/worksheet), modality/category tags
- [x] Modality filter pills (All + 11 modalities)
- [x] Add Resource modal: title, type selector, URL, description, modality tags, category tags
- [x] Delete resource, external link button

### Dashboard — Resource Sharing (via Client Detail)
- [x] Share Resource modal: pick from library, add note for client
- [x] Shared resources list per client with unshare option
- [x] Unique constraint prevents duplicate sharing

### Settings (`/settings`)
- [x] Profile form (name, display name, phone, bio, qualifications, slug, GSTIN)
- [x] **Session types editor**: Add/remove session types (name, duration, rate, description, active toggle), up to 10 types
- [x] Buffer time between sessions (0/5/10/15/30 min)
- [x] Availability editor (day/time per weekday, add/remove slots)
- [x] Booking page toggle + live link
- [x] Policies form (cancellation, late arrival, rescheduling — 3 textareas)
- [x] Toast notifications on save (Sonner)

### Performance & UX
- [x] Middleware optimized — single `getUser()` call reused for session refresh + auth guard
- [x] React Query stale time increased to 5 minutes (was 30s) to reduce unnecessary refetches
- [x] Global toast notification system (Sonner) — bottom-right, rich colors, DM Sans font
- [x] TRPCError used throughout (not plain Error) so messages reach the frontend
- [x] IST timezone utilities — all date/time display and calculation uses `Asia/Kolkata`

### Documentation
- [x] `docs/MANO_SAAS_ANALYSIS.md` — Full SaaS analysis
- [x] `docs/TECHNICAL_ARCHITECTURE.md` — Supabase + Zoom + Google Calendar architecture
- [x] `docs/COMPETITIVE_LANDSCAPE_2026.md` — Full competitor analysis (March 2026)
- [x] `docs/COMP_ANALYSIS_PRACFLOW.md` — Deep dive on PracFlow (closest competitor)
- [x] `docs/COMPLIANCE_RESEARCH.md` — DPDP Act, IT Act, Mental Healthcare Act, GDPR, HIPAA research

## What's SCAFFOLD (structure exists, needs real UI/wiring)

### Dashboard Pages
- [ ] Payments (`/dashboard/payments`) — needs invoice table + create invoice form
- [ ] Messages (`/dashboard/messages`) — needs chat UI with client list sidebar

### Integration Clients (@mano/integrations)
- [ ] Zoom — OAuth URL generation done, meeting creation/deletion not wired to routers
- [ ] Google Calendar — OAuth URL generation done, event CRUD not connected
- [ ] Razorpay — order creation + webhook verification implemented, not wired to booking flow
- [ ] WhatsApp (Gupshup) — message sending stub
- [ ] Email (Resend) — email sending stub

### Repository Layer (@mano/db)
- [ ] 5 repository classes defined (TherapistRepo, ClientRepo, SessionRepo, PaymentRepo, MessageRepo)
- [ ] Basic CRUD operations, not fully utilized by routers yet (routers query Supabase directly)

## What's NOT STARTED

### Tier 1 — Complete the MVP (wire existing code)
- [ ] **Payments page** — Connect payment.list query, build invoice table, Razorpay order creation
- [ ] **Messages page** — Build chat UI with client list sidebar, connect message.list/send
- [ ] **Wire Zoom integration** — Call createMeeting() on booking, deleteMeeting() on cancellation
- [ ] **Wire notifications** — Email/WhatsApp on: booking confirmation, approval, reminders

### Tier 2 — High-value features
- [ ] Client portal (client login to book/view own sessions)
- [ ] Legal pages (/privacy, /terms) — needed for DPDP Act compliance
- [ ] Consent banner + consent at signup
- [ ] PDF invoice generation/download
- [ ] Automated reminders (24h, 1h before session via WhatsApp/email)
- [ ] Google Calendar bi-directional sync

### Tier 3 — Polish & growth
- [ ] Audit logging (who accessed what, when)
- [ ] Data deletion/export for clients (DPDP right to erasure)
- [ ] Real-time messaging (Supabase Realtime)
- [ ] Analytics/dashboard metrics
- [ ] Data export (CSV/JSON)
- [ ] File upload for resources (Supabase Storage integration)
- [ ] Error tracking/monitoring
- [ ] Unit/integration/E2E tests
- [ ] Custom domain setup (mano.app)

## Commits (dev branch)

| # | Hash | Message |
|---|------|---------|
| 35 | ead7270 | Add missing blocked-slot overlap check to break creation |
| 34 | ae7952b | Add edit/delete for sessions and breaks with loading overlay |
| 33 | c1927e9 | Update lockfile for sonner dependency |
| 32 | cdefa5d | Add global toast notifications with Sonner |
| 31 | a96adc7 | Use TRPCError for overlap errors so messages reach the client |
| 30 | 740c1eb | Add overlap detection for session creation, approval, and breaks |
| 29 | 22b5ed1 | Add calendar control center with week/day views and session management |
| 28 | ac92a2e | Fix double auth check in middleware and increase query stale time |
| 27 | f04afbd | Add configurable session types (intro call + regular sessions) |
| 26 | 5882ae9 | Update STATUS.md with latest commits and deployment state |
| 25 | 2eec6b7 | Fix decryption crash on legacy plaintext data |
| 24 | 78a7738 | Update STATUS.md with encryption, new landing sections, and docs |
| 23 | a7b6915 | Add AES-256-GCM column encryption for clinical data at rest |
| 22 | 03fed65 | Use Unsplash images in blog teaser cards and fix card alignment |
| 21 | 5594b59 | Add 4 landing page sections: How It Works, Booking Preview, FAQ, Blog Teaser |
| 20 | b81b069 | Update STATUS.md with all completed features and current state |
| 19 | 97b92c7 | Add resource library and client sharing with modality/category tags |
| 18 | 56f0226 | Add treatment plans: schema, API, editor UI, and client integration |
| 17 | 98de0b3 | Add client detail page with session history and notes tabs |
| 16 | b42c995 | Add booking page policies and full session notes UI |
| 15 | 9364540 | Add lucide-react icons across dashboard sidebar and all pages |
| 14 | 0876986 | Add booking approval flow: sessions require therapist approval before confirmation |
| 13 | 8857ff9 | Build dashboard home, clients list, and schedule pages |
| 12 | b32db05 | Build settings page with profile, availability, and booking controls |
| 11 | f1a2240 | Redesign booking page with polished UI |
| 10 | 26170b8 | Build public booking page with full slot selection flow |
| 9 | 20231cf | Fix logo: cache-bust for transparent version + rounded-full |
| 8 | 4dbc4b8 | Add project STATUS.md |
| 7 | 43602f8 | Add Mano logo from Supabase CDN |
| 6 | 0a570b3 | Add full landing page with signup/login CTAs |
| 5 | f470ad7 | Fix login build: wrap useSearchParams in Suspense boundary |
| 4 | f2142cf | Fix signup: wire real Supabase auth + auto-create therapist trigger |
| 3 | ec25cb5 | Fix Vercel build: set root directory to apps/web |
| 2 | 83173a9 | Add Vercel config and Supabase setup |
| 1 | d80051f | Initial monorepo scaffold — DDD architecture |

## Database Migrations

| # | File | Description |
|---|------|-------------|
| 1 | 00001_initial_schema.sql | 8 core tables, enums, RLS, indexes, triggers |
| 2 | 00002_auto_create_therapist.sql | handle_new_user() trigger |
| 3 | 00003_add_pending_approval_status.sql | Add pending_approval to session_status enum |
| 4 | 00004_add_booking_policies.sql | Cancellation/late/rescheduling policy columns |
| 5 | 00005_add_treatment_plans.sql | treatment_plans table + modality/status enums |
| 6 | 00006_add_resources.sql | resources + client_resources tables, GIN index |
| 7 | 00007_encryption_column_types.sql | Change text[]/jsonb columns to text for encrypted data |
| 8 | 00008_session_types.sql | Add session_type_name to sessions, JSONB session_types to therapists |

## Pages Summary (17 routes)

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing/marketing page (14 sections) |
| `/login` | Static | Login form |
| `/signup` | Static | Signup form |
| `/booking/[slug]` | Dynamic | Public booking page per therapist |
| `/dashboard` | Static | Today's overview (stats + sessions) |
| `/dashboard/schedule` | Static | Weekly schedule with approve/reject |
| `/dashboard/clients` | Static | Client list with search/add |
| `/dashboard/clients/[id]` | Dynamic | Client detail hub (4 tabs) |
| `/dashboard/clients/[id]/treatment-plan/new` | Dynamic | Create treatment plan |
| `/dashboard/clients/[id]/treatment-plan/[planId]` | Dynamic | Edit treatment plan |
| `/dashboard/notes` | Static | All notes with client filter |
| `/dashboard/notes/new` | Static | Create note (with session deep link) |
| `/dashboard/notes/[noteId]` | Dynamic | Edit existing note |
| `/dashboard/resources` | Static | Resource library with modality filter |
| `/dashboard/payments` | Static | Placeholder |
| `/dashboard/messages` | Static | Placeholder |
| `/settings` | Static | Profile, availability, booking, policies |

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Encryption (32-byte base64 key for AES-256-GCM)
ENCRYPTION_KEY=

# Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Zoom OAuth
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# WhatsApp (Gupshup)
WHATSAPP_API_KEY=
WHATSAPP_API_URL=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ROOT_DOMAIN=
```
