import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { zohoMeeting } from "../api/zohoApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const ZohoMeeting = () => {
  const { role } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ topic: "", startTime: "", duration: 60 });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const res = await zohoMeeting.list();
      setMeetings(res.data?.data?.session || res.data?.data || []);
    } catch (error) {
      toast.error("Lỗi tải lớp học: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!draft.topic || !draft.startTime) {
      toast.error("Vui lòng nhập chủ đề và thời gian.");
      return;
    }

    setIsCreating(true);
    try {
      await zohoMeeting.create({
        topic: draft.topic,
        startTime: new Date(draft.startTime).toISOString(),
        duration: parseInt(draft.duration),
      });
      toast.success("Lớp học đã tạo!");
      setShowForm(false);
      setDraft({ topic: "", startTime: "", duration: 60 });
      fetchMeetings();
    } catch (error) {
      toast.error("Lỗi tạo lớp học: " + (error.response?.data?.error || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (meetingKey) => {
    try {
      const res = await zohoMeeting.getJoinUrl(meetingKey);
      const joinUrl = res.data?.data?.joinUrl;
      if (joinUrl) {
        window.open(joinUrl, "_blank");
      } else {
        toast.error("Không tìm thấy link tham gia.");
      }
    } catch (error) {
      toast.error("Lỗi lấy link: " + (error.response?.data?.error || error.message));
    }
  };

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.start_time);
    const end = new Date(start.getTime() + (meeting.duration || 60) * 60000);

    if (now < start) return { label: "Sắp tới", cls: "border-sky-500/40 bg-sky-500/10 text-sky-200" };
    if (now >= start && now <= end) return { label: "Đang diễn ra", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 animate-pulse" };
    return { label: "Đã kết thúc", cls: "border-slate-500/40 bg-slate-500/10 text-slate-400" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO MEETING</p>
          <h2 className="text-lg font-semibold text-white">Lớp học trực tuyến</h2>
        </div>
        {role !== "Student" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            {showForm ? "Đóng" : "Tạo lớp mới"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-sky-500/20 bg-slate-900/60 p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Chủ đề *</label>
              <input
                value={draft.topic}
                onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                placeholder="Bài 5: Docker & Kubernetes"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-sky-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-sky-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Thời lượng (phút)</label>
              <select
                value={draft.duration}
                onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-sky-500/50 focus:outline-none"
              >
                <option value="30">30 phút</option>
                <option value="60">60 phút</option>
                <option value="90">90 phút</option>
                <option value="120">120 phút</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {isCreating ? "Đang tạo..." : "Tạo lớp học"}
          </button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <div className="col-span-2 rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : meetings.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
            Chưa có lớp học nào. {role !== "Student" ? "Tạo lớp mới để bắt đầu." : ""}
          </div>
        ) : (
          meetings.map((m) => {
            const status = getMeetingStatus(m);
            return (
              <div key={m.meeting_key || m.session_id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-100">{m.topic || "Lớp học"}</h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${status.cls}`}>
                    {status.label}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <p>📅 {m.start_time ? new Date(m.start_time).toLocaleString("vi-VN") : "—"}</p>
                  <p>⏱️ {m.duration || 60} phút</p>
                  <p>👤 {m.presenter || "—"}</p>
                </div>
                <button
                  onClick={() => handleJoin(m.meeting_key || m.session_id)}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-sky-600 hover:to-indigo-600"
                >
                  📹 Vào lớp
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ZohoMeeting;
