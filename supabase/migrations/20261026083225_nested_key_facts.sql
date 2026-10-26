-- Key facts can be objects and lists (nested up to three levels). Values are validated
-- against the property's JSON Schema with pg_jsonschema, which ignores our x-* annotations.

create extension if not exists pg_jsonschema with schema extensions;

create or replace function private.check_fact_value()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_property jsonb;
  v_type text;
  v_json_type text;
  v_label text;
begin
  select f.output_schema -> 'properties' -> new.property_key into v_property
  from public.schema_field f
  where f.id = new.schema_field_id;

  if v_property is null then
    raise exception 'Unknown key fact "%" for this criterion', new.property_key using errcode = 'check_violation';
  end if;

  -- Specific messages for the common cases; the schema check below covers everything else,
  -- including nested objects and lists.
  v_type := v_property ->> 'type';
  v_json_type := v_type;
  v_label := v_type;
  if v_type = 'integer' then
    v_json_type := 'number';
  elsif v_type = 'array' then
    v_label := 'list';
  elsif v_type = 'string' then
    v_label := 'text';
  end if;

  if v_type in ('number', 'integer', 'boolean', 'string', 'object', 'array')
     and jsonb_typeof(new.value) <> v_json_type then
    raise exception 'Key fact "%" must be a %', new.property_key, v_label using errcode = 'check_violation';
  end if;

  if v_property ->> 'format' = 'date' and (new.value #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Key fact "%" must be a date (YYYY-MM-DD)', new.property_key using errcode = 'check_violation';
  end if;

  if not extensions.jsonb_matches_schema(v_property::json, new.value) then
    raise exception 'Key fact "%" doesn''t match its definition', new.property_key using errcode = 'check_violation';
  end if;

  if new.source = 'reviewer' then
    new.set_by := (select auth.uid());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.check_fact_value() from public, anon, authenticated;
