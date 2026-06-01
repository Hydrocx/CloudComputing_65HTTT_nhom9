import { useAuth } from "../context/AuthContext.jsx";
import { NavLink } from "react-router-dom";

const ZOHO_SERVICES = [
  {
    key: "mail",
    icon: "📧",
    label: "Zoho Mail",
    desc: "Gửi email tự động: kích hoạt tài khoản, thông báo đăng ký, biên lai học phí",
    path: "/zoho/mail",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    roles: ["Admin"],
  },
  {
    key: "crm",
    icon: "👥",
    label: "Zoho CRM",
    desc: "Quản lý vòng đời học viên: Lead → Tư vấn → Đăng ký chính thức",
    path: "/zoho/crm",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
    roles: ["Admin"],
  },
  {
    key: "desk",
    icon: "🎫",
    label: "Zoho Desk",
    desc: "Cổng hỗ trợ kỹ thuật: tạo ticket, theo dõi trạng thái xử lý",
    path: "/zoho/desk",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
    roles: null,
  },
  {
    key: "invoice",
    icon: "📄",
    label: "Zoho Invoice",
    desc: "Tự động xuất hóa đơn học phí, tính thuế, gửi PDF chuyên nghiệp",
    path: "/zoho/invoice",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    roles: null,
  },
  {
    key: "sign",
    icon: "✍️",
    label: "Zoho Sign",
    desc: "Ký số chứng chỉ & hợp đồng giảng viên trực tuyến",
    path: "/zoho/sign",
    color: "from-rose-500/20 to-red-500/20",
    border: "border-rose-500/30",
    roles: ["Admin", "Teacher"],
  },
  {
    key: "meeting",
    icon: "📹",
    label: "Zoho Meeting",
    desc: "Lớp học trực tuyến: lên lịch, bật camera, chia sẻ màn hình",
    path: "/zoho/meeting",
    color: "from-sky-500/20 to-indigo-500/20",
    border: "border-sky-500/30",
    roles: null,
  },
  {
    key: "analytics",
    icon: "📊",
    label: "Zoho Analytics",
    desc: "Báo cáo thông minh: doanh thu, tỷ lệ bỏ học, hiệu quả giảng viên",
    path: "/zoho/analytics",
    color: "from-teal-500/20 to-cyan-500/20",
    border: "border-teal-500/30",
    roles: ["Admin"],
  },
  {
    key: "subscription",
    icon: "💳",
    label: "Zoho Subscriptions",
    desc: "Quản lý gói học phí định kỳ: đăng ký, gia hạn, hủy gói",
    path: "/zoho/subscription",
    color: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
    roles: null,
  },
  {
    key: "cliq",
    icon: "💬",
    label: "Zoho Cliq",
    desc: "Thông báo nội bộ cho đội ngũ quản trị qua chat",
    path: "/zoho/cliq",
    color: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/30",
    roles: ["Admin"],
  },
  {
    key: "creator",
    icon: "🔧",
    label: "Zoho Creator",
    desc: "Ứng dụng nội bộ: quản lý thiết bị, nhân sự, form nhập liệu",
    path: "/zoho/creator",
    color: "from-fuchsia-500/20 to-pink-500/20",
    border: "border-fuchsia-500/30",
    roles: ["Admin"],
  },
];

const ZohoHub = () => {
  const { role } = useAuth();

  const visibleServices = ZOHO_SERVICES.filter(
    (s) => !s.roles || s.roles.includes(role)
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          HỆ SINH THÁI
        </p>
        <h2 className="text-lg font-semibold text-white">
          Zoho Integration Hub
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Quản lý tập trung tất cả dịch vụ Zoho được tích hợp vào EduCloud
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleServices.map((service, index) => (
          <NavLink
            key={service.key}
            to={service.path}
            className={`group relative overflow-hidden rounded-2xl border ${service.border} bg-gradient-to-br ${service.color} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{service.icon}</span>
                <h3 className="text-base font-semibold text-white">
                  {service.label}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {service.desc}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors group-hover:text-sky-300">
                <span>Truy cập</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default ZohoHub;
