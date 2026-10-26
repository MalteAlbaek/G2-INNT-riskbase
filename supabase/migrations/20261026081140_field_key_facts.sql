-- Key facts: structured properties a criterion extracts, defined as JSON Schema on the
-- criterion and filled by the AI (primarily) or by a reviewer.
--
-- schema_field.output_schema follows JSON Schema, with a few annotations of our own:
--   {
--     "type": "object",
--     "properties": {
--       "noise_level": { "type": "number", "description": "...", "x-unit": "dB" },
--       "mitigation":  { "type": "string", "enum": ["screen", "facade"],
--                        "x-enum-descriptions": { "screen": "Noise barrier" } },
--       "decided_at":  { "type": "string", "format": "date" },
--       "exceeds":     { "type": "boolean" }
--     },
--     "required": ["noise_level"],
--     "x-property-order": ["noise_level", "mitigation", "decided_at", "exceeds"],
--     "additionalProperties": false
--   }
-- jsonb doesn't keep key order, hence x-property-order.

alter table public.schema_field
  add column output_schema jsonb,
  add constraint schema_field_output_schema_is_object check (
    output_schema is null
    or (jsonb_typeof(output_schema) = 'object'
        and output_schema ->> 'type' = 'object'
        and jsonb_typeof(output_schema -> 'properties') = 'object')
  );

-- Evidence can point at one property of a criterion.
alter table public.evidence add column property_key text;

alter type public.review_event_type add value if not exists 'fact_updated';

-- ─── Values ──────────────────────────────────────────────────────────────────
-- The AI's value and the reviewer's value are kept side by side, so a correction never
-- erases what the AI extracted. The reviewer's value wins where both exist.

create type public.fact_source as enum ('ai', 'reviewer');

create table public.fact_values (
  screening_id bigint not null references public.screenings (id) on delete cascade,
  schema_field_id bigint not null references public.schema_field (id) on delete cascade,
  property_key text not null,
  source public.fact_source not null,
  value jsonb not null,
  set_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (screening_id, schema_field_id, property_key, source)
);

create index fact_values_schema_field_id_idx on public.fact_values (schema_field_id);
create index fact_values_set_by_idx on public.fact_values (set_by);

alter table public.fact_values enable row level security;
revoke all on public.fact_values from anon;

create policy "members read facts" on public.fact_values
  for select to authenticated using (private.can_access_screening(screening_id));
-- Members fill or correct facts as reviewers; AI values are written by the backend.
create policy "members set reviewer facts" on public.fact_values
  for insert to authenticated with check (source = 'reviewer' and private.can_access_screening(screening_id));
create policy "members update reviewer facts" on public.fact_values
  for update to authenticated
  using (source = 'reviewer' and private.can_access_screening(screening_id))
  with check (source = 'reviewer' and private.can_access_screening(screening_id));
create policy "members clear reviewer facts" on public.fact_values
  for delete to authenticated using (source = 'reviewer' and private.can_access_screening(screening_id));

-- A value must match the property's type in the criterion's schema.
create or replace function private.check_fact_value()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_property jsonb;
  v_type text;
begin
  select f.output_schema -> 'properties' -> new.property_key into v_property
  from public.schema_field f
  where f.id = new.schema_field_id;

  if v_property is null then
    raise exception 'Unknown key fact "%" for this criterion', new.property_key using errcode = 'check_violation';
  end if;

  v_type := v_property ->> 'type';
  if (v_type = 'number' and jsonb_typeof(new.value) <> 'number')
     or (v_type = 'boolean' and jsonb_typeof(new.value) <> 'boolean')
     or (v_type = 'string' and jsonb_typeof(new.value) <> 'string') then
    raise exception 'Key fact "%" must be a %', new.property_key, v_type using errcode = 'check_violation';
  end if;

  if v_property ? 'enum' and not (v_property -> 'enum') @> jsonb_build_array(new.value) then
    raise exception 'Key fact "%" must be one of %', new.property_key, v_property -> 'enum' using errcode = 'check_violation';
  end if;

  if v_property ->> 'format' = 'date' and (new.value #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Key fact "%" must be a date (YYYY-MM-DD)', new.property_key using errcode = 'check_violation';
  end if;

  if new.source = 'reviewer' then
    new.set_by := (select auth.uid());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger check_fact_value
  before insert or update on public.fact_values
  for each row execute function private.check_fact_value();

-- Reviewer changes to facts land in the criterion's audit trail.
create or replace function private.log_fact_value()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.fact_values;
begin
  v_row := case when tg_op = 'DELETE' then old else new end;
  if v_row.source <> 'reviewer' then
    return v_row;
  end if;

  insert into public.field_review_events (screening_id, schema_field_id, type, actor, text)
  values (
    v_row.screening_id,
    v_row.schema_field_id,
    'fact_updated',
    (select auth.uid()),
    case when tg_op = 'DELETE' then v_row.property_key || ' cleared'
         else v_row.property_key || ': ' || (v_row.value #>> '{}') end
  );
  return v_row;
end;
$$;

create trigger log_fact_value
  after insert or update or delete on public.fact_values
  for each row execute function private.log_fact_value();

-- Criteria with extracted facts count as "in use", like those with observations.
create or replace function private.prevent_deleting_used_field()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.observations where schema_field_id = old.id)
     or exists (select 1 from public.field_reviews where schema_field_id = old.id)
     or exists (select 1 from public.evidence where schema_field_id = old.id)
     or exists (select 1 from public.fact_values where schema_field_id = old.id) then
    raise exception 'Criterion "%" has screening results — duplicate the template to change its structure', old.name
      using errcode = 'restrict_violation';
  end if;
  return old;
end;
$$;

-- Copies carry the key facts definition along.
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
      gap_description, display_order, is_dealbreaker, output_schema, created_by
    )
    select v_new_category_id, f.semantic_id, f.name, f.is_required, f.weight, f.extraction_description,
           f.gap_description, f.display_order, f.is_dealbreaker, f.output_schema, (select auth.uid())
    from public.schema_field f
    where f.category_id = v_category.id;
  end loop;

  return v_new_template_id;
end;
$$;

revoke execute on function private.check_fact_value(), private.log_fact_value(), private.prevent_deleting_used_field()
  from public, anon, authenticated;
revoke execute on function public.duplicate_template(bigint, text) from public, anon;
grant execute on function public.duplicate_template(bigint, text) to authenticated;
