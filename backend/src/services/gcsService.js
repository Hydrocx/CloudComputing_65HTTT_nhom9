import { Readable } from "stream";
import {
  storage,
  BUCKET_VIDEOS,
  BUCKET_DOCS,
  BUCKET_LOGS,
  BUCKET_VIDEOS_NAME,
  BUCKET_DOCS_NAME,
  BUCKET_LOGS_NAME,
} from "../config/gcs.js";

const VIDEO_MIME_PREFIX = "video/";
const TEXT_MIME_PREFIX = "text/";
const PDF_MIME = "application/pdf";

const sanitizeName = (name) =>
  name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");

const resolveBucketByMime = (mimetype = "") => {
  if (mimetype.startsWith(VIDEO_MIME_PREFIX)) {
    return { bucket: BUCKET_VIDEOS, bucketName: BUCKET_VIDEOS_NAME };
  }

  if (mimetype === PDF_MIME) {
    return { bucket: BUCKET_DOCS, bucketName: BUCKET_DOCS_NAME };
  }

  if (mimetype.startsWith(TEXT_MIME_PREFIX)) {
    return { bucket: BUCKET_DOCS, bucketName: BUCKET_DOCS_NAME };
  }

  return { bucket: BUCKET_DOCS, bucketName: BUCKET_DOCS_NAME };
};

export const uploadFile = async (file, fileType, courseId, uploaderEmail) => {
  try {
    const detectedMime = fileType || file?.mimetype || "";
    const { bucket, bucketName } = resolveBucketByMime(detectedMime);
    const timestamp = Date.now();
    const safeName = sanitizeName(file.originalname || `file-${timestamp}`);
    const prefix = courseId ? `courses/${courseId}` : "misc";
    const gcsPath = `${prefix}/${timestamp}-${safeName}`;

    // Luu metadata de phuc vu loc theo mon hoc va nguoi tai len
    const gcsFile = bucket.file(gcsPath);
    const stream = gcsFile.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          courseId: courseId || "",
          uploaderEmail: uploaderEmail || "",
          originalName: file.originalname || "",
        },
      },
    });

    await new Promise((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(stream)
        .on("error", reject)
        .on("finish", resolve);
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
      gcsPath
    )}`;

    return {
      gcsPath,
      bucket: bucketName,
      publicUrl,
      size: file.size,
      contentType: file.mimetype,
    };
  } catch (error) {
    throw new Error(`Upload GCS failed: ${error.message}`);
  }
};

export const generateSignedUrl = async (bucketName, gcsPath, expiresInSeconds = 300) => {
  try {
    // Tao signed URL doc file trong thoi gian gioi han
    const [signedUrl] = await storage
      .bucket(bucketName)
      .file(gcsPath)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + expiresInSeconds * 1000,
      });

    return {
      signedUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  } catch (error) {
    throw new Error(`Generate signed URL failed: ${error.message}`);
  }
};

export const deleteFile = async (bucketName, gcsPath) => {
  try {
    // Xoa object khoi bucket; neu co versioning thi tao delete marker
    await storage.bucket(bucketName).file(gcsPath).delete({ ignoreNotFound: true });

    return { deleted: true };
  } catch (error) {
    throw new Error(`Delete GCS file failed: ${error.message}`);
  }
};

export const listFiles = async (bucketName, prefix = "") => {
  try {
    const [files] = await storage.bucket(bucketName).getFiles({ prefix });

    const items = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        return {
          name: metadata.name,
          size: Number(metadata.size || 0),
          contentType: metadata.contentType || "",
          timeCreated: metadata.timeCreated || "",
          storageClass: metadata.storageClass || "STANDARD",
          metadata: metadata.metadata || {},
          bucket: bucketName,
        };
      })
    );

    return items;
  } catch (error) {
    throw new Error(`List GCS files failed: ${error.message}`);
  }
};

export const getStorageStats = async () => {
  try {
    const buckets = [
      { key: "videos", name: BUCKET_VIDEOS_NAME },
      { key: "docs", name: BUCKET_DOCS_NAME },
      { key: "logs", name: BUCKET_LOGS_NAME },
    ];

    const stats = {};

    for (const bucket of buckets) {
      const [files] = await storage.bucket(bucket.name).getFiles();
      const sizeBytes = files.reduce(
        (total, file) => total + Number(file.metadata?.size || 0),
        0
      );

      stats[bucket.key] = { count: files.length, sizeBytes };
    }

    return stats;
  } catch (error) {
    throw new Error(`Get storage stats failed: ${error.message}`);
  }
};
