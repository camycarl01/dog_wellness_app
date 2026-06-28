-- ============================================================
-- PawCare — Supabase Database Schema
-- Run this in your Supabase project → SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- USERS (mirrors Supabase auth.users)
-- ---------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  name        text,
  is_breeder  boolean default false,
  created_at  timestamptz default now()
);

-- Auto-create a users row when someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, is_breeder)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    (new.raw_user_meta_data->>'is_breeder')::boolean
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------
-- DOGS
-- ---------------------------------------------------------------
create table if not exists public.dogs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  breed       text not null,
  dob         date not null,
  weight_kg   decimal(5,2) not null,
  sex         text check (sex in ('male', 'female')) not null,
  is_neutered boolean default false,
  photo_url   text,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------
-- HEALTH — Symptom logs
-- ---------------------------------------------------------------
create table if not exists public.symptom_logs (
  id           uuid primary key default gen_random_uuid(),
  dog_id       uuid not null references public.dogs(id) on delete cascade,
  logged_at    timestamptz default now(),
  symptoms     jsonb not null,
  duration_days integer default 1,
  prediction   text,
  severity     text check (severity in ('mild', 'moderate', 'severe', 'emergency')),
  confidence   decimal(4,3)
);

-- ---------------------------------------------------------------
-- NUTRITION — Feeding logs
-- ---------------------------------------------------------------
create table if not exists public.feeding_logs (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid not null references public.dogs(id) on delete cascade,
  logged_at       timestamptz default now(),
  meal_time       text check (meal_time in ('morning', 'afternoon', 'evening')),
  food_type       text,
  quantity_grams  decimal(6,2),
  notes           text
);

-- ---------------------------------------------------------------
-- VET — Visits
-- ---------------------------------------------------------------
create table if not exists public.vet_visits (
  id            uuid primary key default gen_random_uuid(),
  dog_id        uuid not null references public.dogs(id) on delete cascade,
  visit_date    date not null,
  reason        text not null,
  notes         text,
  next_due_date date,
  vet_name      text
);

-- ---------------------------------------------------------------
-- VET — Vaccines
-- ---------------------------------------------------------------
create table if not exists public.vaccines (
  id             uuid primary key default gen_random_uuid(),
  dog_id         uuid not null references public.dogs(id) on delete cascade,
  vaccine_name   text not null,
  given_date     date not null,
  next_due_date  date not null,
  status         text check (status in ('up_to_date', 'due_soon', 'overdue'))
);

-- ---------------------------------------------------------------
-- TRACKING — Weight logs
-- ---------------------------------------------------------------
create table if not exists public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid not null references public.dogs(id) on delete cascade,
  logged_at  timestamptz default now(),
  weight_kg  decimal(5,2) not null
);

-- ---------------------------------------------------------------
-- TRACKING — Mood logs
-- ---------------------------------------------------------------
create table if not exists public.mood_logs (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid not null references public.dogs(id) on delete cascade,
  logged_at   timestamptz default now(),
  mood_score  integer check (mood_score between 1 and 5),
  mood_label  text check (mood_label in ('anxious', 'calm', 'playful', 'lethargic', 'aggressive')),
  notes       text
);

-- ---------------------------------------------------------------
-- REPRODUCTIVE — Heat cycles (female dogs only)
-- ---------------------------------------------------------------
create table if not exists public.heat_cycles (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid not null references public.dogs(id) on delete cascade,
  start_date  date not null,
  end_date    date,
  notes       text
);

-- ---------------------------------------------------------------
-- BREEDER — Litters
-- ---------------------------------------------------------------
create table if not exists public.litters (
  id              uuid primary key default gen_random_uuid(),
  mother_dog_id   uuid not null references public.dogs(id) on delete cascade,
  sire_name       text,
  birth_date      date not null,
  puppy_count     integer not null,
  notes           text
);

-- ---------------------------------------------------------------
-- BREEDER — Puppies
-- ---------------------------------------------------------------
create table if not exists public.puppies (
  id             uuid primary key default gen_random_uuid(),
  litter_id      uuid not null references public.litters(id) on delete cascade,
  name           text not null,
  sex            text check (sex in ('male', 'female')),
  weight_kg      decimal(5,3),
  colour         text,
  buyer_name     text,
  buyer_contact  text,
  is_sold        boolean default false,
  notes          text
);

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Users can only see their own data.
-- ---------------------------------------------------------------

-- Enable RLS on all tables
alter table public.users        enable row level security;
alter table public.dogs         enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.feeding_logs enable row level security;
alter table public.vet_visits   enable row level security;
alter table public.vaccines     enable row level security;
alter table public.weight_logs  enable row level security;
alter table public.mood_logs    enable row level security;
alter table public.heat_cycles  enable row level security;
alter table public.litters      enable row level security;
alter table public.puppies      enable row level security;

-- Users: read/write own row only
create policy "users_own" on public.users
  using (auth.uid() = id);

-- Dogs: read/write own dogs only
create policy "dogs_own" on public.dogs
  using (auth.uid() = user_id);

-- All dog sub-tables: allow if user owns the dog
create policy "symptom_logs_own" on public.symptom_logs
  using (dog_id in (select id from public.dogs where user_id = auth.uid()));

create policy "feeding_logs_own" on public.feeding_logs
  using (dog_id in (select id from public.dogs where user_id = auth.uid()));

create policy "vet_visits_own" on public.vet_visits
  using (dog_id in (select id from public.dogs where user_id = auth.uid()));

create policy "vaccines_own" on public.vaccines
  using (dog_id in (select id from public.dogs where user_id = auth.uid()));

create policy "weight_logs_own" on public.weight_logs
  using (dog_id in (select id from public.dogs where user_id = auth.uid()));

create policy "mood_logs_own" on public.mood_logs
  using (dog_id in (select id from public.dogs where user_id = auth.uid()));

create policy "heat_cycles_own" on public.heat_cycles
  using (dog_id in (select id from public.dogs where user_id = auth.uid()));

create policy "litters_own" on public.litters
  using (mother_dog_id in (select id from public.dogs where user_id = auth.uid()));

create policy "puppies_own" on public.puppies
  using (litter_id in (select id from public.litters
                        where mother_dog_id in (select id from public.dogs where user_id = auth.uid())));

-- ---------------------------------------------------------------
-- INDEXES — for common query patterns
-- ---------------------------------------------------------------
create index if not exists idx_dogs_user_id          on public.dogs(user_id);
create index if not exists idx_symptom_logs_dog_id   on public.symptom_logs(dog_id);
create index if not exists idx_feeding_logs_dog_id   on public.feeding_logs(dog_id);
create index if not exists idx_vet_visits_dog_id     on public.vet_visits(dog_id);
create index if not exists idx_vaccines_dog_id       on public.vaccines(dog_id);
create index if not exists idx_weight_logs_dog_id    on public.weight_logs(dog_id);
create index if not exists idx_mood_logs_dog_id      on public.mood_logs(dog_id);
create index if not exists idx_heat_cycles_dog_id    on public.heat_cycles(dog_id);
create index if not exists idx_litters_mother        on public.litters(mother_dog_id);

-- Done! Your schema is ready.
-- Next: enable Email auth in Supabase Auth → Providers → Email
