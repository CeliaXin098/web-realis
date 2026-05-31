create table if not exists public.reflection_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_text text not null,
  emotion_tags text[] not null default '{}',
  emotion_intensity integer not null check (emotion_intensity between 1 and 10),
  related_person text,
  title text not null,
  summary text not null,
  gentle_response text not null,
  emotional_root text not null,
  underlying_needs text[] not null default '{}',
  pattern text not null,
  prescriptions jsonb not null default '{}'::jsonb,
  future_self_note text not null,
  compass_updates jsonb not null default '[]'::jsonb,
  safety_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.person_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship_type text not null,
  nickname text not null,
  related_record_count integer not null default 0,
  common_triggers text[] not null default '{}',
  relationship_pattern_summary text not null default '',
  mbti_tendency text not null default '',
  jungian_functions jsonb not null default '[]'::jsonb,
  closeness_score integer not null default 3 check (closeness_score between 1 and 5),
  health_score integer not null default 3 check (health_score between 1 and 5),
  joy_score integer not null default 3 check (joy_score between 1 and 5),
  tier integer not null default 3 check (tier between 1 and 4),
  relation_mode_tags text[] not null default '{}'::text[],
  position_x numeric(5,2) check (position_x is null or position_x between 0 and 100),
  position_y numeric(5,2) check (position_y is null or position_y between 0 and 100),
  relation_label text not null default '',
  interaction_guide text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, relationship_type, nickname)
);

alter table public.reflection_records enable row level security;
alter table public.person_profiles enable row level security;

create policy "Users can read own reflection records"
on public.reflection_records for select
using (auth.uid() = user_id);

create policy "Users can insert own reflection records"
on public.reflection_records for insert
with check (auth.uid() = user_id);

create policy "Users can update own reflection records"
on public.reflection_records for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own person profiles"
on public.person_profiles for select
using (auth.uid() = user_id);

create policy "Users can insert own person profiles"
on public.person_profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update own person profiles"
on public.person_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
