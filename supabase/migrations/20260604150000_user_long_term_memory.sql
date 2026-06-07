create table if not exists public.user_memory_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  core_needs text[] not null default '{}',
  recurring_patterns text[] not null default '{}',
  common_triggers text[] not null default '{}',
  support_style text not null default '',
  caution_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_memory_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_record_id uuid references public.reflection_records(id) on delete cascade,
  memory_type text not null check (memory_type in ('need', 'trigger', 'pattern', 'person', 'preference', 'warning')),
  title text not null,
  content text not null,
  emotion_tags text[] not null default '{}',
  related_person text,
  keywords text[] not null default '{}',
  confidence numeric(3,2) not null default 0.60 check (confidence >= 0 and confidence <= 1),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_memory_events_user_occurred_at_idx
on public.user_memory_events (user_id, occurred_at desc);

create index if not exists user_memory_events_user_type_idx
on public.user_memory_events (user_id, memory_type);

alter table public.user_memory_profiles enable row level security;
alter table public.user_memory_events enable row level security;

create policy "Users can read own memory profile"
on public.user_memory_profiles for select
using (auth.uid() = user_id);

create policy "Users can insert own memory profile"
on public.user_memory_profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update own memory profile"
on public.user_memory_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own memory profile"
on public.user_memory_profiles for delete
using (auth.uid() = user_id);

create policy "Users can read own memory events"
on public.user_memory_events for select
using (auth.uid() = user_id);

create policy "Users can insert own memory events"
on public.user_memory_events for insert
with check (auth.uid() = user_id);

create policy "Users can update own memory events"
on public.user_memory_events for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own memory events"
on public.user_memory_events for delete
using (auth.uid() = user_id);
