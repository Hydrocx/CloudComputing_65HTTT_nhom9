/**
 * Zoho Mail Service
 * Send transactional emails via Zoho Mail API.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

/**
 * Send an email via Zoho Mail API.
 * @param {{ to: string, subject: string, htmlBody: string }} params
 */
export const sendEmail = async ({ to, subject, htmlBody }) => {
  const url = `${zohoConfig.mail.apiBase}/messages`;

  const payload = {
    fromAddress: zohoConfig.mail.fromEmail,
    toAddress: to,
    subject,
    content: htmlBody,
    mailFormat: "html",
  };

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Send account activation email.
 */
export const sendActivationEmail = async (user) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
      <h1 style="color: #38bdf8; font-size: 24px; margin-bottom: 16px;">🎓 Chào mừng đến EduCloud!</h1>
      <p style="font-size: 16px; line-height: 1.6;">Xin chào <strong>${user.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
        Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập và bắt đầu khám phá các khóa học ngay bây giờ.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="https://educloud-online.tech" style="display: inline-block; padding: 12px 32px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Đăng nhập ngay
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 32px;">
        © 2026 EduCloud — Nền tảng học trực tuyến
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: "🎓 Chào mừng đến EduCloud — Tài khoản đã kích hoạt!",
    htmlBody: html,
  });
};

/**
 * Send enrollment confirmation email.
 */
export const sendEnrollmentConfirmation = async (user, course) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
      <h1 style="color: #38bdf8; font-size: 24px; margin-bottom: 16px;">✅ Đăng ký khóa học thành công!</h1>
      <p style="font-size: 16px; line-height: 1.6;">Xin chào <strong>${user.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
        Bạn đã đăng ký thành công khóa học:
      </p>
      <div style="margin: 16px 0; padding: 16px; background: #1e293b; border-radius: 12px; border-left: 4px solid #0ea5e9;">
        <h3 style="color: #f1f5f9; margin: 0 0 8px 0;">${course.title}</h3>
        <p style="color: #94a3b8; margin: 0; font-size: 13px;">${course.description}</p>
        <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">Giảng viên: ${course.teacherEmail}</p>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 32px;">
        © 2026 EduCloud — Nền tảng học trực tuyến
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `✅ Đăng ký thành công: ${course.title}`,
    htmlBody: html,
  });
};

/**
 * Send tuition receipt email.
 */
export const sendTuitionReceipt = async (user, invoice) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
      <h1 style="color: #38bdf8; font-size: 24px; margin-bottom: 16px;">🧾 Biên lai học phí</h1>
      <p style="font-size: 16px; line-height: 1.6;">Xin chào <strong>${user.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
        Thanh toán của bạn đã được ghi nhận. Dưới đây là chi tiết biên lai:
      </p>
      <div style="margin: 16px 0; padding: 16px; background: #1e293b; border-radius: 12px;">
        <p style="color: #f1f5f9; margin: 0;">Mã hóa đơn: <strong>${invoice.invoiceId}</strong></p>
        <p style="color: #94a3b8; margin: 8px 0 0 0;">Tổng tiền: <strong style="color: #4ade80;">${invoice.total}</strong></p>
        <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">Ngày: ${invoice.date}</p>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 32px;">
        © 2026 EduCloud — Nền tảng học trực tuyến
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `🧾 Biên lai học phí — ${invoice.invoiceId}`,
    htmlBody: html,
  });
};
