import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { zohoSign } from "../api/zohoApi.js";

const STATUS_MAP = {
  completed: { label: "Đã ký", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
  pending: { label: "Đang chờ", cls: "border-amber-500/40 bg-amber-500/10 text-amber-200" },
  expired: { label: "Hết hạn", cls: "border-rose-500/40 bg-rose-500/10 text-rose-200" },
};

const ZohoSign = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ signerEmail: "", signerName: "", documentName: "" });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await zohoSign.getRequests();
      setRequests(res.data?.data?.requests || []);
    } catch (error) {
      toast.error("Lỗi tải danh sách: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!draft.signerEmail || !draft.signerName) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setIsCreating(true);
    try {
      await zohoSign.createRequest(draft);
      toast.success("Yêu cầu ký đã gửi!");
      setShowForm(false);
      setDraft({ signerEmail: "", signerName: "", documentName: "" });
      fetchRequests();
    } catch (error) {
      toast.error("Lỗi gửi yêu cầu: " + (error.response?.data?.error || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (requestId) => {
    try {
      const res = await zohoSign.download(requestId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-${requestId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Lỗi tải tài liệu: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO SIGN</p>
          <h2 className="text-lg font-semibold text-white">Ký số tài liệu</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          {showForm ? "Đóng" : "Tạo yêu cầu ký"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-rose-500/20 bg-slate-900/60 p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Tên tài liệu</label>
              <input
                value={draft.documentName}
                onChange={(e) => setDraft({ ...draft, documentName: e.target.value })}
                placeholder="Chứng chỉ tốt nghiệp"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-rose-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Email người ký *</label>
              <input
                type="email"
                value={draft.signerEmail}
                onChange={(e) => setDraft({ ...draft, signerEmail: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-rose-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Tên người ký *</label>
              <input
                value={draft.signerName}
                onChange={(e) => setDraft({ ...draft, signerName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-rose-500/50 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {isCreating ? "Đang gửi..." : "Gửi yêu cầu ký"}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Chưa có yêu cầu ký nào.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {requests.map((req) => {
              const status = STATUS_MAP[req.request_status] || STATUS_MAP.pending;
              return (
                <div key={req.request_id} className="flex items-center justify-between px-5 py-4 transition hover:bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-200">{req.request_name || "Tài liệu"}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {req.action_time ? new Date(req.action_time).toLocaleDateString("vi-VN") : ""}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs ${status.cls}`}>
                      {status.label}
                    </span>
                    {req.request_status === "completed" && (
                      <button
                        onClick={() => handleDownload(req.request_id)}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/5"
                      >
                        Tải xuống
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZohoSign;
