-- Deleting a project removes everything that belongs to it in one statement.
--
-- A screening's document links and AI observations belong to the screening, so they go
-- with it instead of blocking the delete (links) or being left orphaned (observations).
-- A single document that a screening is built on still can't be deleted on its own; that
-- rule moves from the foreign key to a trigger, so it doesn't block deleting the whole
-- project (by the time the project's documents cascade, the project row is gone).

alter table public.screening_documents
  drop constraint screening_documents_screening_id_fkey,
  add constraint screening_documents_screening_id_fkey
    foreign key (screening_id) references public.screenings (id) on delete cascade,
  drop constraint screening_documents_document_id_fkey,
  add constraint screening_documents_document_id_fkey
    foreign key (document_id) references public.documents (id) on delete cascade;

alter table public.observations
  drop constraint observations_screening_id_fkey,
  add constraint observations_screening_id_fkey
    foreign key (screening_id) references public.screenings (id) on update cascade on delete cascade;

create or replace function private.prevent_deleting_screened_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.screening_documents sd
    join public.screenings s on s.id = sd.screening_id
    join public.projects p on p.id = s.project_id
    where sd.document_id = old.id
  ) then
    raise exception 'This document is part of a screening and can''t be deleted'
      using errcode = 'restrict_violation';
  end if;
  return old;
end;
$$;

create trigger prevent_deleting_screened_document
  before delete on public.documents
  for each row execute function private.prevent_deleting_screened_document();

revoke execute on function private.prevent_deleting_screened_document() from public, anon, authenticated;
