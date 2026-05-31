alter table public.person_profiles
add column if not exists health_score integer not null default 3 check (health_score between 1 and 5),
add column if not exists joy_score integer not null default 3 check (joy_score between 1 and 5),
add column if not exists tier integer not null default 3 check (tier between 1 and 4),
add column if not exists relation_mode_tags text[] not null default '{}'::text[];
