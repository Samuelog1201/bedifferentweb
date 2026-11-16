-- Keep unpublished product photography private and allow signed reads only for
-- published products or the explicitly authorized administrator.
update storage.buckets
set public = false,
    file_size_limit = 8388608,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'be-different-products';

drop policy if exists product_media_public_read on storage.objects;
drop policy if exists product_media_published_read on storage.objects;
create policy product_media_published_read on storage.objects
  for select to anon
  using (
    bucket_id = 'be-different-products'
    and exists (
      select 1
      from public.product_images as image
      join public.products as product on product.id = image.product_id
      where image.storage_path = storage.objects.name
        and product.publication_status = 'published'
    )
  );

drop policy if exists product_media_authenticated_read on storage.objects;
create policy product_media_authenticated_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'be-different-products'
    and (
      (select private.is_admin())
      or exists (
        select 1
        from public.product_images as image
        join public.products as product on product.id = image.product_id
        where image.storage_path = storage.objects.name
          and product.publication_status = 'published'
      )
    )
  );

-- This pre-existing event-trigger function is not an RPC endpoint. Preserve the
-- trigger while removing its unnecessary default API execution grants.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
