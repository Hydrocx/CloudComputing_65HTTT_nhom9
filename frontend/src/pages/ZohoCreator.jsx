import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { zohoCreator } from "../api/zohoApi.js";

const TABS = [
  { key: "equipment", label: "Quản lý thiết bị", icon: "🖥️" },
  { key: "hr", label: "Nhân sự", icon: "👤" },
  { key: "forms", label: "Form nhập liệu", icon: "📝" },
];

const ZohoCreator = () => {
  const [activeTab, setActiveTab] = useState("equipment");
  const [embedUrl, setEmbedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEmbed();
  }, [activeTab]);

  const loadEmbed = async () => {
    setIsLoading(true);
    try {
      const res = await zohoCreator.getEmbedUrl(activeTab);
      setEmbedUrl(res.data?.data?.embedUrl || "");
    } catch (error) {
      setEmbedUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO CREATOR</p>
        <h2 className="text-lg font-semibold text-white">Ứng dụng quản lý nội bộ</h2>
        <p className="mt-1 text-sm text-slate-400">
          Các ứng dụng low-code được xây dựng trên Zoho Creator
        </p>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-fuchsia-500 text-fuchsia-200"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
        {isLoading ? (
          <div className="flex h-[600px] items-center justify-center text-sm text-slate-400">
            Đang tải ứng dụng...
          </div>
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={`Zoho Creator — ${activeTab}`}
            className="h-[600px] w-full border-0"
            allowFullScreen
          />
        ) : (
          <div className="flex h-[600px] flex-col items-center justify-center text-center">
            <span className="text-4xl">🔧</span>
            <p className="mt-4 text-sm text-slate-400">
              Cấu hình Zoho Creator app trong .env để sử dụng tính năng này
            </p>
            <p className="mt-2 text-xs text-slate-500">
              ZOHO_CREATOR_OWNER và ZOHO_CREATOR_APP_NAME cần được thiết lập
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZohoCreator;
