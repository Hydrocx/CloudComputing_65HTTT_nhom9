/**
 * Lead Routes
 *
 * REST endpoints for Zoho CRM lead management.
 * Rate limited to 100 requests/minute.
 */
import express from "express";
import rateLimit from "express-rate-limit";
import { body, query, validationResult } from "express-validator";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import * as leadsController from "../controllers/leads.controller.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Rate Limiter: 100 requests/minute for lead endpoints
// ---------------------------------------------------------------------------

const leadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Limit: 100/min.",
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
 * POST /api/leads
 * Create a new Lead in Zoho CRM from public form submission.
 * Auth is optional — public forms can submit without auth.
 * Rate limited: 100/min.
 */
router.post(
  "/",
  leadRateLimit,
  body("name").isString().isLength({ min: 1 }).withMessage("Name is required."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("phone").optional().isString(),
  body("course_interest").optional().isString(),
  validate,
  leadsController.createLead
);

/**
 * PUT /api/leads/:id
 * Update a Lead's status (pipeline: Lead → Qualified → Converted → Student).
 * Auth: Admin or Teacher.
 */
router.put(
  "/:id",
  auth,
  requireRole("Admin", "Teacher"),
  body("status").isString().withMessage("Status is required."),
  body("userId").optional().isString(),
  validate,
  leadsController.updateLeadStatus
);

/**
 * POST /api/leads/:id/convert
 * Manually convert a Lead to Student.
 * Auth: Admin only.
 */
router.post(
  "/:id/convert",
  auth,
  requireRole("Admin"),
  leadsController.convertLead
);

/**
 * GET /api/leads
 * List all leads with optional filtering.
 * Auth: Admin or Teacher.
 */
router.get(
  "/",
  auth,
  requireRole("Admin", "Teacher"),
  query("status").optional().isString(),
  query("limit").optional().isInt({ min: 1, max: 200 }),
  query("offset").optional().isInt({ min: 0 }),
  validate,
  leadsController.getLeads
);

/**
 * GET /api/leads/stats
 * Lead pipeline summary.
 * Auth: Admin or Teacher.
 */
router.get(
  "/stats",
  auth,
  requireRole("Admin", "Teacher"),
  leadsController.getLeadStats
);

/**
 * POST /api/leads/retry-failed
 * Retry failed CRM sync operations.
 * Auth: Admin only.
 */
router.post(
  "/retry-failed",
  auth,
  requireRole("Admin"),
  leadsController.retryFailed
);

export default router;
