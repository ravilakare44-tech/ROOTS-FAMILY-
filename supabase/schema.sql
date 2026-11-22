-- Roots & Branches — Supabase PostgreSQL Schema
-- Run this script once in your Supabase Dashboard -> SQL Editor.
-- It creates the relational tables used by the Roots & Branches Express backend.

create table if not exists public.rb_users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rb_trees (
  id text primary key,
  owner_id text not null references public.rb_users(id) on delete cascade,
  name text not null,
  description text,
  is_sample boolean not null default false,
  design jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rb_trees_owner on public.rb_trees(owner_id);

create table if not exists public.rb_people (
  id text primary key,
  tree_id text not null references public.rb_trees(id) on delete cascade,
  full_name text not null,
  alternate_name text,
  birth_date text,
  birth_date_precision text not null default 'unknown',
  death_date text,
  death_date_precision text not null default 'unknown',
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rb_people_tree on public.rb_people(tree_id);

create table if not exists public.rb_relationships (
  id text primary key,
  tree_id text not null references public.rb_trees(id) on delete cascade,
  from_person_id text not null references public.rb_people(id) on delete cascade,
  to_person_id text not null references public.rb_people(id) on delete cascade,
  type text not null,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rb_relationships_tree on public.rb_relationships(tree_id);

create table if not exists public.rb_invites (
  id text primary key,
  tree_id text not null references public.rb_trees(id) on delete cascade,
  owner_id text not null references public.rb_users(id) on delete cascade,
  token text not null unique,
  is_active boolean not null default true,
  share_anchor_names boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rb_invites_tree on public.rb_invites(tree_id);

create table if not exists public.rb_submissions (
  id text primary key,
  tree_id text not null references public.rb_trees(id) on delete cascade,
  owner_id text not null references public.rb_users(id) on delete cascade,
  invite_token text not null,
  contributor_name text not null,
  contributor_email text,
  consent_confirmed boolean not null default true,
  status text not null default 'pending',
  people jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rb_submissions_tree on public.rb_submissions(tree_id);

create table if not exists public.rb_orders (
  id text primary key,
  tree_id text not null references public.rb_trees(id) on delete cascade,
  owner_id text not null references public.rb_users(id) on delete cascade,
  people_count integer not null default 0,
  currency text not null default 'INR',
  amount numeric not null default 0,
  provider text not null default 'unconfigured_demo',
  status text not null default 'demo_preview',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rb_orders_owner on public.rb_orders(owner_id);

-- Lock down direct public/anon client access with Row Level Security.
-- The Express backend uses SUPABASE_SECRET_KEY (service role) and enforces
-- owner authentication, password hashing, and private invite-token checks.
alter table public.rb_users enable row level security;
alter table public.rb_trees enable row level security;
alter table public.rb_people enable row level security;
alter table public.rb_relationships enable row level security;
alter table public.rb_invites enable row level security;
alter table public.rb_submissions enable row level security;
alter table public.rb_orders enable row level security;
