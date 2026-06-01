import { useState } from "react";
import toast from "react-hot-toast";
import { zohoAnalytics } from "../api/zohoApi.js";

const DASHBOARD_VIEWS = [
  { id: "revenue", label: "Doanh thu theo mùa", icon: "💰" },
  { id: "dropout", label: "Tỷ lệ bỏ học", icon: "📉" },
  { id: "teacher", label: "Hiệu quả giảng viên", icon: "👨‍🏫" },
  { id: "enrollment", label: "Xu hướng đăng ký", icon: "📈" },
];

const ZohoAnalytics = () => {
  const [selectedView, setSelectedView] = useState(DASHBOARD_VIEWS[0].id);
  const [embedUrl, setEmbedUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await zohoAnalytics.sync();
      toast.success("Đồng bộ dữ liệu thành công!");
    } catch (error) {
      toast.error("Lỗi đồng bộ: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadEmbed = async (viewId) => {
    setSelectedView(viewId);
    setIsLoadingEmbed(true);
    try {
      const res = await zohoAnalytics.getEmbedUrl(viewId);
      setEmbedUrl(res.data?.data?.embedUrl || res.data?.data?.embed_url || "");
    } catch (error) {
      setEmbedUrl("");
      toast.error("Lỗi tải dashboard: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoadingEmbed(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO ANALYTICS</p>
          <h2 className="text-lg font-semibold text-white">Báo cáo & Thống kê</h2>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
        >
          {isSyncing ? "Đang đồng bộ..." : "🔄 Đồng bộ dữ liệu"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => handleLoadEmbed(view.id)}
            className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] ${
              selectedView === view.id
                ? "border-teal-500/50 bg-teal-500/10 shadow-lg shadow-teal-500/10"
                : "border-white/10 bg-slate-900/60 hover:border-white/20"
            }`}
          >
            <span className="text-2xl">{view.icon}</span>
            <p className={`mt-2 text-sm font-medium ${selectedView === view.id ? "text-teal-200" : "text-slate-200"}`}>
              {view.label}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
        {isLoadingEmbed ? (
          <div className="flex h-96 items-center justify-center text-sm text-slate-400">
            Đang tải dashboard...
          </div>
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title="Zoho Analytics Dashboard"
            className="h-[600px] w-full border-0"
            allowFullScreen
          />
        ) : (
          <div className="flex h-96 flex-col items-center justify-center text-center">
            <span className="text-4xl">📊</span>
            <p className="mt-4 text-sm text-slate-400">
              Chọn một dashboard ở trên để hiển thị, hoặc cấu hình Zoho Analytics workspace trong .env
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Powered by Zoho Analytics AI (Zia)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZohoAnalytics;
