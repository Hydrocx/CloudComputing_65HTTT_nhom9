/**
 * Email Controller
 *
 * Handles incoming HTTP requests for sending and managing emails.
 */
import * as emailService from "../services/email.service.js";
import { getDb } from "../database/db.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// ---------------------------------------------------------------------------
// Send Activation Email
// POST /api/email/send-activation
// Body: { userId, email, name }
// ---------------------------------------------------------------------------

export const sendActivationEmail = async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    if (!email) {
      return sendError(res, "Email is required.");
    }

    const user = { id: userId || req.user?.id, email, name: name || email.split("@")[0] };

    const result = await emailService.sendActivation(user);

    if (result.success) {
      return sendSuccess(res, {
        message: "Activation email sent.",
        logId: result.logId,
      });
    }

    return sendError(res, `Failed to send activation email: ${result.error}`, 500);
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// Send Enrollment Confirmation
// POST /api/email/send-enrollment
// Body: { userId, email, name, courseId, courseTitle, courseDescription }
// ---------------------------------------------------------------------------

export const sendEnrollmentEmail = async (req, res) => {
  try {
    const { userId, email, name, courseId, courseTitle, courseDescription } = req.body;

    if (!email || !courseId) {
      return sendError(res, "Email and courseId are required.");
    }

    const user = { id: userId || req.user?.id, email, name: name || email.split("@")[0] };
    const course = {
      id: courseId,
      title: courseTitle || "Course",
      description: courseDescription || "",
    };

    const result = await emailService.sendEnrollment(user, course);

    if (result.success) {
      return sendSuccess(res, {
        message: "Enrollment confirmation sent.",
        logId: result.logId,
      });
    }

    return sendError(res, `Failed to send enrollment email: ${result.error}`, 500);
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// Send Payment Receipt
// POST /api/email/send-receipt
// Body: { userId, email, name, courseId, courseTitle, amount, method, transactionId }
// ---------------------------------------------------------------------------

export const sendReceiptEmail = async (req, res) => {
  try {
    const {
      userId, email, name,
      courseId, courseTitle,
      amount, method, transactionId,
    } = req.body;

    if (!email || !courseId || !amount) {
      return sendError(res, "Email, courseId, and amount are required.");
    }

    const user = { id: userId || req.user?.id, email, name: name || email.split("@")[0] };
    const course = { id: courseId, title: courseTitle || "Course" };
    const payment = {
      amount,
      method: method || "Unknown",
      transactionId: transactionId || "N/A",
    };

    const result = await emailService.sendReceipt(user, course, payment);

    if (result.success) {
      return sendSuccess(res, {
        message: "Receipt email sent.",
        logId: result.logId,
        invoiceNo: result.invoiceNo,
      });
    }

    return sendError(res, `Failed to send receipt email: ${result.error}`, 500);
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// Get Email Logs
// GET /api/email/logs
// Query: ?type=activation&status=sent&limit=50&offset=0
// ---------------------------------------------------------------------------

export const getEmailLogs = async (req, res) => {
  try {
    const db = getDb();
    const { type, status, limit = 50, offset = 0 } = req.query;

    let sql = "SELECT * FROM email_logs WHERE 1=1";
    const params = [];

    if (type) {
      sql += " AND type = ?";
      params.push(type);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);

    const logs = db.prepare(sql).all(...params);

    // Get total count
    let countSql = "SELECT COUNT(*) as total FROM email_logs WHERE 1=1";
    const countParams = [];
    if (type) {
      countSql += " AND type = ?";
      countParams.push(type);
    }
    if (status) {
      countSql += " AND status = ?";
      countParams.push(status);
    }
    const { total } = db.prepare(countSql).get(...countParams);

    return sendSuccess(res, { logs, total, limit: parseInt(limit, 10) || 50, offset: parseInt(offset, 10) || 0 });
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// Retry Failed Emails
// POST /api/email/retry-failed
// ---------------------------------------------------------------------------

export const retryFailed = async (req, res) => {
  try {
    const result = await emailService.retryFailedEmails();
    return sendSuccess(res, {
      message: "Retry completed.",
      ...result,
    });
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// Get Email Stats (summary counts)
// GET /api/email/stats
// ---------------------------------------------------------------------------

export const getEmailStats = async (req, res) => {
  try {
    const db = getDb();

    const stats = db
      .prepare(
        `SELECT type, status, COUNT(*) as count
         FROM email_logs
         GROUP BY type, status`
      )
      .all();

    const totals = db
      .prepare(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
         FROM email_logs`
      )
      .get();

    return sendSuccess(res, { breakdown: stats, totals });
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};
