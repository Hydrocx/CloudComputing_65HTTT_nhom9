import {
  BUCKET_VIDEOS_NAME,
  BUCKET_DOCS_NAME,
  BUCKET_LOGS_NAME,
} from "../config/gcs.js";

const VIDEO_MIME_PREFIX = "video/";
const TEXT_MIME_PREFIX = "text/";
const PDF_MIME = "application/pdf";

const resolveBucketNameByMime = (mimetype = "") => {
  if (mimetype.startsWith(VIDEO_MIME_PREFIX)) {
    return BUCKET_VIDEOS_NAME;
  }

  if (mimetype === PDF_MIME) {
    return BUCKET_DOCS_NAME;
  }

  if (mimetype.startsWith(TEXT_MIME_PREFIX)) {
    return BUCKET_DOCS_NAME;
  }

  return BUCKET_DOCS_NAME;
};

const PERMISSIONS = {
  Admin: {
    read: ["*"],
    write: ["*"],
    delete: ["*"],
  },
  Teacher: {
    read: [BUCKET_VIDEOS_NAME, BUCKET_DOCS_NAME],
    write: [BUCKET_VIDEOS_NAME, BUCKET_DOCS_NAME],
    delete: [BUCKET_VIDEOS_NAME, BUCKET_DOCS_NAME],
  },
  Student: {
    read: [BUCKET_VIDEOS_NAME, BUCKET_DOCS_NAME],
    write: [],
    delete: [],
  },
};

export const requireRole = (...roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ success: false, error: "Khong du quyen." });
  }

  return next();
};

export const requireGCSPermission = (action) => (req, res, next) => {
  const role = req.user?.role;
  const bucketName =
    req.body?.bucket ||
    req.query?.bucket ||
    req.params?.bucket ||
    resolveBucketNameByMime(req.file?.mimetype || "");

  const rule = PERMISSIONS[role] || { read: [], write: [], delete: [] };
  const allowed = rule[action] || [];

  if (allowed.includes("*") || allowed.includes(bucketName)) {
    return next();
  }

  return res
    .status(403)
    .json({ success: false, error: "Khong du quyen truy cap bucket." });
};
