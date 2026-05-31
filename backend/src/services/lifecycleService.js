import { storage } from "../config/gcs.js";
import { getStorageStats } from "./gcsService.js";

export const setLifecycleRule = async (bucketName, lifecycle) => {
  try {
    // Cap nhat lifecycle rules cho bucket
    await storage.bucket(bucketName).setMetadata({ lifecycle });

    return { updated: true };
  } catch (error) {
    throw new Error(`Set lifecycle rule failed: ${error.message}`);
  }
};

export { getStorageStats };
