import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { zohoCrm } from "../api/zohoApi.js";

const ZohoCrmLeads = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await zohoCrm.getLeads();
      setLeads(res.data?.data?.data || []);
    } catch (error) {
      toast.error("Lỗi tải leads: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async (leadId) => {
    try {
      await zohoCrm.convertLead(leadId);
      toast.success("Đã chuyển đổi lead thành công!");
      fetchLeads();
    } catch (error) {
      toast.error("Lỗi chuyển đổi: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO CRM</p>
          <h2 className="text-lg font-semibold text-white">Danh sách Lead</h2>
        </div>
        <button
          onClick={fetchLeads}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
        >
          Làm mới
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Chưa có lead nào. Dữ liệu sẽ xuất hiện khi có người đăng ký tư vấn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">Tên</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">Email</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">SĐT</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">Nguồn</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-200">{lead.Last_Name || lead.Full_Name || "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.Email || "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.Phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                        {lead.Lead_Source || "Web"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleConvert(lead.id)}
                        className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/10"
                      >
                        Chuyển đổi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZohoCrmLeads;
