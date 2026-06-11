alter table public.user_memory_profiles
add column if not exists support_style text not null default '',
add column if not exists caution_notes text[] not null default '{}',
add column if not exists created_at timestamptz not null default now();

alter table public.user_memory_events
add column if not exists emotion_tags text[] not null default '{}',
add column if not exists keywords text[] not null default '{}',
add column if not exists confidence numeric(3,2) not null default 0.60;

create index if not exists user_memory_events_user_occurred_at_idx
on public.user_memory_events (user_id, occurred_at desc);
