import { storage } from "../config/gcs.js";

export const listVersions = async (bucketName, fileName) => {
  try {
    // Lay tat ca phien ban (versions) cua object
    const [files] = await storage
      .bucket(bucketName)
      .getFiles({ versions: true, prefix: fileName });

    const versions = files
      .filter((file) => file.name === fileName)
      .map((file) => ({
        name: file.name,
        generation: file.generation,
        size: Number(file.metadata?.size || 0),
        timeCreated: file.metadata?.timeCreated || "",
        updated: file.metadata?.updated || "",
        isLatest: file.metadata?.isLatest || false,
        uploaderEmail: file.metadata?.metadata?.uploaderEmail || "",
      }))
      .sort((a, b) => Number(b.generation) - Number(a.generation));

    return versions;
  } catch (error) {
    throw new Error(`List versions failed: ${error.message}`);
  }
};

export const restoreVersion = async (bucketName, fileName, generation) => {
  try {
    // Copy phien ban cu de tao phien ban moi nhat
    const source = storage.bucket(bucketName).file(fileName, { generation });
    const dest = storage.bucket(bucketName).file(fileName);

    await source.copy(dest);

    return { restored: true };
  } catch (error) {
    throw new Error(`Restore version failed: ${error.message}`);
  }
};
