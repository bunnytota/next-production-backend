// /jobs/cleanupUnverifiedUsers.ts
import cron from 'node-cron';
import { connectDB } from '../lib/dbconnect';
import User from '../models/user.model';
import logger from '../lib/logger';

// Schedule a job to run every 10 minutes.
cron.schedule('*/10 * * * *', async () => {
  try {
    await connectDB();
    // Define a cutoff date (e.g., unverified users older than 15 minutes).
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const result = await User.deleteMany({ verified: false, createdAt: { $lt: cutoff } });
    if (result.deletedCount) {
      logger.info(`Cleaned up ${result.deletedCount} unverified users.`);
    }
  } catch (error) {
    logger.error('Error cleaning up unverified users', error);
  }
});
