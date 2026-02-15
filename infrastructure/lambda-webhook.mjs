/**
 * Lambda: inboxx-webhook-caller
 * Triggered by S3 when new email arrives, calls your API webhook
 *
 * Environment Variables:
 *   WEBHOOK_URL - https://api.inboxx.club/api/v1/inbound/webhook
 */

export const handler = async (event) => {
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("WEBHOOK_URL not configured");
  }

  console.log(`Processing ${event.Records.length} record(s)`);

  for (const record of event.Records) {
    const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    console.log(`Processing: ${s3Key}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ s3Key }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed: ${response.status} - ${text}`);
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log(`Success: ${s3Key}`);
  }

  return { statusCode: 200 };
};
