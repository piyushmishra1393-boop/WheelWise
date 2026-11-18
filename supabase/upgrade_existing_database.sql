-- WheelWise additive upgrade. Run this in Supabase SQL Editor.
-- Does NOT drop or replace existing tables or rows.
create extension if not exists pgcrypto;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  description text,
  status text not null default 'active' check (status in ('active','inactive')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles add column if not exists brand_id uuid references public.brands(id) on delete set null;
alter table public.articles add column if not exists brand text;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text not null,
  youtube_id text not null,
  description text,
  category text not null default 'reviews',
  brand_id uuid references public.brands(id) on delete set null,
  brand_name text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  vehicle_type text not null default 'car' check (vehicle_type in ('car','bike')),
  link_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active','unsubscribed')),
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create index if not exists articles_brand_id_idx on public.articles(brand_id);
create index if not exists videos_status_category_idx on public.videos(status, category);
create index if not exists videos_brand_id_idx on public.videos(brand_id);
create index if not exists slides_status_order_idx on public.homepage_slides(status, display_order);

alter table public.brands enable row level security;
alter table public.videos enable row level security;
alter table public.homepage_slides enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;

-- Public can read only active brands, published videos and active slides.
drop policy if exists "Public can read active brands" on public.brands;
create policy "Public can read active brands" on public.brands for select to anon, authenticated using (status = 'active');
drop policy if exists "WheelWise admin manages brands" on public.brands;
create policy "WheelWise admin manages brands" on public.brands for all to authenticated using (public.is_wheelwise_admin()) with check (public.is_wheelwise_admin());

drop policy if exists "Public can read published videos" on public.videos;
create policy "Public can read published videos" on public.videos for select to anon, authenticated using (status = 'published');
drop policy if exists "WheelWise admin manages videos" on public.videos;
create policy "WheelWise admin manages videos" on public.videos for all to authenticated using (public.is_wheelwise_admin()) with check (public.is_wheelwise_admin());

drop policy if exists "Public can read active slides" on public.homepage_slides;
create policy "Public can read active slides" on public.homepage_slides for select to anon, authenticated using (status = 'active');
drop policy if exists "WheelWise admin manages slides" on public.homepage_slides;
create policy "WheelWise admin manages slides" on public.homepage_slides for all to authenticated using (public.is_wheelwise_admin()) with check (public.is_wheelwise_admin());

-- Visitors may subscribe, but cannot read subscriber lists. Duplicate emails are ignored by the UI's message handler.
drop policy if exists "Visitors can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Visitors can subscribe to newsletter" on public.newsletter_subscribers for insert to anon, authenticated with check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and status = 'active');
drop policy if exists "WheelWise admin reads subscribers" on public.newsletter_subscribers;
create policy "WheelWise admin reads subscribers" on public.newsletter_subscribers for select to authenticated using (public.is_wheelwise_admin());
drop policy if exists "WheelWise admin updates subscribers" on public.newsletter_subscribers;
create policy "WheelWise admin updates subscribers" on public.newsletter_subscribers for update to authenticated using (public.is_wheelwise_admin()) with check (public.is_wheelwise_admin());
drop policy if exists "WheelWise admin deletes subscribers" on public.newsletter_subscribers;
create policy "WheelWise admin deletes subscribers" on public.newsletter_subscribers for delete to authenticated using (public.is_wheelwise_admin());

-- Public can send a contact message; only admin can read/manage it.
drop policy if exists "Visitors can send contact messages" on public.contact_messages;
create policy "Visitors can send contact messages" on public.contact_messages for insert to anon, authenticated with check (length(trim(name)) between 1 and 100 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and length(trim(message)) between 5 and 5000);
drop policy if exists "WheelWise admin manages contact messages" on public.contact_messages;
create policy "WheelWise admin manages contact messages" on public.contact_messages for all to authenticated using (public.is_wheelwise_admin()) with check (public.is_wheelwise_admin());
