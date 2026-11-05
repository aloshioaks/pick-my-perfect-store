create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price > 0),
  size text not null,
  image_url text not null,
  featured_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true or auth.uid() is not null);

drop policy if exists "Signed-in admins can add products" on public.products;
create policy "Signed-in admins can add products"
  on public.products for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Signed-in admins can update products" on public.products;
create policy "Signed-in admins can update products"
  on public.products for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Signed-in admins can delete products" on public.products;
create policy "Signed-in admins can delete products"
  on public.products for delete
  to authenticated
  using (auth.uid() is not null);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_products_updated_at();

insert into public.products (
  name, category, description, price, size, image_url, featured_order, is_active
)
select
  sample.name,
  sample.category,
  sample.description,
  70,
  '24 × 16',
  sample.image_url,
  sample.featured_order,
  true
from (
  values
    ('Shiva in Blue Light', 'Hindu & Indian Art', 'A serene portrait of Shiva in cool blue tones, with a quiet, contemplative presence.', '/assets/products/0b603e47-e1cb-4ade-9495-452b4bd8bd23.JPG', 0),
    ('The Cross — Monochrome Study', 'Christian Art', 'A thoughtful charcoal-style portrait of Christ and the cross, rendered in expressive monochrome.', '/assets/products/0fa1417b-b8cd-4579-999f-7144514aeebf.JPG', 1),
    ('Ganesha in Festival Colours', 'Hindu & Indian Art', 'A joyful, richly coloured depiction of Ganesha, full of intricate detail and warmth.', '/assets/products/1a54bff0-4c18-4a46-af69-47bb9cc5711c.JPG', 2),
    ('Sacred Heart in Golden Light', 'Christian Art', 'A luminous devotional portrait surrounded by a soft golden glow and delicate florals.', '/assets/products/1af30d76-0bb1-4f59-ab4f-a19a25eac1dd.JPG', 3),
    ('Ganesha Among the Lotus', 'Hindu & Indian Art', 'A peaceful Ganesha scene framed by lotus blooms and gentle reflections on the water.', '/assets/products/2053c960-8080-4f38-b257-b12789728d0d.JPG', 4),
    ('Buddha — Golden Stillness', 'Buddhist Art', 'A textured portrait of Buddha in warm gold and earth tones, made for a moment of calm.', '/assets/products/24083f11-5867-4e01-9595-570fdcb745b1.JPG', 5),
    ('The Sacred Heart — A Quiet Glow', 'Christian Art', 'A classic devotional portrait presented within a warm, softly illuminated frame.', '/assets/products/2725c955-5b47-478b-83b3-d64066e70902.JPG', 6),
    ('Theyyam — Guardian in Red', 'Kerala Heritage', 'A vivid portrait celebrating the striking colours, costume and presence of Theyyam.', '/assets/products/33d37047-8955-4617-8efe-a63cd1294d74.JPG', 7),
    ('Shiva & Parvati in Divine Grace', 'Hindu & Indian Art', 'A tender, richly detailed depiction of Shiva and Parvati together in a moment of grace.', '/assets/products/3a4fb0a9-c995-44e0-a1e1-868ff0693d25.JPG', 8),
    ('Christ in Quiet Reflection', 'Christian Art', 'A contemplative portrait in deep, natural tones with a gentle, reflective mood.', '/assets/products/5256e573-632a-476e-ae72-e904537a66b8.JPG', 9),
    ('A Moment of Prayer', 'Christian Art', 'A dramatic portrait in rich blue light, capturing a still moment of prayer.', '/assets/products/565936bc-6af5-493f-8d8b-9e5a9ac09bad.JPG', 10),
    ('The Holy Family — Tenderness', 'Christian Art', 'A gentle family portrait in soft blue and warm earth tones, full of tenderness.', '/assets/products/5fb590a9-2e4f-4c52-a1e5-e6cc93c85094.JPG', 11),
    ('Christ — Portrait of Compassion', 'Christian Art', 'A warm, intimate portrait of Christ with an inviting expression and rich painterly tones.', '/assets/products/697e9199-c74f-4579-95b6-57ebb4effd6e.JPG', 12),
    ('Our Lady in Blue and White', 'Christian Art', 'A graceful portrait of Mary in blue and white, surrounded by a soft floral glow.', '/assets/products/6cca9919-7a2c-4912-9947-0264d7a44ac7.JPG', 13),
    ('Walking into the Light', 'Christian Art', 'A serene figure moving through a softly textured landscape toward a bright horizon.', '/assets/products/7b3a72ee-62d8-4a42-8650-c08ae7bc24a8.JPG', 14),
    ('Madonna and Child — A Tender Embrace', 'Christian Art', 'A tender close portrait of Mary and the child Jesus in gentle, golden tones.', '/assets/products/da87ec79-1fde-4939-9bf5-5f2e52f8c311.JPG', 15),
    ('Christ in Radiant Light', 'Christian Art', 'A welcoming devotional image with flowing red robes and a bright, uplifting glow.', '/assets/products/e313d5f9-d371-41ae-b326-100d24059aad.JPG', 16),
    ('The Holy Family — A Sacred Bond', 'Christian Art', 'A richly coloured family scene with a warm, intimate composition.', '/assets/products/f617dc26-1de1-47dd-83ea-b6ccbc590397.JPG', 17),
    ('Shiva & Parvati — Dance of Creation', 'Hindu & Indian Art', 'A dramatic bronze-toned scene of Shiva and Parvati in an expressive celestial dance.', '/assets/products/fcce4987-dce8-4f77-9796-11737529339d.JPG', 18)
) as sample(name, category, description, image_url, featured_order)
where not exists (select 1 from public.products);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Signed-in admins can upload product images" on storage.objects;
create policy "Signed-in admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and auth.uid() is not null);

drop policy if exists "Signed-in admins can update product images" on storage.objects;
create policy "Signed-in admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and auth.uid() is not null)
  with check (bucket_id = 'product-images' and auth.uid() is not null);

drop policy if exists "Signed-in admins can delete product images" on storage.objects;
create policy "Signed-in admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and auth.uid() is not null);
