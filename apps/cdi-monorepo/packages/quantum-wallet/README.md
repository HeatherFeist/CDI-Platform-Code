# Quantum Wallet — Feature flag & GPT-5-mini setup

This folder contains the Quantum Wallet feature-flag migration, UI toggle, and a simple serverless proxy to forward prompts to GPT-5-mini when enabled.

Steps to enable GPT-5-mini for all clients (safe rollout):

1. Run the DB migration

   - Open Supabase Studio → SQL Editor → Paste `quantum-wallet/supabase-migrations/0002-app-settings.sql` and run.
   - Or use the Supabase CLI to apply migrations.

2. Deploy the serverless proxy (recommended: Supabase Functions)

   - Ensure the following environment variables are set in your function runtime:
     - `OPENAI_API_KEY` — your OpenAI API key (or provider API key)
     - `SUPABASE_URL` — your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` — service role key (used only by the function to read `app_settings`)

   - Deploy `quantum-wallet/functions/gpt-proxy/index.ts` as a Supabase Function (or similar).

3. Toggle the feature flag

   - In-app: Go to the Quantum Wallet → Payment Integrations settings and enable the "Enable GPT-5 mini for clients" toggle. This writes to `app_settings`.
   - Or in SQL: run
     ```sql
     insert into app_settings (key, value) values ('enable_gpt5_mini', '{"enabled": true}')
     on conflict (key) do update set value = EXCLUDED.value, updated_at = now();
     ```

4. Update your frontend to call the proxy

   - Example POST to `/functions/v1/gpt-proxy` with body `{ "prompt": "Hello" }`.

Security notes

- Never store raw OpenAI or Stripe/PLAID secret keys in client-side code or public DB rows. Keep them in environment variables or a secrets manager.
- Ensure only admin users can toggle global flags in production (add RLS or check user role in the save function).
