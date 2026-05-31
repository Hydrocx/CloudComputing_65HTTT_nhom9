import { Storage } from "@google-cloud/storage";

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const BUCKET_VIDEOS_NAME = process.env.GCS_BUCKET_VIDEOS;
const BUCKET_DOCS_NAME = process.env.GCS_BUCKET_DOCS;
const BUCKET_LOGS_NAME = process.env.GCS_BUCKET_LOGS;

if (!PROJECT_ID || !BUCKET_VIDEOS_NAME || !BUCKET_DOCS_NAME || !BUCKET_LOGS_NAME) {
  throw new Error("Missing GCS configuration. Check .env values.");
}

// Khoi tao client GCS (su dung GOOGLE_APPLICATION_CREDENTIALS de nhan dien tai khoan dich vu)
const storage = new Storage({ projectId: PROJECT_ID });

const BUCKET_VIDEOS = storage.bucket(BUCKET_VIDEOS_NAME);
const BUCKET_DOCS = storage.bucket(BUCKET_DOCS_NAME);
const BUCKET_LOGS = storage.bucket(BUCKET_LOGS_NAME);

export {
  storage,
  BUCKET_VIDEOS,
  BUCKET_DOCS,
  BUCKET_LOGS,
  BUCKET_VIDEOS_NAME,
  BUCKET_DOCS_NAME,
  BUCKET_LOGS_NAME,
};
