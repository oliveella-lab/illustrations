create table generations (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  enhanced_prompt text,
  image_url text not null,
  approved boolean default null,
  created_at timestamp with time zone default now()
);
