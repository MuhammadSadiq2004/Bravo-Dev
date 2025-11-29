-- users table (optional, if you want persistent user profiles)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- rooms table
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_name text not null,
  livekit_room_name text not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

-- invites table
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  email text not null,
  token text not null, -- secure random token
  expires_at timestamptz not null,
  accepted boolean default false,
  created_at timestamptz default now()
);

-- captions log (optional, for analytics / debugging)
create table if not exists captions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  invite_id uuid references invites(id) on delete set null,
  speaker_identity text,
  src_language text,
  tgt_language text,
  text text,
  is_final boolean,
  created_at timestamptz default now()
);
