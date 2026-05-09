const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/discord-notify`;

async function notify(payload: {
  channel: string;
  title: string;
  body: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}): Promise<void> {
  try {
    await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Never let Discord notification failures break the app
  }
}

export async function notifyNewMember(
  storeName: string,
  tier: string,
  city?: string,
  state?: string
): Promise<void> {
  const location = city && state ? `${city}, ${state}` : city || state || 'Unknown';
  await notify({
    channel: 'marketplace_members',
    title: '🎉 New Marketplace Member!',
    body: `A new seller has joined the CDI Marketplace community.`,
    color: 0xf97316, // orange (matches marketplace digital color)
    fields: [
      { name: 'Store Name', value: storeName || 'Unnamed Store', inline: true },
      { name: 'Tier', value: tier || 'free', inline: true },
      { name: 'Location', value: location, inline: true },
    ],
  });
}
