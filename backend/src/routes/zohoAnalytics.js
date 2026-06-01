/**
 * Zoho Analytics Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { syncEduCloudData, getEmbedUrl, getViews } from "../services/zohoAnalyticsService.js";
import { getUsers, getCourses } from "../data/store.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Sync data from EduCloud to Zoho Analytics (Admin)
router.post("/sync", auth, requireRole("Admin"), async (req, res) => {
  try {
    const users = getUsers();
    const courses = getCourses();
    const result = await syncEduCloudData(users, courses);
    return sendSuccess(res, { message: "Đồng bộ hoàn tất.", result });
  } catch (error) {
    return sendError(res, `Lỗi đồng bộ: ${error.message}`, 500);
  }
});

// Get embed URL for a view/dashboard (Admin)
router.get("/embed/:viewId", auth, requireRole("Admin"), async (req, res) => {
  try {
    const result = await getEmbedUrl(req.params.viewId);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy embed URL: ${error.message}`, 500);
  }
});

// Get available views (Admin)
router.get("/views", auth, requireRole("Admin"), async (req, res) => {
  try {
    const result = await getViews();
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy views: ${error.message}`, 500);
  }
});

export default router;
