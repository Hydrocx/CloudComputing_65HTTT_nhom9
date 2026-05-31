import express from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { auth } from "../middleware/auth.js";
import { requireGCSPermission, requireRole } from "../middleware/roleCheck.js";
import { generateSignedUrl } from "../services/gcsService.js";
import { storage } from "../config/gcs.js";
import { addAccessLog, getAccessLogs } from "../data/store.js";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.email || req.ip,
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

router.post(
  "/",
  auth,
  limiter,
  requireGCSPermission("read"),
  body("bucket").isString().withMessage("Bucket bat buoc."),
  body("gcsPath").isString().withMessage("Duong dan GCS bat buoc."),
  body("expiresIn").optional().isInt({ min: 60, max: 3600 }),
  validate,
  async (req, res) => {
    try {
      const { bucket, gcsPath, expiresIn } = req.body;
      const role = req.user.role;

      // Doc metadata de xac thuc mon hoc phu hop voi role
      const [metadata] = await storage.bucket(bucket).file(gcsPath).getMetadata();
      const courseId = metadata.metadata?.courseId || "";
      const uploaderEmail = metadata.metadata?.uploaderEmail || "";

      if (
        role === "Student" &&
        courseId &&
        !req.user.enrolledCourseIds.includes(courseId)
      ) {
        return sendError(res, "Sinh vien khong du quyen voi mon hoc nay.", 403);
      }

      if (
        role === "Teacher" &&
        courseId &&
        !req.user.courseIds.includes(courseId) &&
        uploaderEmail !== req.user.email
      ) {
        return sendError(res, "Giang vien khong du quyen voi mon hoc nay.", 403);
      }

      const result = await generateSignedUrl(bucket, gcsPath, expiresIn || 300);

      addAccessLog({
        action: "signed-url",
        bucket,
        gcsPath,
        userEmail: req.user.email,
        role,
        timestamp: new Date().toISOString(),
        ip: req.ip,
      });

      return sendSuccess(res, {
        ...result,
        fileName: gcsPath.split("/").pop(),
      });
    } catch (error) {
      return sendError(res, error.message || "Khong tao duoc signed URL.");
    }
  }
);

router.get("/logs", auth, requireRole("Admin", "Teacher"), (req, res) => {
  return sendSuccess(res, getAccessLogs());
});

export default router;
