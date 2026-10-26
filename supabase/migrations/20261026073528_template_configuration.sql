-- Template configuration: validation, protection of templates in use, duplication,
-- and an overview for the template list.

-- ─── Validation ──────────────────────────────────────────────────────────────

alter table public.schema_templates
  add constraint schema_templates_name_not_blank check (name is not null and length(btrim(name)) > 0);

alter table public.schema_categories
  add constraint schema_categories_name_not_blank check (length(btrim(name)) > 0),
  add constraint schema_categories_weight_range check (weight is null or weight between 0 and 1);

alter table public.schema_field
  add constraint schema_field_name_not_blank check (length(btrim(name)) > 0),
  add constraint schema_field_weight_range check (weight is null or weight between 0 and 1),
  add constraint schema_field_dealbreaker_is_required check (not coalesce(is_dealbreaker, false) or coalesce(is_required, false));

-- ─── Protect templates that screenings are built on ──────────────────────────
-- Deleting a criterion would cascade away the reviews and evidence recorded against it,
-- and deleting a template would orphan its screenings. Texts and weights stay editable;
-- structural changes to a template in use are made on a duplicate.

create or replace function private.prevent_deleting_used_field()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.observations where schema_field_id = old.id)
     or exists (select 1 from public.field_reviews where schema_field_id = old.id)
     or exists (select 1 from public.evidence where schema_field_id = old.id) then
    raise exception 'Criterion "%" has screening results — duplicate the template to change its structure', old.name
      using errcode = 'restrict_violation';
  end if;
  return old;
end;
$$;

create trigger prevent_deleting_used_field
  before delete on public.schema_field
  for each row execute function private.prevent_deleting_used_field();

create or replace function private.prevent_deleting_used_template()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.screenings where schema_template_id = old.id) then
    raise exception 'Template "%" is used by screenings and can''t be deleted', old.name
      using errcode = 'restrict_violation';
  end if;
  return old;
end;
$$;

create trigger prevent_deleting_used_template
  before delete on public.schema_templates
  for each row execute function private.prevent_deleting_used_template();

create or replace function private.touch_template()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_template
  before update on public.schema_templates
  for each row execute function private.touch_template();

revoke execute on function
  private.prevent_deleting_used_field(),
  private.prevent_deleting_used_template(),
  private.touch_template()
from public, anon, authenticated;

-- ─── Duplicate a template ────────────────────────────────────────────────────
-- Copies the template with its categories and fields in one transaction. Runs as the
-- caller, so RLS decides whether they may read the source and write the copy.

create or replace function public.duplicate_template(p_template_id bigint, p_name text default null)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source public.schema_templates;
  v_new_template_id bigint;
  v_category record;
  v_new_category_id bigint;
begin
  select * into v_source from public.schema_templates where id = p_template_id;
  if not found then
    raise exception 'Template not found' using errcode = 'no_data_found';
  end if;

  insert into public.schema_templates (name, description, org_id)
  values (coalesce(nullif(btrim(p_name), ''), v_source.name || ' (copy)'), v_source.description, v_source.org_id)
  returning id into v_new_template_id;

  for v_category in
    select * from public.schema_categories where template_id = p_template_id order by display_order, id
  loop
    insert into public.schema_categories (template_id, code, name, weight, display_order, description)
    values (v_new_template_id, v_category.code, v_category.name, v_category.weight, v_category.display_order, v_category.description)
    returning id into v_new_category_id;

    insert into public.schema_field (
      category_id, semantic_id, name, is_required, weight, extraction_description,
      gap_description, display_order, is_dealbreaker, created_by
    )
    select v_new_category_id, f.semantic_id, f.name, f.is_required, f.weight, f.extraction_description,
           f.gap_description, f.display_order, f.is_dealbreaker, (select auth.uid())
    from public.schema_field f
    where f.category_id = v_category.id;
  end loop;

  return v_new_template_id;
end;
$$;

revoke execute on function public.duplicate_template(bigint, text) from public, anon;
grant execute on function public.duplicate_template(bigint, text) to authenticated;

-- ─── Overview for the template list ──────────────────────────────────────────

create view public.template_overview
with (security_invoker = true) as
select
  t.id,
  t.org_id,
  t.name,
  t.description,
  t.created_at,
  t.updated_at,
  (select count(*) from public.schema_categories c where c.template_id = t.id)::integer as category_count,
  count(f.id)::integer as field_count,
  count(f.id) filter (where f.is_required)::integer as required_count,
  count(f.id) filter (where f.is_dealbreaker)::integer as dealbreaker_count,
  count(f.id) filter (where length(btrim(coalesce(f.gap_description, ''))) > 0)::integer as gap_field_count,
  (select count(*) from public.screenings s where s.schema_template_id = t.id)::integer as screening_count
from public.schema_templates t
left join public.schema_categories c on c.template_id = t.id
left join public.schema_field f on f.category_id = c.id
group by t.id;

revoke all on public.template_overview from anon;
