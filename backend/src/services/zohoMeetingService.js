/**
 * Zoho Meeting Service
 * Create and manage online live classes.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

/**
 * Create a new meeting/live class.
 */
export const createMeeting = async ({ topic, startTime, duration, presenter }) => {
  const url = `${zohoConfig.meeting.apiBase}/sessions.json`;

  const payload = {
    session: {
      topic,
      start_time: startTime, // ISO 8601 format
      duration: duration || 60, // minutes
      timezone: "Asia/Ho_Chi_Minh",
      presenter: presenter || zohoConfig.meeting.zsoid,
      type: "meeting",
    },
  };

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Get list of meetings.
 */
export const getMeetings = async () => {
  const url = `${zohoConfig.meeting.apiBase}/sessions.json`;

  return zohoFetch(url);
};

/**
 * Get meeting details by key.
 */
export const getMeetingById = async (meetingKey) => {
  const url = `${zohoConfig.meeting.apiBase}/sessions/${meetingKey}.json`;

  return zohoFetch(url);
};

/**
 * Get join URL for a meeting.
 */
export const getMeetingJoinUrl = async (meetingKey) => {
  const details = await getMeetingById(meetingKey);
  return {
    joinUrl: details?.session?.join_url || null,
    presenterUrl: details?.session?.presenter_url || null,
    meetingKey,
  };
};

/**
 * Delete a meeting.
 */
export const deleteMeeting = async (meetingKey) => {
  const url = `${zohoConfig.meeting.apiBase}/sessions/${meetingKey}.json`;

  return zohoFetch(url, { method: "DELETE" });
};
