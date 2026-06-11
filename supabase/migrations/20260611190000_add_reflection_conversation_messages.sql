alter table public.reflection_records
add column if not exists conversation_messages jsonb not null default '[]'::jsonb;
