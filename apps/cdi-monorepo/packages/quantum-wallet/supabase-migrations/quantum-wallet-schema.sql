-- Quantum Wallet Schema Migration (Supabase)
-- Updated to use auth.users for user references

-- FIAT ACCOUNTS
create table if not exists fiat_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  institution text not null,
  account_type text check (account_type in ('checking', 'savings', 'credit')),
  external_id text, -- e.g. Plaid account ID or manual entry
  current_balance numeric(14,2) default 0,
  created_at timestamptz default now()
);

create table if not exists fiat_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references fiat_accounts(id) on delete cascade,
  amount numeric(14,2) not null,
  merchant_name text,
  category text,
  is_constructive_ecosystem boolean default false,
  transaction_date date not null,
  description text
);

-- CRYPTO WALLETS
create table if not exists crypto_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  wallet_type text not null, -- e.g. 'metamask', 'coinbase', 'ledger'
  wallet_address text not null,
  created_at timestamptz default now()
);

create table if not exists crypto_balances (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references crypto_wallets(id) on delete cascade,
  symbol text not null, -- e.g. 'BTC', 'ETH'
  amount numeric(20,8) not null,
  usd_value numeric(14,2),
  last_updated timestamptz default now()
);

-- MERCHANT COINS
create table if not exists merchant_coins (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references auth.users(id) on delete set null,
  symbol text not null unique,
  name text not null,
  logo_url text,
  total_supply numeric(20,2) default 0,
  current_price numeric(14,4) default 1.00,
  market_cap numeric(20,2) default 0,
  created_at timestamptz default now()
);

create table if not exists merchant_coin_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  coin_id uuid references merchant_coins(id) on delete cascade,
  balance numeric(20,2) default 0,
  avg_purchase_price numeric(14,4),
  unique (user_id, coin_id)
);

create table if not exists merchant_coin_transactions (
  id uuid primary key default gen_random_uuid(),
  coin_id uuid references merchant_coins(id) on delete cascade,
  from_user uuid references auth.users(id) on delete set null,
  to_user uuid references auth.users(id) on delete set null,
  amount numeric(20,2) not null,
  type text, -- e.g. 'reward', 'transfer', 'purchase'
  timestamp timestamptz default now()
);

-- TIME BANKING
create table if not exists time_bank (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_earned_hours numeric(10,2) default 0,
  total_spent_hours numeric(10,2) default 0,
  net_balance numeric(10,2) generated always as (total_earned_hours - total_spent_hours) stored
);

create table if not exists time_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text, -- 'earned' or 'spent'
  hours numeric(6,2) not null,
  activity text,
  verified_by uuid references auth.users(id),
  proof_url text,
  log_date date default current_date
);

create table if not exists time_commitments (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references auth.users(id) on delete set null,
  recipient_id uuid references auth.users(id) on delete set null,
  hours_committed numeric(6,2) not null,
  activity text,
  scheduled_date date,
  status text default 'scheduled'
);
