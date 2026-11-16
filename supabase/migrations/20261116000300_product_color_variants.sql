-- Add per-color variants while retaining product-level images/sizes as the
-- backwards-compatible default for existing catalog records.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  color_hex text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, name)
);
create index product_variants_product_order_idx
  on public.product_variants (product_id, sort_order, id);

create table public.product_variant_sizes (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  is_available boolean not null default true,
  inventory_count integer check (inventory_count is null or inventory_count >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  unique (variant_id, size)
);
create index product_variant_sizes_variant_order_idx
  on public.product_variant_sizes (variant_id, sort_order, size);

create table public.product_variant_images (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_variant_images_variant_order_idx
  on public.product_variant_images (variant_id, sort_order, id);
create unique index product_variant_images_one_primary_idx
  on public.product_variant_images (variant_id) where is_primary;

alter table public.product_variants enable row level security;
alter table public.product_variant_sizes enable row level security;
alter table public.product_variant_images enable row level security;

revoke all on public.product_variants, public.product_variant_sizes, public.product_variant_images from public, anon, authenticated;
grant select on public.product_variants, public.product_variant_sizes, public.product_variant_images to anon, authenticated;
grant insert, update, delete on public.product_variants, public.product_variant_sizes, public.product_variant_images to authenticated;

create policy product_variants_public_read on public.product_variants
  for select to anon, authenticated using (exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.publication_status = 'published'
  ));
create policy product_variants_admin_read on public.product_variants
  for select to authenticated using ((select private.is_admin()));
create policy product_variants_admin_insert on public.product_variants
  for insert to authenticated with check ((select private.is_admin()));
create policy product_variants_admin_update on public.product_variants
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_variants_admin_delete on public.product_variants
  for delete to authenticated using ((select private.is_admin()));

create policy product_variant_sizes_public_read on public.product_variant_sizes
  for select to anon, authenticated using (exists (
    select 1 from public.product_variants
    join public.products on products.id = product_variants.product_id
    where product_variants.id = product_variant_sizes.variant_id
      and products.publication_status = 'published'
  ));
create policy product_variant_sizes_admin_read on public.product_variant_sizes
  for select to authenticated using ((select private.is_admin()));
create policy product_variant_sizes_admin_insert on public.product_variant_sizes
  for insert to authenticated with check ((select private.is_admin()));
create policy product_variant_sizes_admin_update on public.product_variant_sizes
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_variant_sizes_admin_delete on public.product_variant_sizes
  for delete to authenticated using ((select private.is_admin()));

create policy product_variant_images_public_read on public.product_variant_images
  for select to anon, authenticated using (exists (
    select 1 from public.product_variants
    join public.products on products.id = product_variants.product_id
    where product_variants.id = product_variant_images.variant_id
      and products.publication_status = 'published'
  ));
create policy product_variant_images_admin_read on public.product_variant_images
  for select to authenticated using ((select private.is_admin()));
create policy product_variant_images_admin_insert on public.product_variant_images
  for insert to authenticated with check ((select private.is_admin()));
create policy product_variant_images_admin_update on public.product_variant_images
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_variant_images_admin_delete on public.product_variant_images
  for delete to authenticated using ((select private.is_admin()));

-- Signed media reads must resolve paths from either gallery table.
drop policy if exists product_media_published_read on storage.objects;
create policy product_media_published_read on storage.objects
  for select to anon using (
    bucket_id = 'be-different-products'
    and (
      exists (
        select 1 from public.product_images as image
        join public.products as product on product.id = image.product_id
        where image.storage_path = storage.objects.name
          and product.publication_status = 'published'
      )
      or exists (
        select 1 from public.product_variant_images as image
        join public.product_variants as variant on variant.id = image.variant_id
        join public.products as product on product.id = variant.product_id
        where image.storage_path = storage.objects.name
          and product.publication_status = 'published'
      )
    )
  );

drop policy if exists product_media_authenticated_read on storage.objects;
create policy product_media_authenticated_read on storage.objects
  for select to authenticated using (
    bucket_id = 'be-different-products'
    and (
      (select private.is_admin())
      or exists (
        select 1 from public.product_images as image
        join public.products as product on product.id = image.product_id
        where image.storage_path = storage.objects.name
          and product.publication_status = 'published'
      )
      or exists (
        select 1 from public.product_variant_images as image
        join public.product_variants as variant on variant.id = image.variant_id
        join public.products as product on product.id = variant.product_id
        where image.storage_path = storage.objects.name
          and product.publication_status = 'published'
      )
    )
  );
