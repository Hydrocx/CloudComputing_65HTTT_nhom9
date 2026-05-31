import express from "express";
import multer from "multer";
import { body, validationResult } from "express-validator";
import { auth } from "../middleware/auth.js";
import { requireRole, requireGCSPermission } from "../middleware/roleCheck.js";
import { deleteFile, listFiles, uploadFile } from "../services/gcsService.js";
import { listVersions, restoreVersion } from "../services/versionService.js";
import {
  BUCKET_DOCS_NAME,
  BUCKET_LOGS_NAME,
  BUCKET_VIDEOS_NAME,
  storage,
} from "../config/gcs.js";
import { addAccessLog } from "../data/store.js";

const router = express.Router();

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg);
  }
  return next();
};

const getAllowedBuckets = (role) => {
  if (role === "Admin") {
    return [BUCKET_VIDEOS_NAME, BUCKET_DOCS_NAME, BUCKET_LOGS_NAME];
  }

  if (role === "Teacher") {
    return [BUCKET_VIDEOS_NAME, BUCKET_DOCS_NAME];
  }

  return [BUCKET_VIDEOS_NAME, BUCKET_DOCS_NAME];
};

router.get("/", auth, async (req, res) => {
  try {
    const role = req.user.role;
    const allowedBuckets = getAllowedBuckets(role);
    const bucketFilter = req.query.bucket;
    const prefix = req.query.prefix || "";

    if (bucketFilter && !allowedBuckets.includes(bucketFilter)) {
      return sendError(res, "Khong du quyen truy cap bucket.", 403);
    }

    const bucketsToScan = bucketFilter ? [bucketFilter] : allowedBuckets;

    const fileLists = await Promise.all(
      bucketsToScan.map((bucket) => listFiles(bucket, prefix))
    );

    let items = fileLists.flat();

    if (role === "Teacher") {
      items = items.filter(
        (item) =>
          item.metadata?.uploaderEmail === req.user.email ||
          req.user.courseIds?.includes(item.metadata?.courseId)
      );
    }

    if (role === "Student") {
      items = items.filter((item) =>
        req.user.enrolledCourseIds?.includes(item.metadata?.courseId)
      );
    }

    return sendSuccess(res, items);
  } catch (error) {
    return sendError(res, error.message || "Khong the tai danh sach file.");
  }
});

router.get(
  "/versions",
  auth,
  requireRole("Teacher", "Admin"),
  requireGCSPermission("read"),
  async (req, res) => {
    try {
      const bucket = req.query.bucket;
      const gcsPath = req.query.gcsPath;

      if (!bucket || !gcsPath) {
        return sendError(res, "Can bucket va gcsPath.");
      }

      // Doc metadata tu GCS de kiem tra quyen truy cap
      const [metadata] = await storage.bucket(bucket).file(gcsPath).getMetadata();
      const uploaderEmail = metadata.metadata?.uploaderEmail || "";

      if (req.user.role === "Teacher" && uploaderEmail !== req.user.email) {
        return sendError(res, "Chi duoc xem version cua file cua minh.", 403);
      }

      const versions = await listVersions(bucket, gcsPath);
      return sendSuccess(res, versions);
    } catch (error) {
      return sendError(res, error.message || "Khong the tai version.");
    }
  }
);

router.post(
  "/restore",
  auth,
  requireRole("Teacher", "Admin"),
  requireGCSPermission("write"),
  body("bucket").isString().withMessage("Bucket bat buoc."),
  body("gcsPath").isString().withMessage("GCS path bat buoc."),
  body("generation").isString().withMessage("Generation bat buoc."),
  validate,
  async (req, res) => {
    try {
      const { bucket, gcsPath, generation } = req.body;

      // Doc metadata tu GCS de kiem tra quyen truy cap
      const [metadata] = await storage.bucket(bucket).file(gcsPath).getMetadata();
      const uploaderEmail = metadata.metadata?.uploaderEmail || "";

      if (req.user.role === "Teacher" && uploaderEmail !== req.user.email) {
        return sendError(res, "Chi duoc khoi phuc file cua minh.", 403);
      }

      const result = await restoreVersion(bucket, gcsPath, generation);

      addAccessLog({
        action: "restore",
        bucket,
        gcsPath,
        userEmail: req.user.email,
        role: req.user.role,
        timestamp: new Date().toISOString(),
        ip: req.ip,
      });

      return sendSuccess(res, result);
    } catch (error) {
      return sendError(res, error.message || "Khong the khoi phuc file.");
    }
  }
);

router.post(
  "/upload",
  auth,
  requireRole("Teacher", "Admin"),
  upload.single("file"),
  requireGCSPermission("write"),
  body("courseId").optional().isString(),
  validate,
  async (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, "Can chon file de tai len.");
      }

      if (
        req.user.role === "Teacher" &&
        req.body.courseId &&
        !req.user.courseIds?.includes(req.body.courseId)
      ) {
        return sendError(res, "Mon hoc khong hop le.", 403);
      }

      const result = await uploadFile(
        req.file,
        req.body.fileType,
        req.body.courseId,
        req.user.email
      );

      addAccessLog({
        action: "upload",
        bucket: result.bucket,
        gcsPath: result.gcsPath,
        userEmail: req.user.email,
        role: req.user.role,
        timestamp: new Date().toISOString(),
        ip: req.ip,
      });

      return sendSuccess(res, result);
    } catch (error) {
      return sendError(res, error.message || "Tai len that bai.");
    }
  }
);

router.delete(
  "/:id",
  auth,
  requireRole("Teacher", "Admin"),
  requireGCSPermission("delete"),
  async (req, res) => {
    try {
      const gcsPath = decodeURIComponent(req.params.id);
      const bucket = req.query.bucket;

      if (!bucket) {
        return sendError(res, "Can bucket de xoa file.");
      }

      // Doc metadata de kiem tra nguoi tai len
      const [metadata] = await storage.bucket(bucket).file(gcsPath).getMetadata();
      const uploaderEmail = metadata.metadata?.uploaderEmail || "";

      if (req.user.role === "Teacher" && uploaderEmail !== req.user.email) {
        return sendError(res, "Chi duoc xoa file cua minh.", 403);
      }

      const result = await deleteFile(bucket, gcsPath);

      addAccessLog({
        action: "delete",
        bucket,
        gcsPath,
        userEmail: req.user.email,
        role: req.user.role,
        timestamp: new Date().toISOString(),
        ip: req.ip,
      });

      return sendSuccess(res, result);
    } catch (error) {
      return sendError(res, error.message || "Xoa file that bai.");
    }
  }
);

export default router;
