import { runCleanup } from "../services/cleanup.service.js";

async function main() {
  console.log("Starting cleanup job...");
  const startTime = Date.now();

  try {
    const result = await runCleanup();
    const duration = Date.now() - startTime;

    console.log("Cleanup completed successfully!");
    console.log(`  Deleted inboxes: ${result.deletedInboxes}`);
    console.log(`  Deleted messages: ${result.deletedMessages}`);
    console.log(`  Deleted attachments: ${result.deletedAttachments}`);
    console.log(`  Deleted S3 objects: ${result.deletedS3Objects}`);
    console.log(`  Deleted inbound events: ${result.deletedInboundEvents}`);
    console.log(`  Duration: ${duration}ms`);

    if (result.errors.length > 0) {
      console.log(`  Errors (${result.errors.length}):`);
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Cleanup failed: ${errorMessage}`);
    process.exit(1);
  }
}

void main();
