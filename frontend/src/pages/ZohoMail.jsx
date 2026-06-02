import { useState } from "react";
import toast from "react-hot-toast";
import { zohoMail } from "../api/zohoApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const ZohoMail = () => {
  const { currentUser } = useAuth();
  const [draft, setDraft] = useState({ to: "", subject: "", htmlBody: "" });
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [sentHistory, setSentHistory] = useState([]);

  const TEMPLATES = [
    {
      key: "activation",
      label: "Kích hoạt tài khoản",
      icon: "🔑",
      subject: "🎓 Chào mừng đến EduCloud — Tài khoản đã kích hoạt!",
      body: `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
  <h1 style="color: #38bdf8;">🎓 Chào mừng đến EduCloud!</h1>
  <p>Tài khoản của bạn đã được kích hoạt thành công.</p>
  <div style="margin: 24px 0; text-align: center;">
    <a href="https://educloud-online.tech" style="padding: 12px 32px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Đăng nhập ngay</a>
  </div>
</div>`,
    },
    {
      key: "enrollment",
      label: "Xác nhận đăng ký",
      icon: "✅",
      subject: "✅ Đăng ký khóa học thành công!",
      body: `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
  <h1 style="color: #38bdf8;">✅ Đăng ký khóa học thành công!</h1>
  <p>Bạn đã đăng ký thành công khóa học trên EduCloud.</p>
  <div style="margin: 16px 0; padding: 16px; background: #1e293b; border-radius: 12px; border-left: 4px solid #0ea5e9;">
    <h3 style="color: #f1f5f9; margin: 0;">Tên khóa học</h3>
    <p style="color: #94a3b8; margin: 8px 0 0 0;">Mô tả khóa học</p>
  </div>
</div>`,
    },
    {
      key: "receipt",
      label: "Biên lai học phí",
      icon: "🧾",
      subject: "🧾 Biên lai học phí EduCloud",
      body: `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
  <h1 style="color: #38bdf8;">🧾 Biên lai học phí</h1>
  <p>Thanh toán của bạn đã được ghi nhận.</p>
  <div style="margin: 16px 0; padding: 16px; background: #1e293b; border-radius: 12px;">
    <p style="color: #f1f5f9;">Mã hóa đơn: <strong>INV-001</strong></p>
    <p style="color: #4ade80;">Tổng tiền: <strong>499.000đ</strong></p>
  </div>
</div>`,
    },
  ];

  const handleSelectTemplate = (template) => {
    setDraft({
      ...draft,
      subject: template.subject,
      htmlBody: template.body,
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.to || !draft.subject || !draft.htmlBody) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setIsSending(true);
    try {
      await zohoMail.send(draft);
      toast.success("Email đã gửi thành công!");
      setSentHistory((prev) => [
        { to: draft.to, subject: draft.subject, time: new Date().toISOString() },
        ...prev,
      ]);
      setDraft({ to: "", subject: "", htmlBody: "" });
    } catch (error) {
      toast.error("Lỗi gửi email: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSending(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await zohoMail.test();
      toast.success(`Email test đã gửi tới ${currentUser?.email || "admin"}`);
    } catch (error) {
      toast.error("Lỗi gửi test: " + (error.response?.data?.error || error.message));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO MAIL</p>
          <h2 className="text-lg font-semibold text-white">Gửi Email tự động</h2>
          <p className="mt-1 text-sm text-slate-400">
            Gửi email kích hoạt, thông báo đăng ký, biên lai học phí qua Zoho Mail API
          </p>
        </div>
        <button
          onClick={handleTest}
          disabled={isTesting}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          {isTesting ? "Đang gửi..." : "🧪 Gửi Email Test"}
        </button>
      </div>

      {/* Template selector */}
      <div>
        <p className="mb-3 text-xs font-medium text-slate-400">Mẫu email có sẵn:</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => handleSelectTemplate(t)}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-left transition-all hover:scale-[1.02] hover:border-blue-500/30 hover:bg-blue-500/5"
            >
              <span className="text-2xl">{t.icon}</span>
              <p className="mt-2 text-sm font-medium text-slate-200">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Email form */}
      <form onSubmit={handleSend} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">Người nhận (Email) *</label>
          <input
            type="email"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            placeholder="student@example.com"
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">Tiêu đề *</label>
          <input
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            placeholder="Tiêu đề email..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">Nội dung HTML *</label>
          <textarea
            value={draft.htmlBody}
            onChange={(e) => setDraft({ ...draft, htmlBody: e.target.value })}
            placeholder="<h1>Nội dung email...</h1>"
            rows={8}
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 transition focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
        </div>

        {/* Preview */}
        {draft.htmlBody && (
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Xem trước:</p>
            <div
              className="rounded-xl border border-white/10 bg-white p-4"
              dangerouslySetInnerHTML={{ __html: draft.htmlBody }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
        >
          {isSending ? "Đang gửi..." : "📧 Gửi Email"}
        </button>
      </form>

      {/* Sent history */}
      {sentHistory.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-200">Email đã gửi</h3>
          </div>
          <div className="divide-y divide-white/5">
            {sentHistory.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-slate-200">{h.subject}</p>
                  <p className="text-xs text-slate-400">→ {h.to}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(h.time).toLocaleTimeString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZohoMail;
