-- =============================================================================
-- Mano — Initial database schema
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. THERAPISTS
-- ---------------------------------------------------------------------------
create table public.therapists (
    id            uuid primary key references auth.users (id) on delete cascade,
    slug          text        not null unique,
    full_name     text        not null,
    display_name  text,
    bio           text,
    qualifications text,
    phone         text,
    avatar_url    text,
    timezone      text        not null default 'Asia/Kolkata',

    session_duration_mins integer not null default 50,
    buffer_mins           integer not null default 10,
    session_rate_inr      integer not null default 0,

    booking_page_active   boolean not null default false,
    gstin                 text,

    google_calendar_token jsonb,
    zoom_token            jsonb,
    google_connected      boolean not null default false,
    zoom_connected        boolean not null default false,

    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. AVAILABILITY
-- ---------------------------------------------------------------------------
create table public.availability (
    id            uuid primary key default gen_random_uuid(),
    therapist_id  uuid        not null references public.therapists (id) on delete cascade,
    day_of_week   smallint    not null check (day_of_week between 0 and 6),
    start_time    time        not null,
    end_time      time        not null,
    is_active     boolean     not null default true,

    constraint uq_availability_therapist_day unique (therapist_id, day_of_week),
    constraint ck_availability_time_range check (start_time < end_time)
);

-- ---------------------------------------------------------------------------
-- 3. BLOCKED SLOTS
-- ---------------------------------------------------------------------------
create table public.blocked_slots (
    id            uuid primary key default gen_random_uuid(),
    therapist_id  uuid         not null references public.therapists (id) on delete cascade,
    start_at      timestamptz  not null,
    end_at        timestamptz  not null,
    reason        text,

    constraint ck_blocked_slots_range check (start_at < end_at)
);

-- ---------------------------------------------------------------------------
-- 4. CLIENTS
-- ---------------------------------------------------------------------------
create table public.clients (
    id                uuid primary key default gen_random_uuid(),
    therapist_id      uuid        not null references public.therapists (id) on delete cascade,
    user_id           uuid        references auth.users (id) on delete set null,
    full_name         text        not null,
    email             text,
    phone             text,
    date_of_birth     date,
    emergency_contact text,
    notes_private     text,
    intake_completed  boolean     not null default false,
    is_active         boolean     not null default true,

    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. SESSIONS
-- ---------------------------------------------------------------------------
create type public.session_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'waived');

create table public.sessions (
    id                  uuid primary key default gen_random_uuid(),
    therapist_id        uuid            not null references public.therapists (id) on delete cascade,
    client_id           uuid            not null references public.clients   (id) on delete cascade,

    starts_at           timestamptz     not null,
    ends_at             timestamptz     not null,
    duration_mins       integer         not null,
    status              public.session_status  not null default 'scheduled',

    zoom_meeting_id     text,
    zoom_join_url       text,
    zoom_start_url      text,
    google_event_id     text,

    payment_status      public.payment_status  not null default 'pending',
    amount_inr          integer         not null default 0,
    razorpay_payment_id text,

    reminder_24h_sent   boolean not null default false,
    reminder_1h_sent    boolean not null default false,

    session_number      integer,
    cancellation_reason text,
    cancelled_at        timestamptz,

    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),

    constraint ck_sessions_time_range check (starts_at < ends_at)
);

-- ---------------------------------------------------------------------------
-- 6. SESSION NOTES
-- ---------------------------------------------------------------------------
create type public.note_type as enum ('soap', 'dap', 'birp', 'freeform');

