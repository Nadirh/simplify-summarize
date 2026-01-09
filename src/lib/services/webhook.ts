/**
 * Webhook service for sending processed content to AvidTrak
 */

export interface WebhookPayload {
  action: "content_processed";
  page_url: string;
  page_title?: string;
  content_type: "simplify" | "summarize";
  content: string;
  customer_id: string;
  timestamp: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface WebhookResult {
  success: boolean;
  error?: string;
}

/**
 * Send processed content to the webhook endpoint
 */
export async function sendWebhook(payload: WebhookPayload): Promise<WebhookResult> {
  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.log("Webhook not configured, skipping");
    return { success: true }; // Not an error, just not configured
  }

  try {
    console.log(`Sending webhook to ${webhookUrl} for ${payload.content_type}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhookSecret,
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: `evt_${Date.now()}`,
        ...payload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook failed with status ${response.status}: ${errorText}`);
      return {
        success: false,
        error: `Webhook failed: ${response.status} ${errorText}`,
      };
    }

    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    console.log("Webhook sent successfully:", result);
    return { success: true };
  } catch (error) {
    console.error("Webhook error:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}
