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

### Database
- [x] Full schema — 8 tables: therapists, availability, blocked_slots, clients, sessions, session_notes, messages, invoices
- [x] 5 custom enums: session_status, payment_status, note_type, sender_type, invoice_status
- [x] RLS policies on all tables (therapist-scoped access)
- [x] Performance indexes (12+)
- [x] Auto-updated_at triggers
- [x] `handle_new_user()` trigger — auto-creates therapist profile on signup

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
- [x] Fade-up scroll animations
- [x] Responsive (mobile hamburger, stacked grids)

### Branding
- [x] Logo on Supabase CDN — nav, dashboard sidebar, favicon, OG image
- [x] Color system: sage #4A7C6F, cream #F5F0E8, card #FDFAF5, ink #2C2825, amber #C8873A
- [x] Typography: Lora (headings), DM Sans (body)
- [x] Border radius tokens: card 16px, small 10px, pill 100px

### API Layer (@mano/api)
- [x] tRPC setup with Supabase context + auth middleware
- [x] 7 routers defined: therapist, client, session, booking, payment, message, integration
- [x] Public procedures (booking slots, therapist profile by slug)
- [x] Protected procedures (all dashboard operations)

### Domain Logic (@mano/domain)
- [x] Slot calculator — available slots from availability rules minus booked/blocked
- [x] Session service — conflict detection, booking, cancellation
- [x] Billing service — invoice number generation (MANO-YYYYMM-XXXX), GST calculation
- [x] Therapist, client, message services

### Shared (@mano/shared)
- [x] Zod schemas for all entities (therapist, client, session, booking, payment, message)
- [x] Constants: pricing tiers, session types, note templates (SOAP, DAP, BIRP)

## What's SCAFFOLD (structure exists, needs real UI/wiring)

### Dashboard Pages
- [ ] Today (`/dashboard`) — placeholder, needs session.today tRPC query
- [ ] Schedule (`/dashboard/schedule`) — needs calendar view + availability editor
- [ ] Clients (`/dashboard/clients`) — needs client list table + add/edit forms
- [ ] Notes (`/dashboard/notes`) — needs note list + SOAP/DAP/BIRP template editor
- [ ] Payments (`/dashboard/payments`) — needs invoice table + create invoice form
- [ ] Messages (`/dashboard/messages`) — needs chat UI with client list sidebar
- [ ] Settings (`/settings`) — sections defined, forms not wired

### Booking Page
- [ ] `/booking/[slug]` — shows therapist slug, needs calendar picker, client form, Razorpay payment

### Integration Clients (@mano/integrations)
- [ ] Zoom — OAuth URL generation done, meeting creation/deletion not wired to routers
- [ ] Google Calendar — OAuth URL generation done, event CRUD not connected
- [ ] Razorpay — order creation + webhook verification implemented, not wired to booking flow
- [ ] WhatsApp (Gupshup) — message sending stub
- [ ] Email (Resend) — email sending stub

### Repository Layer (@mano/db)
- [ ] 5 repository classes defined (TherapistRepo, ClientRepo, SessionRepo, PaymentRepo, MessageRepo)
- [ ] Basic CRUD operations, not fully utilized by routers yet

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
- [ ] Error tracking/monitoring
- [ ] Unit/integration/E2E tests
- [ ] DPDP Act compliance documentation
- [ ] Custom domain setup (mano.app)

## Commits (dev branch)

| # | Message |
|---|---------|
| 7 | Add Mano logo from Supabase CDN |
| 6 | Add full landing page with signup/login CTAs |
| 5 | Fix login build: wrap useSearchParams in Suspense boundary |
| 4 | Fix signup: wire real Supabase auth + auto-create therapist trigger |
| 3 | Fix Vercel build: set root directory to apps/web |
| 2 | Add Vercel config and Supabase setup |
| 1 | Initial monorepo scaffold — DDD architecture |

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