create table public.session_notes (
    id              uuid primary key default gen_random_uuid(),
    session_id      uuid            not null references public.sessions (id) on delete cascade,
    therapist_id    uuid            not null references public.therapists (id) on delete cascade,

    note_type       public.note_type not null default 'freeform',
    subjective      text,
    objective       text,
    assessment      text,
    plan            text,
    freeform_content text,
    homework        text,
    techniques_used text[],
    risk_flags      text[],

    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. MESSAGES
-- ---------------------------------------------------------------------------
create type public.sender_type as enum ('therapist', 'client');

create table public.messages (
    id            uuid primary key default gen_random_uuid(),
    therapist_id  uuid            not null references public.therapists (id) on delete cascade,
    client_id     uuid            not null references public.clients    (id) on delete cascade,
    sender_type   public.sender_type not null,
    content       text            not null,
    read_at       timestamptz,

    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. INVOICES
-- ---------------------------------------------------------------------------
create type public.invoice_status as enum ('unpaid', 'paid', 'refunded');

create table public.invoices (
    id                  uuid primary key default gen_random_uuid(),
    therapist_id        uuid            not null references public.therapists (id) on delete cascade,
    client_id           uuid            not null references public.clients    (id) on delete cascade,
    session_id          uuid            references public.sessions (id) on delete set null,

    invoice_number      text            not null unique,
    amount_inr          integer         not null default 0,
    gst_amount_inr      integer         not null default 0,
    total_inr           integer         not null default 0,
    status              public.invoice_status not null default 'unpaid',

    razorpay_payment_id text,
    razorpay_order_id   text,
    paid_at             timestamptz,

    created_at  timestamptz not null default now()
);

-- ===========================================================================
-- INDEXES
-- ===========================================================================
create index idx_therapists_slug on public.therapists (slug);
create index idx_availability_therapist on public.availability (therapist_id);
create index idx_blocked_slots_range on public.blocked_slots (therapist_id, start_at, end_at);
create index idx_clients_therapist on public.clients (therapist_id);
create index idx_clients_email on public.clients (therapist_id, email);
create index idx_sessions_therapist on public.sessions (therapist_id);
create index idx_sessions_starts_at on public.sessions (therapist_id, starts_at);
create index idx_sessions_status on public.sessions (status);
create index idx_session_notes_session on public.session_notes (session_id);
create index idx_messages_thread on public.messages (therapist_id, client_id, created_at);
create index idx_invoices_therapist on public.invoices (therapist_id);
create index idx_invoices_number on public.invoices (invoice_number);

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================
alter table public.therapists    enable row level security;
alter table public.availability  enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.clients       enable row level security;
alter table public.sessions      enable row level security;
alter table public.session_notes enable row level security;
alter table public.messages      enable row level security;
alter table public.invoices      enable row level security;

-- Therapists: own data + public booking page
create policy "therapists_select_own" on public.therapists for select using (auth.uid() = id);
create policy "therapists_update_own" on public.therapists for update using (auth.uid() = id);
create policy "therapists_insert_own" on public.therapists for insert with check (auth.uid() = id);
create policy "therapists_public_booking" on public.therapists for select using (booking_page_active = true);

-- Availability
create policy "availability_all_own" on public.availability for all using (therapist_id = auth.uid());

-- Blocked slots
create policy "blocked_slots_all_own" on public.blocked_slots for all using (therapist_id = auth.uid());

-- Clients
create policy "clients_therapist" on public.clients for all using (therapist_id = auth.uid());
create policy "clients_self_select" on public.clients for select using (user_id = auth.uid());

-- Sessions
create policy "sessions_therapist" on public.sessions for all using (therapist_id = auth.uid());
create policy "sessions_client_select" on public.sessions for select
    using (client_id in (select id from public.clients where user_id = auth.uid()));

-- Session notes: therapist ONLY (privacy-critical)
create policy "session_notes_therapist" on public.session_notes for all using (therapist_id = auth.uid());

-- Messages
create policy "messages_therapist" on public.messages for all using (therapist_id = auth.uid());
create policy "messages_client_select" on public.messages for select
    using (client_id in (select id from public.clients where user_id = auth.uid()));
create policy "messages_client_insert" on public.messages for insert
    with check (client_id in (select id from public.clients where user_id = auth.uid()) and sender_type = 'client');

-- Invoices
create policy "invoices_therapist" on public.invoices for all using (therapist_id = auth.uid());
create policy "invoices_client_select" on public.invoices for select
    using (client_id in (select id from public.clients where user_id = auth.uid()));

-- ===========================================================================
-- AUTO updated_at TRIGGER
-- ===========================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_therapists_updated_at before update on public.therapists for each row execute function public.set_updated_at();
create trigger trg_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger trg_sessions_updated_at before update on public.sessions for each row execute function public.set_updated_at();
create trigger trg_session_notes_updated_at before update on public.session_notes for each row execute function public.set_updated_at();
