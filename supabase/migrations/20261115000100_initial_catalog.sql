-- BeDifferent initial catalog and administrator authorization.
-- Additive migration; the connected project was inspected and has no app tables.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists private.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table private.admin_allowlist enable row level security;
revoke all on private.admin_allowlist from public, anon, authenticated;

insert into private.admin_allowlist (email)
values ('samuelortizguevara@gmail.com')
on conflict (email) do nothing;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_allowlist as allowed
    where allowed.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 1 and 120),
  summary text not null default '' check (length(summary) <= 240),
  description text not null default '',
  price_cop bigint not null check (price_cop >= 0),
  compare_at_price_cop bigint check (compare_at_price_cop is null or compare_at_price_cop >= price_cop),
  category text not null default 'oversized' check (category in ('oversized', 'regular-fit')),
  fit text not null default 'oversized' check (fit in ('oversized', 'regular-fit')),
  material text not null default '',
  color text not null default '',
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  commercial_status text not null default 'coming_soon' check (commercial_status in ('preorder', 'available', 'sold_out', 'coming_soon')),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_public_listing_idx
  on public.products (is_featured desc, created_at desc)
  where publication_status = 'published';
create index if not exists products_category_idx
  on public.products (category, created_at desc)
  where publication_status = 'published';

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_order_idx
  on public.product_images (product_id, sort_order, id);
create unique index if not exists product_images_one_primary_idx
  on public.product_images (product_id) where is_primary;

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  is_available boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  unique (product_id, size)
);
create index if not exists product_sizes_product_order_idx
  on public.product_sizes (product_id, sort_order, size);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function private.set_updated_at();

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;

revoke all on public.products, public.product_images, public.product_sizes from public, anon, authenticated;
grant select on public.products, public.product_images, public.product_sizes to anon, authenticated;
grant insert, update, delete on public.products, public.product_images, public.product_sizes to authenticated;

create policy products_public_read on public.products
  for select to anon, authenticated
  using (publication_status = 'published');
create policy products_admin_read on public.products
  for select to authenticated using ((select private.is_admin()));
create policy products_admin_insert on public.products
  for insert to authenticated with check ((select private.is_admin()));
create policy products_admin_update on public.products
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy products_admin_delete on public.products
  for delete to authenticated using ((select private.is_admin()));

create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.publication_status = 'published'
  ));
create policy product_images_admin_read on public.product_images
  for select to authenticated using ((select private.is_admin()));
create policy product_images_admin_insert on public.product_images
  for insert to authenticated with check ((select private.is_admin()));
create policy product_images_admin_update on public.product_images
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy product_images_admin_delete on public.product_images
  for delete to authenticated using ((select private.is_admin()));

create policy product_sizes_public_read on public.product_sizes
  for select to anon, authenticated
  using (exists (
    select 1 from public.products
    where products.id = product_sizes.product_id
      and products.publication_status = 'published'
  ));
create policy product_sizes_admin_read on public.product_sizes
  for select to authenticated using ((select private.is_admin()));
create policy product_sizes_admin_insert on public.product_sizes
  for insert to authenticated with check ((select private.is_admin()));
create policy product_sizes_admin_update on public.product_sizes
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy product_sizes_admin_delete on public.product_sizes
  for delete to authenticated using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('be-different-products', 'be-different-products', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy product_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'be-different-products');
create policy product_media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'be-different-products' and (select private.is_admin()));
create policy product_media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'be-different-products' and (select private.is_admin()))
  with check (bucket_id = 'be-different-products' and (select private.is_admin()));
create policy product_media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'be-different-products' and (select private.is_admin()));
