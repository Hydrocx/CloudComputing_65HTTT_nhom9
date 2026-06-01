/**
 * Leads Controller
 *
 * HTTP handlers for lead management endpoints.
 */
import * as crmService from "../services/crm.service.js";
import { getDb } from "../database/db.js";
import { LEAD_STATUSES } from "../config/zoho-crm.config.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// ---------------------------------------------------------------------------
// POST /api/leads
// Create a new Lead in Zoho CRM from form submission
// ---------------------------------------------------------------------------

export const createLead = async (req, res) => {
  try {
    const { name, email, phone, course_interest } = req.body;

    if (!email) return sendError(res, "Email is required.");
    if (!name) return sendError(res, "Name is required.");

    // Split name into first/last for Zoho
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const result = await crmService.createLead({
      First_Name: firstName,
      Last_Name: lastName,
      Email: email,
      Phone: phone || "",
      course_interest: course_interest || "",
      Company: course_interest || "EduCloud Inquiry",
    });

    if (result.success) {
      return sendSuccess(res, {
        message: "Lead created successfully in Zoho CRM.",
        zohoLeadId: result.zohoLeadId,
        localId: result.localId,
      }, 201);
    }

    return sendError(res, `Failed to create lead: ${result.error}`, 500);
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/leads/:id
// Update a Lead's status (by Zoho lead ID or local lead ID)
// ---------------------------------------------------------------------------

export const updateLeadStatus = async (req, res) => {
  try {
    const { status: newStatus, userId } = req.body;
    const { id } = req.params;

    if (!id) return sendError(res, "Lead ID is required.");
    if (!newStatus) return sendError(res, "Status is required.");

    if (!Object.values(LEAD_STATUSES).includes(newStatus)) {
      return sendError(res, `Invalid status. Must be one of: ${Object.values(LEAD_STATUSES).join(", ")}`);
    }

    // Resolve Zoho lead ID — input could be local DB id or zoho id
    const db = getDb();
    const localLead = db
      .prepare("SELECT * FROM lead_sync WHERE id = ? OR zoho_lead_id = ?")
      .get(id, id);

    if (!localLead) {
      return sendError(res, "Lead not found.", 404);
    }

    const result = await crmService.updateLeadStatus(
      localLead.zoho_lead_id,
      newStatus,
      { userId }
    );

    if (result.success) {
      return sendSuccess(res, {
        message: `Lead status updated to ${newStatus}.`,
        localId: result.localId,
      });
    }

    return sendError(res, `Failed to update lead: ${result.error}`, 500);
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// POST /api/leads/:id/convert
// Convert a Lead to Student
// ---------------------------------------------------------------------------

export const convertLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return sendError(res, "Lead ID is required.");

    const db = getDb();
    const localLead = db
      .prepare("SELECT * FROM lead_sync WHERE id = ? OR zoho_lead_id = ?")
      .get(id, id);

    if (!localLead) {
      return sendError(res, "Lead not found.", 404);
    }

    if (localLead.status === LEAD_STATUSES.STUDENT) {
      return sendError(res, "Lead is already converted to Student.");
    }

    // First update status to Converted, then conversion triggers student creation
    const statusResult = await crmService.updateLeadStatus(
      localLead.zoho_lead_id,
      LEAD_STATUSES.CONVERTED
    );

    if (!statusResult.success) {
      return sendError(res, `Failed to mark lead as converted: ${statusResult.error}`, 500);
    }

    // Convert to student
    const convertResult = await crmService.convertLead(localLead.zoho_lead_id);

    if (convertResult.success) {
      return sendSuccess(res, {
        message: "Lead converted to Student successfully.",
        userId: convertResult.userId,
      });
    }

    return sendError(res, `Conversion failed: ${convertResult.error}`, 500);
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// GET /api/leads
// List all leads with optional filtering
// ---------------------------------------------------------------------------

export const getLeads = async (req, res) => {
  try {
    const db = getDb();
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = "SELECT * FROM lead_sync WHERE 1=1";
    const params = [];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);

    const leads = db.prepare(sql).all(...params);

    let countSql = "SELECT COUNT(*) as total FROM lead_sync WHERE 1=1";
    const countParams = [];
    if (status) {
      countSql += " AND status = ?";
      countParams.push(status);
    }
    const { total } = db.prepare(countSql).get(...countParams);

    return sendSuccess(res, {
      leads,
      total,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    });
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// GET /api/leads/stats
// Lead pipeline summary
// ---------------------------------------------------------------------------

export const getLeadStats = async (req, res) => {
  try {
    const db = getDb();
    const pipeline = db
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM lead_sync
         GROUP BY status
         ORDER BY CASE status
           WHEN 'Lead' THEN 1
           WHEN 'Qualified' THEN 2
           WHEN 'Converted' THEN 3
           WHEN 'Student' THEN 4
           WHEN 'Disqualified' THEN 5
           ELSE 6
         END`
      )
      .all();

    const totals = db
      .prepare(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status IN ('Lead','Qualified') THEN 1 ELSE 0 END) as active,
           SUM(CASE WHEN status = 'Student' THEN 1 ELSE 0 END) as converted,
           SUM(CASE WHEN error_count > 0 THEN 1 ELSE 0 END) as errors
         FROM lead_sync`
      )
      .get();

    return sendSuccess(res, { pipeline, totals });
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};

// ---------------------------------------------------------------------------
// POST /api/leads/retry-failed
// Retry failed CRM syncs
// ---------------------------------------------------------------------------

export const retryFailed = async (req, res) => {
  try {
    const result = await crmService.retryFailedCrmCalls();
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, `Internal error: ${err.message}`, 500);
  }
};
