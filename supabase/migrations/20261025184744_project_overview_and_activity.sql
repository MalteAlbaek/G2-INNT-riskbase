-- Projects: list overview, comments and a derived activity feed.

-- ─── Comments ────────────────────────────────────────────────────────────────

create table public.project_comments (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  author uuid default auth.uid() references auth.users (id) on delete set null,
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index project_comments_project_id_idx on public.project_comments (project_id, created_at);
create index project_comments_author_idx on public.project_comments (author);

alter table public.project_comments enable row level security;
revoke all on public.project_comments from anon;

create policy "members read comments" on public.project_comments
  for select to authenticated using (private.can_access_project(project_id));
create policy "members comment as themselves" on public.project_comments
  for insert to authenticated
  with check (private.can_access_project(project_id) and author = (select auth.uid()));
create policy "authors delete their comments" on public.project_comments
  for delete to authenticated
  using (private.can_access_project(project_id) and author = (select auth.uid()));

-- ─── Project overview ────────────────────────────────────────────────────────

create view public.project_overview
with (security_invoker = true) as
select
  p.id,
  p.org_id,
  p.name,
  p.status,
  p.created_at,
  (select count(*) from public.documents d where d.project_id = p.id)::integer as document_count,
  (select count(*) from public.screenings s where s.project_id = p.id)::integer as screening_count,
  (select max(coalesce(s.ended_at, s.started_at, s.created_at)) from public.screenings s where s.project_id = p.id)
    as last_screened_at
from public.projects p;

revoke all on public.project_overview from anon;

-- ─── Activity feed ───────────────────────────────────────────────────────────
-- Derived from the records themselves, so the feed can never disagree with the data.

create view public.project_activity
with (security_invoker = true) as
select p.id as project_id, 'project-' || p.id as id, 'created' as type, p.created_by as actor,
       p.created_at, null::text as subject, null::text as body
from public.projects p
union all
select d.project_id, 'document-' || d.id, 'upload', d.uploaded_by, d.created_at, d.file_name, null
from public.documents d
where d.project_id is not null
union all
select s.project_id, 'screening-' || s.id, 'screening', s.created_by, s.created_at, t.name, null
from public.screenings s
left join public.schema_templates t on t.id = s.schema_template_id
union all
select s.project_id, 'assessment-' || a.screening_id, 'assessment', a.author, a.updated_at,
       a.recommendation::text, a.conclusion
from public.screening_assessments a
join public.screenings s on s.id = a.screening_id
where a.status = 'final'
union all
select c.project_id, 'comment-' || c.id, 'comment', c.author, c.created_at, null, c.body
from public.project_comments c;

revoke all on public.project_activity from anon;
