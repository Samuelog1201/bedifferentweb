-- Keep one SELECT policy per exposed role/action while preserving public and admin visibility.
drop policy if exists products_public_read on public.products;
drop policy if exists products_admin_read on public.products;
create policy products_public_read on public.products
  for select to anon using (publication_status = 'published');
create policy products_authenticated_read on public.products
  for select to authenticated
  using (publication_status = 'published' or (select private.is_admin()));

drop policy if exists product_images_public_read on public.product_images;
drop policy if exists product_images_admin_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select to anon
  using (exists (
    select 1 from public.products
    where products.id = product_images.product_id and products.publication_status = 'published'
  ));
create policy product_images_authenticated_read on public.product_images
  for select to authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.products
      where products.id = product_images.product_id and products.publication_status = 'published'
    )
  );

drop policy if exists product_sizes_public_read on public.product_sizes;
drop policy if exists product_sizes_admin_read on public.product_sizes;
create policy product_sizes_public_read on public.product_sizes
  for select to anon
  using (exists (
    select 1 from public.products
    where products.id = product_sizes.product_id and products.publication_status = 'published'
  ));
create policy product_sizes_authenticated_read on public.product_sizes
  for select to authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.products
      where products.id = product_sizes.product_id and products.publication_status = 'published'
    )
  );
