import { syncStandingsToSanity } from '@/lib/sync-standings';

// This function can be called by a cron job or scheduled task
// You can deploy this as a serverless function with Vercel Cron Jobs
export async function scheduledSync() {
  console.log('Running scheduled standings sync...');
  
  try {
    const result = await syncStandingsToSanity();
    
    if (result.success) {
      console.log(`✅ Scheduled sync completed successfully`);
      console.log(`📊 Created: ${result.created}, Updated: ${result.updated}`);
    } else {
      console.error(`❌ Scheduled sync completed with errors:`, result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('💥 Scheduled sync failed:', error);
    throw error;
  }
}

// Example: Run sync daily at 6 AM
// You can set this up with Vercel Cron Jobs or your hosting provider's scheduler
export const config = {
  runtime: 'nodejs',
  // Vercel Cron syntax: "0 6 * * *" = daily at 6 AM UTC
  schedule: '0 6 * * *'
};
