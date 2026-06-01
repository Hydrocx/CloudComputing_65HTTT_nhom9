import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { zohoDesk } from "../api/zohoApi.js";

const STATUS_COLORS = {
  Open: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  "In Progress": "border-blue-500/40 bg-blue-500/10 text-blue-200",
  Closed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
};

const ZohoDeskTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState({ subject: "", description: "", category: "General" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await zohoDesk.getTickets();
      setTickets(res.data?.data?.data || []);
    } catch (error) {
      toast.error("Lỗi tải tickets: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!draft.subject || !draft.description) {
      toast.error("Vui lòng nhập tiêu đề và mô tả.");
      return;
    }

    setIsCreating(true);
    try {
      await zohoDesk.createTicket(draft);
      toast.success("Ticket đã tạo thành công!");
      setDraft({ subject: "", description: "", category: "General" });
      setShowForm(false);
      fetchTickets();
    } catch (error) {
      toast.error("Lỗi tạo ticket: " + (error.response?.data?.error || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO DESK</p>
          <h2 className="text-lg font-semibold text-white">Hỗ trợ kỹ thuật</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          {showForm ? "Đóng" : "Tạo Ticket mới"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Tiêu đề *</label>
            <input
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              placeholder="Mô tả ngắn gọn vấn đề..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-green-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Danh mục</label>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-green-500/50 focus:outline-none"
            >
              <option value="General">Chung</option>
              <option value="Video">Lỗi xem video</option>
              <option value="Payment">Lỗi thanh toán</option>
              <option value="Account">Tài khoản</option>
              <option value="Course">Khóa học</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Mô tả chi tiết *</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-green-500/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
          >
            {isCreating ? "Đang gửi..." : "Gửi Ticket"}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Chưa có ticket nào. Tạo ticket mới nếu cần hỗ trợ.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between px-5 py-4 transition hover:bg-white/5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-200">{ticket.subject}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{ticket.description?.slice(0, 100)}</p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${STATUS_COLORS[ticket.status] || STATUS_COLORS.Open}`}>
                    {ticket.status || "Mở"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {ticket.createdTime ? new Date(ticket.createdTime).toLocaleDateString("vi-VN") : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZohoDeskTickets;
