import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";

const TABS = [
  { key: "activation", label: "Kích hoạt" },
  { key: "enrollment", label: "Ghi danh" },
  { key: "receipt", label: "Hóa đơn" },
  { key: "logs", label: "Nhật ký" },
];

const EmailTest = () => {
  const [activeTab, setActiveTab] = useState("activation");
  // ── Form state ──
  const [email, setEmail] = useState("minh.sinhvien@educloud.vn");
  const [name, setName] = useState("Sinh viên Minh");
  const [courseTitle, setCourseTitle] = useState("Kiến trúc GCS cơ bản");
  const [courseId, setCourseId] = useState("course-001");
  const [amount, setAmount] = useState("500,000 VND");
  const [method, setMethod] = useState("Chuyển khoản");
  const [txnId, setTxnId] = useState("TXN-" + Date.now().toString(36).toUpperCase());

  // ── Logs ──
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [sending, setSending] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data } = await client.get("/email/logs?limit=20");
      if (data.success) setLogs(data.data.logs);
    } catch (err) {
      // ignore
    }
    setLoadingLogs(false);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await client.get("/email/stats");
      if (data.success) setStats(data.data.totals);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
      fetchStats();
    }
  }, [activeTab, fetchLogs, fetchStats]);

  // ── Handlers ──
  const handleActivation = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await client.post("/email/send-activation", { email, name });
      if (data.success) {
        toast.success(`✅ Email kích hoạt đã gửi đến ${email}`);
      } else {
        toast.error(data.error || "Gửi thất bại");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
    setSending(false);
  };

  const handleEnrollment = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await client.post("/email/send-enrollment", {
        email, name, courseId, courseTitle, courseDescription: "Khóa học demo về GCS",
      });
      if (data.success) {
        toast.success(`✅ Email ghi danh đã gửi đến ${email}`);
      } else {
        toast.error(data.error || "Gửi thất bại");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
    setSending(false);
  };

  const handleReceipt = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await client.post("/email/send-receipt", {
        email, name, courseId, courseTitle, amount, method, transactionId: txnId,
      });
      if (data.success) {
        toast.success(`✅ Hóa đơn ${data.data.invoiceNo} đã gửi đến ${email}`);
      } else {
        toast.error(data.error || "Gửi thất bại");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
    setSending(false);
  };

  const handleRetry = async () => {
    try {
      const { data } = await client.post("/email/retry-failed");
      if (data.success) {
        toast.success(`✅ Đã thử lại: ${data.data.succeeded} thành công, ${data.data.failed} thất bại`);
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  const statusBadge = (status) => {
    const colors = { sent: "bg-green-600", failed: "bg-red-600", pending: "bg-yellow-600" };
    return <span className={`rounded-full px-2 py-0.5 text-xs text-white ${colors[status] || "bg-gray-600"}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tổng", value: stats?.total ?? "-", color: "text-sky-300" },
          { label: "Đã gửi", value: stats?.sent ?? "-", color: "text-green-300" },
          { label: "Thất bại", value: stats?.failed ?? "-", color: "text-red-300" },
          { label: "Chờ", value: stats?.pending ?? "-", color: "text-yellow-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-center">
            <p className="text-2xl font-bold ${s.color}">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === t.key
                ? "bg-sky-500/20 text-sky-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Activation Tab ── */}
      {activeTab === "activation" && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="mb-1 text-lg font-semibold">Gửi email kích hoạt tài khoản</h3>
          <p className="mb-4 text-xs text-slate-400">Token JWT có hiệu lực 24h</p>
          <form onSubmit={handleActivation} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-400">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-slate-400">Tên người dùng</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" required />
              </div>
            </div>
            <button type="submit" disabled={sending}
              className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50">
              {sending ? "Đang gửi..." : "Gửi email kích hoạt"}
            </button>
          </form>
        </div>
      )}

      {/* ── Enrollment Tab ── */}
      {activeTab === "enrollment" && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="mb-4 text-lg font-semibold">Gửi email xác nhận ghi danh</h3>
          <form onSubmit={handleEnrollment} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-400">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-slate-400">Tên</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-slate-400">Mã khóa học</label>
                <input value={courseId} onChange={(e) => setCourseId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Tên khóa học</label>
                <input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" />
              </div>
            </div>
            <button type="submit" disabled={sending}
              className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50">
              {sending ? "Đang gửi..." : "Gửi email ghi danh"}
            </button>
          </form>
        </div>
      )}

      {/* ── Receipt Tab ── */}
      {activeTab === "receipt" && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="mb-4 text-lg font-semibold">Gửi email hóa đơn thanh toán</h3>
          <p className="mb-4 text-xs text-slate-400">Số hóa đơn tự động: INV-YYYYMMDD-XXX</p>
          <form onSubmit={handleReceipt} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-400">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-slate-400">Tên</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-slate-400">Khóa học</label>
                <input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Số tiền</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Phương thức</label>
                <input value={method} onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Mã GD</label>
                <input value={txnId} onChange={(e) => setTxnId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm" />
              </div>
              <input value={courseId} onChange={(e) => setCourseId(e.target.value)} type="hidden" />
            </div>
            <button type="submit" disabled={sending}
              className="rounded-full bg-violet-500 px-6 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50">
              {sending ? "Đang gửi..." : "Gửi email hóa đơn"}
            </button>
          </form>
        </div>
      )}

      {/* ── Logs Tab ── */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nhật ký email</h3>
            <div className="flex gap-3">
              <button onClick={fetchLogs} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-slate-300 hover:bg-white/5">
                {loadingLogs ? "..." : "⟳ Làm mới"}
              </button>
              <button onClick={handleRetry} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-amber-300 hover:bg-white/5">
                🔁 Thử lại thất bại
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-slate-900/80 text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Người nhận</th>
                  <th className="px-4 py-3">Chủ đề</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Số HĐ</th>
                  <th className="px-4 py-3">Lỗi</th>
                  <th className="px-4 py-3">Lần thử</th>
                  <th className="px-4 py-3">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Chưa có email nào</td></tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-2.5 text-xs text-slate-400">{log.id}</td>
                    <td className="px-4 py-2.5 text-xs">{log.type}</td>
                    <td className="px-4 py-2.5">{log.recipient}</td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-slate-300">{log.subject}</td>
                    <td className="px-4 py-2.5">{statusBadge(log.status)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{log.invoice_no || "-"}</td>
                    <td className="max-w-[150px] truncate px-4 py-2.5 text-xs text-red-400">{log.error || "-"}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{log.retry_count}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{log.created_at?.slice(0, 19) || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTest;
