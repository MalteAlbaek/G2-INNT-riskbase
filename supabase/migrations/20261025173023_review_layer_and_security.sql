-- Review layer for human-in-the-loop due diligence + security hardening.
--
-- 1. Storage buckets (exist remotely; declared here so local matches)
-- 2. Private RLS helpers (security definer, not exposed through the Data API)
-- 3. Replace legacy policies and SECURITY DEFINER RPCs from the old frontend
-- 4. Review layer: screening status, document metadata, AI results view,
--    field reviews, append-only review events, evidence, prospect assessments
-- 5. Triggers that guarantee the audit trail and the assessment rules
-- 6. Indexes on foreign keys and policy columns

-- ─── 1. Storage buckets ──────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('project_documents', 'project_documents', false), ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- ─── 2. Private helpers ──────────────────────────────────────────────────────

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select org_id from public.org_user where user_id = (select auth.uid());
$$;

create or replace function private.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.org_user where org_id = p_org_id and user_id = (select auth.uid())
  );
$$;

create or replace function private.shares_org_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.org_user mine
    join public.org_user theirs on theirs.org_id = mine.org_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
  );
$$;

create or replace function private.can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.org_user ou on ou.org_id = p.org_id
    where p.id = p_project_id and ou.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_access_screening(p_screening_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.screenings s
    join public.projects p on p.id = s.project_id
    join public.org_user ou on ou.org_id = p.org_id
    where s.id = p_screening_id and ou.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_access_template(p_template_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.schema_templates t
    join public.org_user ou on ou.org_id = t.org_id
    where t.id = p_template_id and ou.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_access_category(p_category_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.schema_categories c
    join public.schema_templates t on t.id = c.template_id
    join public.org_user ou on ou.org_id = t.org_id
    where c.id = p_category_id and ou.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_access_document(p_document_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.documents d
    join public.org_user ou on ou.org_id = d.org_id
    where d.id = p_document_id and ou.user_id = (select auth.uid())
  );
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- ─── 3. Replace legacy policies and RPCs ─────────────────────────────────────

drop policy if exists "users can only create documents in their organisations" on public.documents;
drop policy if exists "users can only see documents in their organisations" on public.documents;
drop policy if exists "users can delete observations in their screenings" on public.observations;
drop policy if exists "users can insert observations in their screenings" on public.observations;
drop policy if exists "users can only see observations in their screenings" on public.observations;
drop policy if exists "users can update observations in their screenings" on public.observations;
drop policy if exists "users can only see members of their organisations" on public.org_user;
drop policy if exists "users can only see their own organisations" on public.organisations;
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "users can only see their own profile" on public.profiles;
drop policy if exists "users can only update their own profile" on public.profiles;
drop policy if exists "users can only create projects in their organisations" on public.projects;
drop policy if exists "users can only delete projects in their organisations" on public.projects;
drop policy if exists "users can only see projects in their organisations" on public.projects;
drop policy if exists "users can only update projects in their organisations" on public.projects;
drop policy if exists "Users can view categories of their org templates" on public.schema_categories;
drop policy if exists "users can only insert schema templates in their organisations" on public.schema_templates;
drop policy if exists "users can only see templates in their organisations" on public.schema_templates;
drop policy if exists "users can only see screenings in their projects" on public.screenings;
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Users can read their org files 19fqqs2_0" on storage.objects;
drop policy if exists "Users can upload to their org 19fqqs2_0" on storage.objects;

-- SECURITY DEFINER wrappers from the old frontend: they bypassed RLS and were callable
-- without signing in. Plain table access under RLS replaces them.
drop function if exists public.create_project(uuid, text);
drop function if exists public.create_schema_category(text, bigint, text, numeric);
drop function if exists public.create_schema_field(bigint, text, text, boolean, numeric, text, text, double precision, boolean);
drop function if exists public.create_screening(uuid, bigint, bigint[]);
drop function if exists public.get_active_org_id();
drop function if exists public.get_current_user_org();
drop function if exists public.get_org_dashboard_overview(uuid);
drop function if exists public.get_org_schema_templates(uuid);
drop function if exists public.get_organisation_screenings(uuid);
drop function if exists public.get_profile(uuid);
drop function if exists public.get_project_details(uuid);
drop function if exists public.get_project_documents(uuid);
drop function if exists public.get_projects(uuid);
drop function if exists public.get_schema_categories(bigint);
drop function if exists public.get_schema_template(bigint);
drop function if exists public.get_screening_details(bigint);
drop function if exists public.get_user_org_ids();

-- The new-user trigger stays, but is not an API endpoint. Also records the email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url', new.email);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Organisations and memberships: readable by members; managed by admins via the dashboard for now.
create policy "members read their organisations" on public.organisations
  for select to authenticated using (id in (select private.user_org_ids()));

create policy "members read memberships of their organisations" on public.org_user
  for select to authenticated using (org_id in (select private.user_org_ids()));

-- Profiles: your own, and those of people you share an organisation with.
create policy "read own and co-member profiles" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or private.shares_org_with(id));
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Projects
create policy "members read projects" on public.projects
  for select to authenticated using (org_id in (select private.user_org_ids()));
create policy "members create projects" on public.projects
  for insert to authenticated with check (org_id in (select private.user_org_ids()));
create policy "members update projects" on public.projects
  for update to authenticated
  using (org_id in (select private.user_org_ids()))
  with check (org_id in (select private.user_org_ids()));
create policy "members delete projects" on public.projects
  for delete to authenticated using (org_id in (select private.user_org_ids()));

-- Documents (the data room). A document's project must belong to the same organisation.
create policy "members read documents" on public.documents
  for select to authenticated using (org_id in (select private.user_org_ids()));
create policy "members add documents" on public.documents
  for insert to authenticated
  with check (
    org_id in (select private.user_org_ids())
    and (project_id is null or private.can_access_project(project_id))
  );
create policy "members update documents" on public.documents
  for update to authenticated
  using (org_id in (select private.user_org_ids()))
  with check (
    org_id in (select private.user_org_ids())
    and (project_id is null or private.can_access_project(project_id))
  );
create policy "members delete documents" on public.documents
  for delete to authenticated using (org_id in (select private.user_org_ids()));

-- Parsing jobs are written by the backend (service role); members can follow progress.
create policy "members read parsing jobs" on public.document_parsing_jobs
  for select to authenticated using (private.can_access_document(document_id));

-- Templates, categories, fields
create policy "members read templates" on public.schema_templates
  for select to authenticated using (org_id in (select private.user_org_ids()));
create policy "members create templates" on public.schema_templates
  for insert to authenticated with check (org_id in (select private.user_org_ids()));
create policy "members update templates" on public.schema_templates
  for update to authenticated
  using (org_id in (select private.user_org_ids()))
  with check (org_id in (select private.user_org_ids()));
create policy "members delete templates" on public.schema_templates
  for delete to authenticated using (org_id in (select private.user_org_ids()));

create policy "members read categories" on public.schema_categories
  for select to authenticated using (private.can_access_template(template_id));
create policy "members create categories" on public.schema_categories
  for insert to authenticated with check (private.can_access_template(template_id));
create policy "members update categories" on public.schema_categories
  for update to authenticated
  using (private.can_access_template(template_id))
  with check (private.can_access_template(template_id));
create policy "members delete categories" on public.schema_categories
  for delete to authenticated using (private.can_access_template(template_id));

create policy "members read fields" on public.schema_field
  for select to authenticated using (private.can_access_category(category_id));
create policy "members create fields" on public.schema_field
  for insert to authenticated with check (private.can_access_category(category_id));
create policy "members update fields" on public.schema_field
  for update to authenticated
  using (private.can_access_category(category_id))
  with check (private.can_access_category(category_id));
create policy "members delete fields" on public.schema_field
  for delete to authenticated using (private.can_access_category(category_id));

-- Screenings and the documents they cover
create policy "members read screenings" on public.screenings
  for select to authenticated using (private.can_access_project(project_id));
create policy "members create screenings" on public.screenings
  for insert to authenticated with check (private.can_access_project(project_id));
create policy "members update screenings" on public.screenings
  for update to authenticated
  using (private.can_access_project(project_id))
  with check (private.can_access_project(project_id));
create policy "members delete screenings" on public.screenings
  for delete to authenticated using (private.can_access_project(project_id));

create policy "members read screening documents" on public.screening_documents
  for select to authenticated using (private.can_access_screening(screening_id));
create policy "members link screening documents" on public.screening_documents
  for insert to authenticated
  with check (private.can_access_screening(screening_id) and private.can_access_document(document_id));
create policy "members unlink screening documents" on public.screening_documents
  for delete to authenticated using (private.can_access_screening(screening_id));

-- Observations are AI output: readable by members, written only by the backend (service role),
-- so the AI's original proposal can't be edited after the fact. Human judgement lives in
-- field_reviews.
create policy "members read observations" on public.observations
  for select to authenticated using (private.can_access_screening(screening_id));

-- Storage: project documents live under <org_id>/... in the private bucket.
create policy "members read org documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'project_documents' and (storage.foldername(name))[1] in (select org_id::text from private.user_org_ids() as org_id));
create policy "members upload org documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project_documents' and (storage.foldername(name))[1] in (select org_id::text from private.user_org_ids() as org_id));
create policy "members update org documents" on storage.objects
  for update to authenticated
  using (bucket_id = 'project_documents' and (storage.foldername(name))[1] in (select org_id::text from private.user_org_ids() as org_id))
  with check (bucket_id = 'project_documents' and (storage.foldername(name))[1] in (select org_id::text from private.user_org_ids() as org_id));
create policy "members delete org documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project_documents' and (storage.foldername(name))[1] in (select org_id::text from private.user_org_ids() as org_id));

-- Avatars: anyone signed in can view; users manage files in their own <user_id>/ folder.
create policy "signed-in users read avatars" on storage.objects
  for select to authenticated using (bucket_id = 'avatars');
create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ─── 4. Review layer ─────────────────────────────────────────────────────────

create type public.screening_status as enum ('draft', 'in_progress', 'review', 'completed');
alter table public.screenings add column status public.screening_status not null default 'draft';
update public.screenings
set status = case when ended_at is not null then 'completed'::public.screening_status else 'in_progress'::public.screening_status end;

alter table public.documents
  add column description text,
  add column page_count integer check (page_count > 0);

-- One AI proposal per criterion, consolidated from the observations behind it.
create view public.screening_field_results
with (security_invoker = true) as
select
  o.screening_id,
  o.schema_field_id,
  bool_and(coalesce(o.is_gap, false)) as is_gap,
  round(avg(o.score_impact) filter (where not coalesce(o.is_gap, false)))::smallint as ai_score,
  round(avg(o.confidence) filter (where not coalesce(o.is_gap, false)), 2) as confidence,
  string_agg(o.observation_description, ' ' order by o.confidence desc nulls last)
    filter (where not coalesce(o.is_gap, false)) as finding,
  string_agg(o.gap_description, ' ') filter (where coalesce(o.is_gap, false)) as gap_note,
  count(*)::integer as observation_count
from public.observations o
where o.screening_id is not null and o.schema_field_id is not null
group by o.screening_id, o.schema_field_id;

create type public.review_status as enum ('accepted', 'overridden', 'follow_up');

create table public.field_reviews (
  screening_id bigint not null references public.screenings (id) on delete cascade,
  schema_field_id bigint not null references public.schema_field (id) on delete cascade,
  status public.review_status not null,
  score smallint not null check (score between -2 and 2),
  -- The AI proposal the reviewer saw, kept for the audit trail.
  ai_score smallint check (ai_score between -2 and 2),
  rationale text not null default '',
  reviewed_by uuid default auth.uid() references auth.users (id) on delete set null,
  reviewed_at timestamptz not null default now(),
  primary key (screening_id, schema_field_id),
  constraint rationale_required check (status = 'accepted' or length(btrim(rationale)) > 0),
  constraint override_changes_score check (status <> 'overridden' or ai_score is null or score <> ai_score)
);

create type public.review_event_type as enum ('accepted', 'overridden', 'follow_up', 'reopened', 'evidence_added');

-- Append-only audit trail, written by triggers only.
create table public.field_review_events (
  id bigint generated always as identity primary key,
  screening_id bigint not null references public.screenings (id) on delete cascade,
  schema_field_id bigint not null references public.schema_field (id) on delete cascade,
  type public.review_event_type not null,
  actor uuid references auth.users (id) on delete set null,
  from_score smallint,
  to_score smallint,
  text text,
  created_at timestamptz not null default now()
);

-- A passage in a document that supports a criterion. added_by null = cited by the AI.
create table public.evidence (
  id bigint generated always as identity primary key,
  screening_id bigint not null references public.screenings (id) on delete cascade,
  schema_field_id bigint not null references public.schema_field (id) on delete cascade,
  observation_id bigint references public.observations (id) on delete cascade,
  document_id bigint references public.documents (id) on delete set null,
  page integer check (page > 0),
  quote text,
  -- Free-text locator when no exact passage is known, e.g. "Lokalplan bilag A, s. 7".
  reference text,
  added_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint evidence_points_somewhere check (document_id is not null or reference is not null)
);

-- Carry the AI's existing free-text source references over as evidence.
insert into public.evidence (screening_id, schema_field_id, observation_id, document_id, page, reference, added_by)
select
  o.screening_id,
  o.schema_field_id,
  o.id,
  o.document_id,
  nullif(substring(o.source_reference from 's\.\s*(\d+)'), '')::integer,
  o.source_reference,
  null
from public.observations o
where o.screening_id is not null
  and o.schema_field_id is not null
  and not coalesce(o.is_gap, false)
  and (o.document_id is not null or o.source_reference is not null);

create type public.recommendation as enum ('go', 'hold', 'no_go');
create type public.assessment_status as enum ('draft', 'final');

create table public.screening_assessments (
  screening_id bigint primary key references public.screenings (id) on delete cascade,
  status public.assessment_status not null default 'draft',
  conclusion text not null default '',
  recommendation public.recommendation,
  author uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.field_reviews enable row level security;
alter table public.field_review_events enable row level security;
alter table public.evidence enable row level security;
alter table public.screening_assessments enable row level security;

revoke all on public.field_reviews, public.field_review_events, public.evidence, public.screening_assessments from anon;
revoke all on public.screening_field_results from anon;

create policy "members read reviews" on public.field_reviews
  for select to authenticated using (private.can_access_screening(screening_id));
create policy "members review" on public.field_reviews
  for insert to authenticated with check (private.can_access_screening(screening_id));
create policy "members revise reviews" on public.field_reviews
  for update to authenticated
  using (private.can_access_screening(screening_id))
  with check (private.can_access_screening(screening_id));
create policy "members reopen reviews" on public.field_reviews
  for delete to authenticated using (private.can_access_screening(screening_id));

create policy "members read review history" on public.field_review_events
  for select to authenticated using (private.can_access_screening(screening_id));

create policy "members read evidence" on public.evidence
  for select to authenticated using (private.can_access_screening(screening_id));
create policy "members cite evidence" on public.evidence
  for insert to authenticated
  with check (
    private.can_access_screening(screening_id)
    and added_by = (select auth.uid())
    and observation_id is null
    and (document_id is null or private.can_access_document(document_id))
  );
create policy "members remove their own evidence" on public.evidence
  for delete to authenticated
  using (private.can_access_screening(screening_id) and added_by = (select auth.uid()));

create policy "members read assessments" on public.screening_assessments
  for select to authenticated using (private.can_access_screening(screening_id));
create policy "members write assessments" on public.screening_assessments
  for insert to authenticated with check (private.can_access_screening(screening_id));
create policy "members revise assessments" on public.screening_assessments
  for update to authenticated
  using (private.can_access_screening(screening_id))
  with check (private.can_access_screening(screening_id));

-- ─── 5. Triggers ─────────────────────────────────────────────────────────────

-- Stamp who reviewed and when; the client can't claim to be someone else.
create or replace function private.stamp_field_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.reviewed_by := (select auth.uid());
  new.reviewed_at := now();
  return new;
end;
$$;

create trigger stamp_field_review
  before insert or update on public.field_reviews
  for each row execute function private.stamp_field_review();

-- Every review change lands in the audit trail. Security definer because users have no
-- insert rights on field_review_events — only this trigger writes there.
create or replace function private.log_field_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.field_review_events (screening_id, schema_field_id, type, actor, from_score)
    values (old.screening_id, old.schema_field_id, 'reopened', (select auth.uid()), old.score);
    return old;
  end if;

  insert into public.field_review_events (screening_id, schema_field_id, type, actor, from_score, to_score, text)
  values (
    new.screening_id,
    new.schema_field_id,
    new.status::text::public.review_event_type,
    new.reviewed_by,
    case when new.status = 'overridden' then new.ai_score end,
    case when new.status = 'overridden' then new.score end,
    nullif(btrim(new.rationale), '')
  );
  return new;
end;
$$;

create trigger log_field_review
  after insert or update or delete on public.field_reviews
  for each row execute function private.log_field_review();

create or replace function private.log_evidence_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.added_by is not null then
    insert into public.field_review_events (screening_id, schema_field_id, type, actor, text)
    values (new.screening_id, new.schema_field_id, 'evidence_added', new.added_by, new.quote);
  end if;
  return new;
end;
$$;

create trigger log_evidence_added
  after insert on public.evidence
  for each row execute function private.log_evidence_added();

-- A final assessment needs a conclusion and a recommendation. A firm recommendation
-- (go / no-go) also needs every assessed criterion reviewed, with no open follow-ups.
create or replace function private.check_assessment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_unreviewed integer;
begin
  new.author := (select auth.uid());
  new.updated_at := now();

  if new.status = 'final' then
    if length(btrim(new.conclusion)) = 0 or new.recommendation is null then
      raise exception 'A final assessment needs a conclusion and a recommendation'
        using errcode = 'check_violation';
    end if;

    if new.recommendation in ('go', 'no_go') then
      select count(*) into v_unreviewed
      from public.screening_field_results r
      left join public.field_reviews fr
        on fr.screening_id = r.screening_id and fr.schema_field_id = r.schema_field_id
      where r.screening_id = new.screening_id
        and (fr.status is null or fr.status = 'follow_up');

      if v_unreviewed > 0 then
        raise exception '% criteria are not reviewed yet — finish the review or recommend hold', v_unreviewed
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger check_assessment
  before insert or update on public.screening_assessments
  for each row execute function private.check_assessment();

revoke execute on all functions in schema private from public, anon;
grant execute on function
  private.user_org_ids(),
  private.is_org_member(uuid),
  private.shares_org_with(uuid),
  private.can_access_project(uuid),
  private.can_access_screening(bigint),
  private.can_access_template(bigint),
  private.can_access_category(bigint),
  private.can_access_document(bigint)
to authenticated;

-- ─── 6. Indexes ──────────────────────────────────────────────────────────────

create index if not exists projects_org_id_idx on public.projects (org_id);
create index if not exists documents_org_id_idx on public.documents (org_id);
create index if not exists documents_project_id_idx on public.documents (project_id);
create index if not exists document_parsing_jobs_document_id_idx on public.document_parsing_jobs (document_id);
create index if not exists schema_templates_org_id_idx on public.schema_templates (org_id);
create index if not exists schema_categories_template_id_idx on public.schema_categories (template_id);
create index if not exists schema_field_category_id_idx on public.schema_field (category_id);
create index if not exists screenings_project_id_idx on public.screenings (project_id);
create index if not exists screenings_schema_template_id_idx on public.screenings (schema_template_id);
create index if not exists screening_documents_document_id_idx on public.screening_documents (document_id);
create index if not exists observations_cell_idx on public.observations (screening_id, schema_field_id);
create index if not exists observations_document_id_idx on public.observations (document_id);
create index if not exists field_reviews_schema_field_id_idx on public.field_reviews (schema_field_id);
create index if not exists field_review_events_cell_idx on public.field_review_events (screening_id, schema_field_id, created_at);
create index if not exists evidence_cell_idx on public.evidence (screening_id, schema_field_id);
create index if not exists evidence_document_id_idx on public.evidence (document_id);
create index if not exists evidence_observation_id_idx on public.evidence (observation_id);
create index if not exists observations_schema_field_id_idx on public.observations (schema_field_id);
create index if not exists evidence_schema_field_id_idx on public.evidence (schema_field_id);
create index if not exists field_review_events_schema_field_id_idx on public.field_review_events (schema_field_id);
