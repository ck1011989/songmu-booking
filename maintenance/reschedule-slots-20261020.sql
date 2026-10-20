-- Applied 2026-10-20. Maintenance reference; do not reapply blindly.

create function public.admin_reschedule_slots(p_id uuid,p_day date)
returns table(starts_at timestamptz,ends_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare a public.appointments%rowtype; opening record;
begin
 if auth.uid() is null or not private.is_staff_admin() then raise exception 'staff_required';end if;
 select * into a from public.appointments where id=p_id;
 if not found or a.status not in ('pending','confirmed') then raise exception 'booking_changed_refresh';end if;
 select * into opening from public.admin_get_opening_days() where day=p_day;
 if not found then return;end if;
 return query
 select s.t,s.t+make_interval(mins=>a.duration_minutes)
 from generate_series(
  (p_day+opening.opens) at time zone 'Asia/Taipei',
  (p_day::timestamp+make_interval(mins=>opening.closes_minutes)) at time zone 'Asia/Taipei',
  interval '30 minutes'
 ) as s(t)
 where s.t>now()
 and not exists(select 1 from public.appointments b where b.id<>a.id and b.status in ('pending','confirmed','completed')
 and b.starts_at<s.t+make_interval(mins=>a.duration_minutes)+interval '10 minutes'
 and b.ends_at+interval '10 minutes'>s.t)
 order by s.t;
end $$;
revoke all on function public.admin_reschedule_slots(uuid,date) from public,anon;
grant execute on function public.admin_reschedule_slots(uuid,date) to authenticated;
notify pgrst,'reload schema';
