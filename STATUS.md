# Mano — Project Status

> Last updated: 12 March 2026

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
- [x] Environment variables set on Vercel (all 3 environments)

### Database (6 migrations pushed)
- [x] Full schema — 12 tables: therapists, availability, blocked_slots, clients, sessions, session_notes, messages, invoices, treatment_plans, resources, client_resources
- [x] 8 custom enums: session_status, payment_status, note_type, sender_type, invoice_status, treatment_plan_status, therapy_modality, resource_type
- [x] RLS policies on all tables (therapist-scoped access)
- [x] Performance indexes (15+, including GIN index on resource modality_tags)
- [x] Auto-updated_at triggers on all mutable tables
- [x] `handle_new_user()` trigger — auto-creates therapist profile on signup
- [x] Booking policies columns on therapists (cancellation, late, rescheduling)

### Auth
- [x] Signup page — Supabase signUp with full_name, auto therapist profile via trigger
- [x] Login page — signInWithPassword, redirect support, Suspense boundary
- [x] Protected routes via middleware (dashboard, settings → redirect to /login)

### Landing Page (/)
- [x] Full marketing page — 10 React components
- [x] Navbar with scroll blur, hamburger menu, Sign In + Get Started CTAs
- [x] Hero section with interactive demo browser mockup
- [x] Problem section (6 broken tools → Mano solution)
- [x] Features grid (AI assistant, booking, payments, encryption, messaging)
- [x] Privacy principles + "Mano vs. the rest" comparison
- [x] 3-tier pricing cards (Starter ₹999, Pro ₹1,999, Clinic ₹4,999)
- [x] Testimonials (3 therapists)
- [x] CTA section → /signup
- [x] Footer
- [x] Fade-up scroll animations, responsive design

### Branding
- [x] Logo on Supabase CDN — nav, dashboard sidebar, favicon, OG image
- [x] Color system: sage #4A7C6F, cream #F5F0E8, card #FDFAF5, ink #2C2825, amber #C8873A
- [x] Typography: Lora (headings), DM Sans (body)
- [x] Border radius tokens: card 16px, small 10px, pill 100px

### API Layer (@mano/api) — 9 routers
- [x] tRPC setup with Supabase context + auth middleware
- [x] **therapist** — profile CRUD, getBySlug (public)
- [x] **client** — list, create, update, delete, getDetail (with session count/last session)
- [x] **session** — byClient, today, thisWeek, createNote, updateNote, getNote, getNoteById, listNotes, deleteNote
- [x] **booking** — availableSlots (public), createBooking (public), approve/reject
- [x] **payment** — list, create
- [x] **message** — list, send
- [x] **integration** — status, connect/disconnect
- [x] **treatmentPlan** — list, getById, create, update, updateStatus, delete
- [x] **resource** — list, getById, create, update, delete, share, unshare, listShared

### Domain Logic (@mano/domain)
- [x] Slot calculator — available slots from availability rules minus booked/blocked
- [x] Session service — conflict detection, booking, cancellation
- [x] Billing service — invoice number generation (MANO-YYYYMM-XXXX), GST calculation
- [x] Therapist, client, message services

### Shared (@mano/shared)
- [x] Zod schemas: therapist, client, session, booking, payment, message, treatment-plan, resource
- [x] Constants: pricing tiers, session types, note templates (SOAP/DAP/BIRP/Freeform), therapy modalities (11), common techniques (15), risk flags (6)
- [x] Exported types: Goal, SubGoal, TherapyModality, TherapyModalityKey, ResourceType, etc.

### Booking Page (`/booking/[slug]`)
- [x] Full booking flow: therapist header → date picker → time slot → client form → confirmation
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

### Dashboard — Schedule (`/dashboard/schedule`)
- [x] Week-scoped session list with date/time, client name, status/payment badges
- [x] Approve/reject buttons for pending_approval sessions
- [x] Notes link per session

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
- [x] Plans stored as JSONB goals array for simplicity

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
- [x] Profile form (name, email, phone, bio, slug, session types, default duration, fee)
- [x] Availability editor (day/time per weekday, add/remove slots)
- [x] Booking page toggle + live link
- [x] Policies form (cancellation, late arrival, rescheduling — 3 textareas)

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

- [ ] Real-time messaging (Supabase Realtime)
- [ ] Automated reminders (24h, 1h before session via WhatsApp/email)
- [ ] Zoom meeting auto-creation on booking
- [ ] Google Calendar bi-directional sync
- [ ] PDF invoice generation/download
- [ ] Client portal (client login to book/view sessions)
- [ ] Analytics/dashboard metrics
- [ ] Data export (CSV/JSON)
- [ ] Email notifications (booking confirmation, reminders, receipts)
- [ ] File upload for resources (Supabase Storage integration)
- [ ] Error tracking/monitoring
- [ ] Unit/integration/E2E tests
- [ ] DPDP Act compliance documentation
- [ ] Custom domain setup (mano.app)

## Commits (dev branch)

| # | Hash | Message |
|---|------|---------|
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

## Pages Summary (17 routes)

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing/marketing page |
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
