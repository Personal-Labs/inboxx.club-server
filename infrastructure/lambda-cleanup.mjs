/**
 * Lambda: inboxx-cleanup-trigger
 * Triggered by EventBridge schedule, calls cleanup endpoint
 *
 * Environment Variables:
 *   CLEANUP_URL - https://api.inboxx.club/api/v1/cleanup/run
 */

export const handler = async () => {
  const cleanupUrl = process.env.CLEANUP_URL;

  if (!cleanupUrl) {
    throw new Error("CLEANUP_URL not configured");
  }

  console.log(`Running cleanup at ${new Date().toISOString()}`);

  const response = await fetch(cleanupUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const result = await response.json();
  console.log("Cleanup result:", JSON.stringify(result, null, 2));

  if (!response.ok) {
    throw new Error(`Cleanup failed: ${response.status}`);
  }

  return result;
};
