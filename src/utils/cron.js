import cron from "node-cron";
import { prisma } from "../config/db.js";
import { supabase } from "../lib/supabase.js";

// Run every midnight (0 0 * * *)
const cleanupCronJob = cron.schedule("0 0 * * *", async () => {
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
      },
    });

    if (orphans.length === 0) {
      console.log("No assets to clean up today.");
      return;
    }

    console.log(`Found ${orphans.length} assets older than 3 days. Engaging deletion.`);

    const filePaths = orphans.map(o => o.filePath);

    // 2. Physically remove these files from Supabase Storage
    const { error } = await supabase.storage.from("company-assets").remove(filePaths);

    if (error) {
      console.error(`Failed to remove assets from Supabase:`, error);
      return; // Assuming we want to keep them in table if Supabase delete failed, to try again later
    }

    // 3. Clear the records from the 'deleted_assets' table
    const targetIds = orphans.map(o => o.id);
    await prisma.deletedAsset.deleteMany({
      where: {
        id: {
          in: targetIds,
        },
      },
    });

    console.log("Cleanup job completed successfully.");
  } catch (err) {
    console.error("Error running asset cleanup cron job:", err);
  }
});

export default cleanupCronJob;
