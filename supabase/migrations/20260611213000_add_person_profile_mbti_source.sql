alter table public.person_profiles
add column if not exists mbti_source text not null default 'inferred';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'person_profiles_mbti_source_check'
      and conrelid = 'public.person_profiles'::regclass
  ) then
    alter table public.person_profiles
    add constraint person_profiles_mbti_source_check
    check (mbti_source in ('inferred', 'confirmed'));
  end if;
end
$$;
