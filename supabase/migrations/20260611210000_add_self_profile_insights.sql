alter table public.user_memory_profiles
add column if not exists mbti_type text not null default '',
add column if not exists mbti_source text not null default 'inferred',
add column if not exists jungian_functions jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_memory_profiles_mbti_source_check'
      and conrelid = 'public.user_memory_profiles'::regclass
  ) then
    alter table public.user_memory_profiles
    add constraint user_memory_profiles_mbti_source_check
    check (mbti_source in ('inferred', 'confirmed'));
  end if;
end
$$;
