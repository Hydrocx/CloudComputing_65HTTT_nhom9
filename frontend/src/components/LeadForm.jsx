import { useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";

const COURSES = [
  "Kiến trúc GCS cơ bản",
  "Cloud Storage nâng cao",
  "Bảo mật đám mây",
  "DevOps với GCP",
  "Kubernetes cơ bản",
];

const LeadForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    course_interest: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Vui lòng nhập họ tên và email");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await client.post("/leads", form);
      if (data.success) {
        toast.success("✅ Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm.");
        setSubmitted(true);
      } else {
        toast.error(data.error || "Đăng ký thất bại");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Lỗi kết nối");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h3 className="mt-4 text-xl font-semibold text-green-300">
          Đăng ký thành công!
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ qua email{" "}
          <strong className="text-slate-200">{form.email}</strong> trong thời
          gian sớm nhất.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", phone: "", course_interest: "" });
          }}
          className="mt-6 rounded-full border border-white/10 px-6 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          Đăng ký lại
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Họ tên */}
        <div>
          <label className="text-xs font-medium text-slate-400">
            Họ và tên <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-sky-500/50"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-medium text-slate-400">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-sky-500/50"
            required
          />
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="text-xs font-medium text-slate-400">
            Số điện thoại
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+84 912 345 678"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-sky-500/50"
          />
        </div>

        {/* Khóa học quan tâm */}
        <div>
          <label className="text-xs font-medium text-slate-400">
            Khóa học quan tâm
          </label>
          <select
            name="course_interest"
            value={form.course_interest}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-sky-500/50"
          >
            <option value="">-- Chọn khóa học --</option>
            {COURSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-blue-500 disabled:opacity-50"
      >
        {submitting ? "Đang gửi..." : "Đăng ký tư vấn"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Thông tin của bạn sẽ được gửi đến Zoho CRM để xử lý.
      </p>
    </form>
  );
};

export default LeadForm;
