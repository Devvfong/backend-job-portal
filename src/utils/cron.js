import cron from "node-cron";
import { prisma } from "../config/db.js";
import { supabase } from "../lib/supabase.js";

// Make sure only one process runs this cron in production
const shouldRunCron = process.env.NODE_ENV !== "production" ||
                      process.env.NODE_APP_INSTANCE === "0" ||
                      process.env.IS_CRON_LEADER === "true";

let cleanupCronJob = null;

if (shouldRunCron) {
  // Run every midnight (0 0 * * *)
  cleanupCronJob = cron.schedule("0 0 * * *", async () => {
    console.log("Running scheduled asset cleanup cron job...");
    
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      // 1. Find all records in 'DeletedAsset' where deletedAt < threeDaysAgo
      const orphans = await prisma.deletedAsset.findMany({
        where: {
          deletedAt: {
            lt: threeDaysAgo,
          },
        },
        select: {
          id: true,
          filePath: true,
          bucket: true,
        },
      });

      if (orphans.length === 0) {
        console.log("No assets to clean up today.");
        return;
      }

      console.log(`Found ${orphans.length} assets older than 3 days. Engaging deletion.`);

      // Group by bucket
      const byBucket = {};
      for (const orphan of orphans) {
        const b = orphan.bucket || "logos";
        if (!byBucket[b]) byBucket[b] = [];
        byBucket[b].push(orphan);
      }

      // Process each bucket
      for (const [bucketName, items] of Object.entries(byBucket)) {
        console.log(`Deleting ${items.length} items from bucket '${bucketName}'...`);
        
        // Batch in chunks of 100
        const CHUNK_SIZE = 100;
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
          const chunk = items.slice(i, i + CHUNK_SIZE);
          const filePaths = chunk.map(o => o.filePath);

          // 2. Physically remove these files from Supabase Storage
          const { error } = await supabase.storage.from(bucketName).remove(filePaths);

          if (error) {
            console.error(`Failed to remove chunk from bucket '${bucketName}':`, error);
            continue; // Skip deleting from DB so we retry next time
          }

          // 3. Clear the records from the 'deleted_assets' table
          const targetIds = chunk.map(o => o.id);
          await prisma.deletedAsset.deleteMany({
            where: {
              id: {
                in: targetIds,
              },
            },
          });
        }
      }

      console.log("Cleanup job completed successfully.");
    } catch (err) {
      console.error("Error running asset cleanup cron job:", err);
    }
  });
}

export default cleanupCronJob;

