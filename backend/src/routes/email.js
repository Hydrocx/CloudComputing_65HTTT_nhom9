/**
 * Email Routes
 *
 * Defines REST endpoints for the email system.
 * All email-sending endpoints are rate-limited to 10 requests/second
 * to comply with Zoho Mail SMTP limits.
 */
import express from "express";
import rateLimit from "express-rate-limit";
import { body, query, validationResult } from "express-validator";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import * as emailController from "../controllers/email.controller.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Rate Limiter: 10 requests/second for email endpoints
// ---------------------------------------------------------------------------

const emailRateLimit = rateLimit({
  windowMs: 1000, // 1 second window
  max: 10,         // 10 emails per second
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many email requests. Please slow down (max 10/sec).",
  },
});

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, error: errors.array()[0].msg });
  }
  return next();
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/email/send-activation
 * Send an account activation email.
 * Auth: Admin or Teacher
 * Rate limited: 10/sec
 */
router.post(
  "/send-activation",
  auth,
  emailRateLimit,
  body("email").isEmail().withMessage("Valid email is required."),
  body("userId").optional().isString(),
  body("name").optional().isString().isLength({ min: 1 }),
  validate,
  emailController.sendActivationEmail
);

/**
 * POST /api/email/send-enrollment
 * Send a course enrollment confirmation.
 * Auth: Authenticated users
 * Rate limited: 10/sec
 */
router.post(
  "/send-enrollment",
  auth,
  emailRateLimit,
  body("email").isEmail().withMessage("Valid email is required."),
  body("courseId").isString().withMessage("courseId is required."),
  body("userId").optional().isString(),
  body("name").optional().isString(),
  body("courseTitle").optional().isString(),
  body("courseDescription").optional().isString(),
  validate,
  emailController.sendEnrollmentEmail
);

/**
 * POST /api/email/send-receipt
 * Send a payment receipt email.
 * Auth: Authenticated users
 * Rate limited: 10/sec
 */
router.post(
  "/send-receipt",
  auth,
  emailRateLimit,
  body("email").isEmail().withMessage("Valid email is required."),
  body("courseId").isString().withMessage("courseId is required."),
  body("amount").isString().withMessage("amount is required."),
  body("userId").optional().isString(),
  body("name").optional().isString(),
  body("courseTitle").optional().isString(),
  body("method").optional().isString(),
  body("transactionId").optional().isString(),
  validate,
  emailController.sendReceiptEmail
);

/**
 * GET /api/email/logs
 * View email logs with optional filtering.
 * Auth: Admin only
 */
router.get(
  "/logs",
  auth,
  requireRole("Admin"),
  query("type").optional().isIn(["activation", "enrollment", "receipt"]),
  query("status").optional().isIn(["sent", "failed", "pending"]),
  query("limit").optional().isInt({ min: 1, max: 200 }),
  query("offset").optional().isInt({ min: 0 }),
  validate,
  emailController.getEmailLogs
);

/**
 * POST /api/email/retry-failed
 * Retry all failed emails.
 * Auth: Admin only
 * Rate limited: 10/sec
 */
router.post(
  "/retry-failed",
  auth,
  requireRole("Admin"),
  emailRateLimit,
  emailController.retryFailed
);

/**
 * GET /api/email/stats
 * Get email sending statistics.
 * Auth: Admin only
 */
router.get(
  "/stats",
  auth,
  requireRole("Admin"),
  emailController.getEmailStats
);

export default router;
