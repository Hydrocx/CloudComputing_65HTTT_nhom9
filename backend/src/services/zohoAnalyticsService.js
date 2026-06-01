/**
 * Zoho Analytics Service
 * Sync data and embed analytics dashboards.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

/**
 * Push data rows to a Zoho Analytics table.
 */
export const pushData = async (tableName, rows) => {
  const url = `${zohoConfig.analytics.apiBase}/workspaces/${zohoConfig.analytics.workspaceId}/${tableName}?CONFIG={"importType":"APPEND"}`;

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(rows),
  });
};

/**
 * Get embed URL for a dashboard/view.
 */
export const getEmbedUrl = async (viewId) => {
  const url = `${zohoConfig.analytics.apiBase}/workspaces/${zohoConfig.analytics.workspaceId}/views/${viewId}/publish/embed`;

  return zohoFetch(url);
};

/**
 * Get list of available views/dashboards.
 */
export const getViews = async () => {
  const url = `${zohoConfig.analytics.apiBase}/workspaces/${zohoConfig.analytics.workspaceId}/views`;

  return zohoFetch(url);
};

/**
 * Sync EduCloud data to Zoho Analytics.
 * Exports users, courses, enrollments as structured rows.
 */
export const syncEduCloudData = async (users, courses) => {
  // Sync users table
  const userRows = users.map((u) => ({
    user_id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    courses_count: (u.courseIds || []).length,
    enrolled_count: (u.enrolledCourseIds || []).length,
  }));

  // Sync courses table
  const courseRows = courses.map((c) => ({
    course_id: c.id,
    title: c.title,
    teacher_email: c.teacherEmail,
    student_count: (c.studentEmails || []).length,
    created_at: c.createdAt,
  }));

  const results = {};

  try {
    results.users = await pushData("EduCloud_Users", userRows);
  } catch (err) {
    results.users = { error: err.message };
  }

  try {
    results.courses = await pushData("EduCloud_Courses", courseRows);
  } catch (err) {
    results.courses = { error: err.message };
  }

  return results;
};
