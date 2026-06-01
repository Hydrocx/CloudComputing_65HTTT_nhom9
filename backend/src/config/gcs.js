import { Storage } from "@google-cloud/storage";

// Map env var names — supports both the .env names and the GCS-specific names
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.PROJECT_ID;
const BUCKET_VIDEOS_NAME = process.env.GCS_BUCKET_VIDEOS || process.env.BUCKET_VIDEOS;
const BUCKET_DOCS_NAME = process.env.GCS_BUCKET_DOCS || process.env.BUCKET_DOCS;
const BUCKET_LOGS_NAME = process.env.GCS_BUCKET_LOGS || process.env.BUCKET_LOGS;

// Lazy-init flag: GCS features work only when credentials are available
const hasGcsConfig = !!(PROJECT_ID && BUCKET_VIDEOS_NAME && BUCKET_DOCS_NAME && BUCKET_LOGS_NAME && process.env.GOOGLE_APPLICATION_CREDENTIALS);

/** @type {Storage | null} */
let storage = null;
let BUCKET_VIDEOS = null;
let BUCKET_DOCS = null;
let BUCKET_LOGS = null;

if (hasGcsConfig) {
  storage = new Storage({ projectId: PROJECT_ID });
  BUCKET_VIDEOS = storage.bucket(BUCKET_VIDEOS_NAME);
  BUCKET_DOCS = storage.bucket(BUCKET_DOCS_NAME);
  BUCKET_LOGS = storage.bucket(BUCKET_LOGS_NAME);
} else {
  console.warn("⚠️  GCS not configured — GCS routes will return 501. Set GOOGLE_APPLICATION_CREDENTIALS to enable.");
}

export {
  storage,
  BUCKET_VIDEOS,
  BUCKET_DOCS,
  BUCKET_LOGS,
  BUCKET_VIDEOS_NAME,
  BUCKET_DOCS_NAME,
  BUCKET_LOGS_NAME,
};
