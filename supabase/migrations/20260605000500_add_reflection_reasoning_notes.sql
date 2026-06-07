alter table public.reflection_records
add column if not exists reasoning_notes jsonb not null default '{}'::jsonb;
