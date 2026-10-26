-- A reviewer can assess a criterion the AI didn't: status "manual". It keeps the audit
-- trail honest — the score was entered by a person with no AI proposal behind it — and,
-- like an override, it needs a rationale (field_reviews.rationale_required).

alter type public.review_status add value if not exists 'manual';
alter type public.review_event_type add value if not exists 'manual';
