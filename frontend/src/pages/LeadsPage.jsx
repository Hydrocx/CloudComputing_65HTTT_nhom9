import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";
import LeadForm from "../components/LeadForm.jsx";

const STATUS_BADGE = {
  Lead: "bg-blue-600/30 text-blue-300",
  Qualified: "bg-amber-600/30 text-amber-300",
  Converted: "bg-purple-600/30 text-purple-300",
  Student: "bg-green-600/30 text-green-300",
  Disqualified: "bg-red-600/30 text-red-300",
};

const TABS = ["form", "pipeline"];

const LeadsPage = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        client.get("/leads?limit=50"),
        client.get("/leads/stats"),
      ]);
      if (leadsRes.data.success) setLeads(leadsRes.data.data.leads);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch {
      // not authenticated for pipeline view
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "pipeline") fetchLeads();
  }, [activeTab, fetchLeads]);

  const handleUpdateStatus = async (lead, newStatus) => {
    try {
      const id = lead.zoho_lead_id || lead.id;
      const { data } = await client.put(`/leads/${id}`, { status: newStatus });
      if (data.success) {
        toast.success(`✅ Cập nhật → ${newStatus}`);
        fetchLeads();
      } else {
        toast.error(data.error || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  const handleConvert = async (lead) => {
    if (!confirm(`Chuyển lead "${lead.name}" thành Student?`)) return;
    try {
      const id = lead.zoho_lead_id || lead.id;
      const { data } = await client.post(`/leads/${id}/convert`);
      if (data.success) {
        toast.success(`✅ Đã chuyển thành Student (user: ${data.data.userId})`);
        fetchLeads();
      } else {
        toast.error(data.error || "Chuyển đổi thất bại");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  const nextStatus = (current) => {
    const map = {
      Lead: "Qualified",
      Qualified: "Converted",
      Converted: "Student",
    };
    return map[current];
  };

  return (
    <div className="space-y-6">
      {/* Pipeline stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {stats.pipeline?.map((s) => (
            <div
              key={s.status}
              className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-center"
            >
              <p className="text-2xl font-bold text-white">{s.count}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                  STATUS_BADGE[s.status] || "bg-slate-600/30 text-slate-300"
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === t
                ? "bg-sky-500/20 text-sky-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t === "form" ? "📝 Đăng ký tư vấn" : "📊 Pipeline Lead"}
          </button>
        ))}
      </div>

      {/* ── Form Tab ── */}
      {activeTab === "form" && (
        <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="mb-1 text-lg font-semibold">Đăng ký tìm hiểu khóa học</h3>
          <p className="mb-6 text-xs text-slate-400">
            Thông tin sẽ được gửi đến Zoho CRM và xử lý tự động.
          </p>
          <LeadForm />
        </div>
      )}

      {/* ── Pipeline Tab ── */}
      {activeTab === "pipeline" && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-slate-900/80 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Điện thoại</th>
                <th className="px-4 py-3">Khóa học</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Zoho ID</th>
                <th className="px-4 py-3">Lỗi</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {loading ? "Đang tải..." : "Chưa có lead nào"}
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-2.5 font-medium">{lead.name}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-300">
                    {lead.email}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">
                    {lead.phone || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">
                    {lead.course_interest || "-"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        STATUS_BADGE[lead.status] || "bg-slate-600/30 text-slate-300"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="max-w-[100px] truncate px-4 py-2.5 text-xs text-slate-500">
                    {lead.zoho_lead_id || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-red-400">
                    {lead.error_count > 0 ? `${lead.error_count}x` : "-"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      {nextStatus(lead.status) && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(lead, nextStatus(lead.status))
                          }
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-sky-300 hover:bg-white/5"
                        >
                          → {nextStatus(lead.status)}
                        </button>
                      )}
                      {lead.status === "Converted" && (
                        <button
                          onClick={() => handleConvert(lead)}
                          className="rounded-full bg-green-600/30 px-3 py-1 text-xs text-green-300 hover:bg-green-600/50"
                        >
                          ➜ Student
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
