-- App settings table for feature flags and global settings
create table if not exists app_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- Example insert: insert into app_settings (key, value) values ('enable_gpt5_mini', '{"enabled": false}'::jsonb);
