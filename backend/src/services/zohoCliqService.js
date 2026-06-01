/**
 * Zoho Cliq Service
 * Send internal notifications to admin team via webhooks.
 */

import zohoConfig from "../config/zoho.js";

/**
 * Send a notification message to Zoho Cliq channel.
 * Uses Incoming Webhook (no OAuth needed).
 */
export const sendNotification = async ({ message, card }) => {
  const webhookUrl = zohoConfig.cliq.webhookUrl;

  if (!webhookUrl) {
    throw new Error("ZOHO_CLIQ_WEBHOOK_URL is not configured.");
  }

  const payload = card
    ? {
        text: message,
        card: {
          title: card.title || "EduCloud Notification",
          theme: card.theme || "modern-inline",
          thumbnail: card.thumbnail || "",
        },
        slides: [
          {
            type: "text",
            data: card.body || message,
          },
        ],
      }
    : { text: message };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cliq webhook failed [${response.status}]: ${errorBody}`);
  }

  return { sent: true, timestamp: new Date().toISOString() };
};

/**
 * Pre-built notification templates for common events.
 */
export const notifyNewCourse = async (course) => {
  return sendNotification({
    message: `📚 Khóa học mới được duyệt: *${course.title}*`,
    card: {
      title: "Khóa học mới",
      body: `Giảng viên: ${course.teacherEmail}\nMô tả: ${course.description}`,
    },
  });
};

export const notifySystemAlert = async (alertMessage) => {
  return sendNotification({
    message: `🚨 Cảnh báo hệ thống: ${alertMessage}`,
    card: {
      title: "Cảnh báo hệ thống",
      theme: "modern-inline",
      body: alertMessage,
    },
  });
};

export const notifyHighValueTransaction = async (transaction) => {
  return sendNotification({
    message: `💰 Giao dịch giá trị cao: ${transaction.amount} — ${transaction.customerEmail}`,
    card: {
      title: "Giao dịch mới",
      body: `Khách hàng: ${transaction.customerEmail}\nSố tiền: ${transaction.amount}\nKhóa học: ${transaction.courseName || "N/A"}`,
    },
  });
};
