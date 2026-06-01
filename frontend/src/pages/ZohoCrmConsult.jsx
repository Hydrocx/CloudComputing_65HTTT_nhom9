import { useState } from "react";
import toast from "react-hot-toast";
import { zohoCrm } from "../api/zohoApi.js";

const ZohoCrmConsult = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", courseInterest: "" });
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Vui lòng nhập họ tên và email.");
      return;
    }

    setIsSending(true);
    try {
      await zohoCrm.createLead(form);
      setIsSuccess(true);
      toast.success("Đăng ký tư vấn thành công!");
    } catch (error) {
      toast.error("Lỗi gửi thông tin: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
            ✅
          </div>
          <h2 className="text-xl font-semibold text-white">Đã gửi thành công!</h2>
          <p className="mt-3 text-sm text-slate-300">
            Thông tin của bạn đã được ghi nhận. Đội ngũ tuyển sinh sẽ liên hệ trong thời gian sớm nhất.
          </p>
          <button
            onClick={() => { setIsSuccess(false); setForm({ name: "", email: "", phone: "", courseInterest: "" }); }}
            className="mt-6 rounded-full border border-white/10 px-6 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            Gửi lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO CRM</p>
        <h2 className="text-lg font-semibold text-white">Đăng ký tư vấn khóa học</h2>
        <p className="mt-1 text-sm text-slate-400">
          Điền thông tin để nhận tư vấn từ đội ngũ tuyển sinh EduCloud
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Họ và tên *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Số điện thoại</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0901 234 567"
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Khóa học quan tâm</label>
            <select
              value={form.courseInterest}
              onChange={(e) => setForm({ ...form, courseInterest: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
            >
              <option value="">— Chọn khóa học —</option>
              <option value="cloud-computing">Cloud Computing cơ bản</option>
              <option value="devops">DevOps & CI/CD</option>
              <option value="data-engineering">Data Engineering</option>
              <option value="ai-ml">AI & Machine Learning</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
        >
          {isSending ? "Đang gửi..." : "Gửi đăng ký tư vấn"}
        </button>
      </form>
    </div>
  );
};

export default ZohoCrmConsult;
