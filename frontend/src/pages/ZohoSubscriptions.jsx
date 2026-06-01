import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { zohoSubscription } from "../api/zohoApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const PLAN_ICONS = { basic: "🌱", pro: "⚡", premium: "👑" };

const ZohoSubscriptions = () => {
  const { role } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.allSettled([
        zohoSubscription.getPlans(),
        role === "Admin" ? zohoSubscription.list() : Promise.resolve({ data: { data: [] } }),
      ]);

      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value?.data?.data?.plans || plansRes.value?.data?.data || []);
      }
      if (subsRes.status === "fulfilled") {
        setSubscriptions(subsRes.value?.data?.data?.subscriptions || subsRes.value?.data?.data || []);
      }
    } catch (error) {
      toast.error("Lỗi tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planCode) => {
    try {
      await zohoSubscription.create({ planCode });
      toast.success("Đăng ký gói thành công!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi đăng ký: " + (error.response?.data?.error || error.message));
    }
  };

  const handleCancel = async (subscriptionId) => {
    try {
      await zohoSubscription.cancel(subscriptionId);
      toast.success("Đã yêu cầu hủy gói.");
      fetchData();
    } catch (error) {
      toast.error("Lỗi hủy gói: " + (error.response?.data?.error || error.message));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">Đang tải...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO SUBSCRIPTIONS</p>
        <h2 className="text-lg font-semibold text-white">Gói học phí định kỳ</h2>
        <p className="mt-1 text-sm text-slate-400">Chọn gói phù hợp để truy cập toàn bộ kho khóa học</p>
      </div>

      {/* Plans grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.length > 0
          ? plans.map((plan, idx) => {
              const icon = Object.values(PLAN_ICONS)[idx] || "📦";
              return (
                <div
                  key={plan.plan_code || idx}
                  className={`relative rounded-2xl border p-6 transition-all hover:scale-[1.02] ${
                    idx === 1
                      ? "border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10 shadow-lg shadow-violet-500/10"
                      : "border-white/10 bg-slate-900/60"
                  }`}
                >
                  {idx === 1 && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-0.5 text-xs font-semibold text-white">
                      Phổ biến
                    </span>
                  )}
                  <div className="text-center">
                    <span className="text-3xl">{icon}</span>
                    <h3 className="mt-3 text-lg font-semibold text-white">{plan.name || `Gói ${idx + 1}`}</h3>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {plan.recurring_price || plan.price || "—"}
                      <span className="text-sm font-normal text-slate-400">/{plan.interval === "monthly" ? "tháng" : "năm"}</span>
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{plan.description || ""}</p>
                  </div>
                  <button
                    onClick={() => handleSubscribe(plan.plan_code)}
                    className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      idx === 1
                        ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
                        : "border border-white/10 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    Đăng ký
                  </button>
                </div>
              );
            })
          : [
              { name: "Cơ bản", price: "199.000đ", interval: "tháng", icon: "🌱", features: ["Truy cập 10 khóa", "Hỗ trợ email"] },
              { name: "Nâng cao", price: "399.000đ", interval: "tháng", icon: "⚡", features: ["Toàn bộ khóa học", "Live class", "Hỗ trợ ưu tiên"] },
              { name: "Premium", price: "3.499.000đ", interval: "năm", icon: "👑", features: ["Tất cả tính năng", "Chứng chỉ", "1-on-1 mentor"] },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl border p-6 transition-all hover:scale-[1.02] ${
                  idx === 1
                    ? "border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10 shadow-lg shadow-violet-500/10"
                    : "border-white/10 bg-slate-900/60"
                }`}
              >
                {idx === 1 && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-0.5 text-xs font-semibold text-white">
                    Phổ biến
                  </span>
                )}
                <div className="text-center">
                  <span className="text-3xl">{plan.icon}</span>
                  <h3 className="mt-3 text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {plan.price}
                    <span className="text-sm font-normal text-slate-400">/{plan.interval}</span>
                  </p>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    idx === 1
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
                      : "border border-white/10 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Đăng ký
                </button>
              </div>
            ))}
      </div>

      {/* Subscriptions list for Admin */}
      {role === "Admin" && subscriptions.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-200">Danh sách đăng ký</h3>
          </div>
          <div className="divide-y divide-white/5">
            {subscriptions.map((sub) => (
              <div key={sub.subscription_id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm text-slate-200">{sub.customer?.display_name || "—"}</p>
                  <p className="text-xs text-slate-400">{sub.plan?.name || "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    sub.status === "live"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-500/40 bg-slate-500/10 text-slate-400"
                  }`}>
                    {sub.status || "—"}
                  </span>
                  <button
                    onClick={() => handleCancel(sub.subscription_id)}
                    className="rounded-full border border-rose-500/40 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZohoSubscriptions;
