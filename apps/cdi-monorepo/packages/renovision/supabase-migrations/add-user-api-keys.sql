-- User API Keys Table for Secure Storage
create table if not exists user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  service text not null, -- e.g. 'gemini', 'stripe', 'plaid'
  api_key text not null, -- store encrypted if possible
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- (Optional) Add unique constraint so each user can only have one key per service
create unique index if not exists user_api_keys_user_service_idx on user_api_keys(user_id, service);

-- RLS: Only allow users to access their own keys
alter table user_api_keys enable row level security;
create policy "Users can manage their own API keys" on user_api_keys
  for all using (auth.uid() = user_id);
