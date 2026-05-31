alter table public.person_profiles
add column if not exists position_x numeric(5,2) check (position_x is null or position_x between 0 and 100),
add column if not exists position_y numeric(5,2) check (position_y is null or position_y between 0 and 100),
add column if not exists relation_label text not null default '';
