import { useState } from "react";
import toast from "react-hot-toast";
import { zohoCliq } from "../api/zohoApi.js";

const NOTIFICATION_TYPES = [
  { value: "general", label: "Thông báo chung", icon: "📢", color: "sky" },
  { value: "alert", label: "Cảnh báo hệ thống", icon: "🚨", color: "rose" },
  { value: "transaction", label: "Giao dịch mới", icon: "💰", color: "emerald" },
  { value: "course", label: "Khóa học mới", icon: "📚", color: "violet" },
];

const ZohoCliq = () => {
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo.");
      return;
    }

    const selected = NOTIFICATION_TYPES.find((t) => t.value === type);
    const fullMessage = `${selected.icon} [${selected.label}] ${message}`;

    setIsSending(true);
    try {
      await zohoCliq.notify({
        message: fullMessage,
        card: { title: selected.label, body: message },
      });
      toast.success("Thông báo đã gửi!");
      setHistory((prev) => [
        { type: selected.label, icon: selected.icon, message, time: new Date().toISOString() },
        ...prev,
      ]);
      setMessage("");
    } catch (error) {
      toast.error("Lỗi gửi: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSending(false);
    }
  };

  const handleTest = async () => {
    setIsSending(true);
    try {
      await zohoCliq.test();
      toast.success("Test notification đã gửi!");
    } catch (error) {
      toast.error("Lỗi test: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO CLIQ</p>
          <h2 className="text-lg font-semibold text-white">Thông báo nội bộ</h2>
        </div>
        <button
          onClick={handleTest}
          disabled={isSending}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          🧪 Test Webhook
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
        <div>
          <label className="mb-3 block text-xs font-medium text-slate-400">Loại thông báo</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {NOTIFICATION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  type === t.value
                    ? `border-${t.color}-500/50 bg-${t.color}-500/10 text-white`
                    : "border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <p className="mt-1 text-xs">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">Nội dung *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung thông báo gửi đến kênh Cliq..."
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-yellow-500/50 focus:outline-none"
          />
        </div>

        {message.trim() && (
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <p className="mb-1 text-xs font-medium text-slate-500">Xem trước:</p>
            <p className="text-sm text-slate-200">
              {NOTIFICATION_TYPES.find((t) => t.value === type)?.icon} [{NOTIFICATION_TYPES.find((t) => t.value === type)?.label}] {message}
            </p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={isSending}
          className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-yellow-600 hover:to-amber-600 disabled:opacity-50"
        >
          {isSending ? "Đang gửi..." : "💬 Gửi thông báo"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-200">Lịch sử gửi</h3>
          </div>
          <div className="divide-y divide-white/5">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{h.icon}</span>
                  <div>
                    <p className="text-sm text-slate-200">{h.message}</p>
                    <p className="text-xs text-slate-500">{h.type}</p>
                  </div>
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

export default ZohoCliq;
