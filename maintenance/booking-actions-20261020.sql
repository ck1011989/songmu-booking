-- Applied to Supabase on 2026-10-20. Reference for maintenance; do not reapply blindly.

alter table public.appointments add column if not exists admin_notes text;
alter table public.appointments add constraint appointments_admin_notes_length check (char_length(admin_notes)<=4000);
create function public.admin_reschedule_appointment(p_id uuid,p_expected_start timestamptz,p_expected_status text,p_start timestamptz)
returns setof public.appointments language plpgsql security invoker set search_path='' as $$
declare a public.appointments%rowtype; opening record; d date; minutes integer; finish timestamptz;
begin
 if auth.uid() is null or not private.is_staff_admin() then raise exception 'staff_required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('songmu_schedule',0));
 select * into a from public.appointments where id=p_id for update;
 if not found or a.status not in ('pending','confirmed') or a.starts_at is distinct from p_expected_start or a.status is distinct from p_expected_status then raise exception 'booking_changed_refresh'; end if;
 if p_start is null or p_start<=now() then raise exception 'invalid_reschedule_time'; end if;
 d:=(p_start at time zone 'Asia/Taipei')::date;
 minutes:=extract(hour from p_start at time zone 'Asia/Taipei')::integer*60+extract(minute from p_start at time zone 'Asia/Taipei')::integer;
 if extract(second from p_start)<>0 or minutes%30<>0 then raise exception 'invalid_reschedule_time'; end if;
 select * into opening from public.admin_get_opening_days() where day=d;
 if not found or minutes<extract(hour from opening.opens)::integer*60+extract(minute from opening.opens)::integer or minutes>opening.closes_minutes then raise exception 'outside_opening_hours'; end if;
 finish:=p_start+make_interval(mins=>a.duration_minutes);
 if exists(select 1 from public.appointments b where b.id<>p_id and b.status in ('pending','confirmed','completed') and b.starts_at<finish+interval '10 minutes' and b.ends_at+interval '10 minutes'>p_start) then raise exception 'reschedule_conflict';end if;
 return query update public.appointments set starts_at=p_start,ends_at=finish where id=p_id returning *;
end $$;
revoke all on function public.admin_reschedule_appointment(uuid,timestamptz,text,timestamptz) from public,anon;
grant execute on function public.admin_reschedule_appointment(uuid,timestamptz,text,timestamptz) to authenticated;
notify pgrst,'reload schema';
