-- Product tags are short editorial labels shown on catalog cards and details.
alter table public.products
  add column if not exists tags text[] not null default '{}';

alter table public.products
  add constraint products_tags_limit check (cardinality(tags) <= 8);
