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
  const url = `${zohoConfig.meeting.apiBase}/${zohoConfig.meeting.zsoid}/sessions.json`;

  const date = new Date(startTime);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = months[date.getMonth()];
  const d = date.getDate().toString().padStart(2, '0');
  const y = date.getFullYear();
  let h = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hStr = h.toString().padStart(2, '0');
  const formattedStartTime = `${m} ${d}, ${y} ${hStr}:${min} ${ampm}`;

  const payload = {
    session: {
      topic,
      startTime: formattedStartTime,
      duration: (duration || 60) * 60 * 1000, // milliseconds
      timezone: "Asia/Ho_Chi_Minh",
    },
  };

  if (presenter) {
    payload.session.presenter = presenter;
  }

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Get list of meetings.
 */
export const getMeetings = async () => {
  const url = `${zohoConfig.meeting.apiBase}/${zohoConfig.meeting.zsoid}/sessions.json`;

  return zohoFetch(url);
};

/**
 * Get meeting details by key.
 */
export const getMeetingById = async (meetingKey) => {
  const url = `${zohoConfig.meeting.apiBase}/${zohoConfig.meeting.zsoid}/sessions/${meetingKey}.json`;

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
  const url = `${zohoConfig.meeting.apiBase}/${zohoConfig.meeting.zsoid}/sessions/${meetingKey}.json`;

  return zohoFetch(url, { method: "DELETE" });
};
