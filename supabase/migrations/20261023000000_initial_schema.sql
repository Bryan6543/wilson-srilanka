-- Wilson Sri Lanka — initial schema
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
--
-- Security model: the website server talks to Supabase with the service-role key (server-only),
-- which bypasses RLS. RLS is still enabled on every table so that the public anon key, if it is
-- ever used, can only read published catalogue data and can never write anything.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  slug        text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 2 and 80),
  sport       text,
  description text not null default '',
  image       text,
  sort_order  integer not null default 100,
  visible     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Products: indexed columns + full document in `data`
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          text primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 2 and 160),
  category    text not null references public.categories (slug) on update cascade on delete restrict,
  published   boolean not null default false,
  featured    boolean not null default false,
  external_id text unique,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_published_category_idx on public.products (published, category);
create index if not exists products_featured_idx on public.products (featured) where featured;
create index if not exists products_updated_at_idx on public.products (updated_at desc);

-- `updated_at` is supplied by the application (it is also stored inside `data`), so no trigger here.

-- ---------------------------------------------------------------------------
-- Site content (key/value JSON)
-- ---------------------------------------------------------------------------
create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Uploaded images log (files themselves live in Storage)
-- ---------------------------------------------------------------------------
create table if not exists public.site_images (
  id           bigint generated always as identity primary key,
  path         text not null unique,
  url          text not null,
  content_type text not null,
  bytes        integer not null check (bytes > 0),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Newsletter subscribers
-- ---------------------------------------------------------------------------
create table if not exists public.subscribers (
  id         bigint generated always as identity primary key,
  email      text not null check (email = lower(email) and char_length(email) <= 200),
  created_at timestamptz not null default now()
);
create unique index if not exists subscribers_email_key on public.subscribers (email);

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window), used by login, contact and newsletter forms
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key      text primary key,
  count    integer not null,
  reset_at timestamptz not null
);
create index if not exists rate_limits_reset_idx on public.rate_limits (reset_at);

create or replace function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as r (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count    = case when r.reset_at < now() then 1 else r.count + 1 end,
        reset_at = case when r.reset_at < now() then now() + make_interval(secs => p_window_seconds) else r.reset_at end
  returning count into v_count;

  -- Opportunistic cleanup of long-expired windows.
  if random() < 0.01 then
    delete from public.rate_limits where reset_at < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security — explicit policies for every table
-- ---------------------------------------------------------------------------
alter table public.categories   enable row level security;
alter table public.products     enable row level security;
alter table public.site_content enable row level security;
alter table public.site_images  enable row level security;
alter table public.subscribers  enable row level security;
alter table public.rate_limits  enable row level security;

-- Public (anon/authenticated) may read only what the public website shows.
create policy "Public can read visible categories"
  on public.categories for select to anon, authenticated
  using (visible);

create policy "Public can read published products"
  on public.products for select to anon, authenticated
  using (published);

create policy "Public can read site content"
  on public.site_content for select to anon, authenticated
  using (true);

-- site_images, subscribers and rate_limits have NO policies for anon/authenticated:
-- with RLS enabled this denies all access. Only the server (service role) can use them.
-- No table has insert/update/delete policies for anon/authenticated: all writes go through
-- the authenticated admin server code using the service role.

-- ---------------------------------------------------------------------------
-- Storage bucket for product images (public read, server-only write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files without a select policy; no insert/update/delete policies are
-- created, so only the service role (website server) can upload or remove images.
