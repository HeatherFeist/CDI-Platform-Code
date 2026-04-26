type DiscordEventType = "new_product_drop" | "community_message";

type DiscordEventPayload = {
  type: DiscordEventType;
  title: string;
  body: string;
  metadata?: Record<string, string | number | boolean>;
};

const webhookProxyUrl = import.meta.env.VITE_DISCORD_WEBHOOK_PROXY_URL || "";
export const discordInviteUrl = import.meta.env.VITE_DISCORD_INVITE_URL || "";

export const isDiscordWebhookEnabled = webhookProxyUrl.startsWith("http");
export const isDiscordInviteEnabled = discordInviteUrl.startsWith("http");

export async function sendDiscordEvent(payload: DiscordEventPayload): Promise<void> {
  if (!isDiscordWebhookEnabled) return;

  try {
    await fetch(webhookProxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `**${payload.title}**\n${payload.body}`,
        metadata: payload.metadata ?? {},
        source: "shopreneur",
        type: payload.type,
      }),
    });
  } catch (error) {
    console.warn("Discord webhook send failed", error);
  }
}
