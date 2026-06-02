import { useEffect, useMemo, useState } from "react";
import client from "../api/client.js";
import StorageChart from "../components/StorageChart.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatBytes } from "../utils/formatBytes.js";
import useFiles from "../hooks/useFiles.js";
import useCourses from "../hooks/useCourses.js";

const Dashboard = () => {
  const { role } = useAuth();
  const { files, isLoading: isLoadingFiles } = useFiles();
  const { courses, isLoading: isLoadingCourses } = useCourses();
  const [userCount, setUserCount] = useState(null);
  const [signedLogs, setSignedLogs] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await client.get("/users");
        setUserCount(response.data.data.length);
      } catch (error) {
        setUserCount(null);
      }
    };

    if (role === "Admin") {
      fetchUsers();
    }
  }, [role]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await client.get("/signed-url/logs");
        setSignedLogs(response.data.data || []);
      } catch (error) {
        setSignedLogs([]);
      }
    };

    if (role !== "Student") {
      fetchLogs();
    }
  }, [role]);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + (file.size || 0), 0),
    [files]
  );

  const bucketStats = useMemo(() => {
    const buckets = [
      import.meta.env.VITE_BUCKET_VIDEOS || "educloud-videos-bucket",
      import.meta.env.VITE_BUCKET_DOCS || "educloud-docs-bucket",
      import.meta.env.VITE_BUCKET_LOGS || "educloud-logs-bucket",
    ];

    const map = new Map(
      buckets.map((bucket) => [bucket, { name: bucket, sizeGb: 0 }])
    );

    files.forEach((file) => {
      const entry = map.get(file.bucket) || { name: file.bucket, sizeGb: 0 };
      entry.sizeGb += file.size / 1e9;
      map.set(file.bucket, entry);
    });

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      sizeGb: Number(entry.sizeGb.toFixed(2)),
    }));
  }, [files]);

  const recentUploads = useMemo(() => {
    return [...files]
      .sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated))
      .slice(0, 5);
  }, [files]);

  const recentSigned = useMemo(() => {
    return signedLogs
      .filter((log) => log.action === "signed-url")
      .slice(0, 3);
  }, [signedLogs]);

  const courseLabel =
    role === "Teacher"
      ? "Khóa học của tôi"
      : role === "Student"
      ? "Khóa học đã đăng ký"
      : "Tổng khóa học";

  const stats = [
    {
      label: courseLabel,
      value: isLoadingCourses ? "..." : courses.length,
    },
    {
      label: "Tổng tệp",
      value: isLoadingFiles ? "..." : files.length,
    },
    {
      label: "Dung lượng sử dụng",
      value: isLoadingFiles ? "..." : formatBytes(totalSize),
    },
    {
      label: "Người dùng",
      value: role === "Admin" ? userCount ?? "-" : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
          >
            <p className="text-xs text-slate-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <StorageChart data={bucketStats} />
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Chu kỳ vòng đời</h3>
          <div className="mt-4 space-y-3">
            {[
              { label: "Standard", days: "0-30 ngày" },
              { label: "Nearline", days: "30-90 ngày" },
              { label: "Coldline", days: "90-365 ngày" },
              { label: "Archive", days: ">= 365 ngày" },
            ].map((step) => (
              <div
                key={step.label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2"
              >
                <span className="text-sm text-slate-200">{step.label}</span>
                <span className="text-xs text-slate-400">{step.days}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Hoạt động gần đây</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {recentUploads.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có tải lên.</p>
            ) : (
              recentUploads.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between border-b border-white/5 pb-2"
                >
                  <span>{file.name.split("/").pop()}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(file.timeCreated).toLocaleString("vi-VN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Signed URL gần đây</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {recentSigned.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có Signed URL.</p>
            ) : (
              recentSigned.map((log) => (
                <div
                  key={`${log.gcsPath}-${log.timestamp}`}
                  className="flex items-center justify-between border-b border-white/5 pb-2"
                >
                  <span>{log.gcsPath.split("/").pop()}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleString("vi-VN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Zoho Integration Quick Access */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">⚡ Zoho Integration</h3>
          <a
            href="#/zoho"
            className="text-xs text-sky-400 transition hover:text-sky-300"
          >
            Xem tất cả →
          </a>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { icon: "📧", label: "Mail", path: "#/zoho/mail", roles: ["Admin"] },
            { icon: "👥", label: "CRM", path: "#/zoho/crm", roles: ["Admin"] },
            { icon: "🎫", label: "Hỗ trợ", path: "#/zoho/desk" },
            { icon: "📄", label: "Hóa đơn", path: "#/zoho/invoice" },
            { icon: "✍️", label: "Ký số", path: "#/zoho/sign", roles: ["Admin", "Teacher"] },
            { icon: "📹", label: "Live", path: "#/zoho/meeting" },
            { icon: "📊", label: "Analytics", path: "#/zoho/analytics", roles: ["Admin"] },
            { icon: "💳", label: "Gói", path: "#/zoho/subscription" },
            { icon: "💬", label: "Cliq", path: "#/zoho/cliq", roles: ["Admin"] },
            { icon: "🔧", label: "Creator", path: "#/zoho/creator", roles: ["Admin"] },
          ]
            .filter((s) => !s.roles || s.roles.includes(role))
            .map((s) => (
              <a
                key={s.label}
                href={s.path}
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/5"
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </a>
            ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
