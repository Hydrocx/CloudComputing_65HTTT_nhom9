import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { zohoInvoice } from "../api/zohoApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const ZohoInvoices = () => {
  const { role } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ customerEmail: "", customerName: "", itemName: "", rate: "" });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await zohoInvoice.list();
      setInvoices(res.data?.data?.invoices || res.data?.data || []);
    } catch (error) {
      toast.error("Lỗi tải hóa đơn: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!draft.customerEmail || !draft.customerName || !draft.itemName || !draft.rate) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setIsCreating(true);
    try {
      await zohoInvoice.create({
        customerEmail: draft.customerEmail,
        customerName: draft.customerName,
        items: [{ name: draft.itemName, rate: parseFloat(draft.rate), quantity: 1 }],
      });
      toast.success("Hóa đơn đã tạo!");
      setShowCreate(false);
      setDraft({ customerEmail: "", customerName: "", itemName: "", rate: "" });
      fetchInvoices();
    } catch (error) {
      toast.error("Lỗi tạo hóa đơn: " + (error.response?.data?.error || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadPdf = async (invoiceId) => {
    try {
      const res = await zohoInvoice.getPdf(invoiceId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Lỗi tải PDF: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ZOHO INVOICE</p>
          <h2 className="text-lg font-semibold text-white">Hóa đơn học phí</h2>
        </div>
        {role === "Admin" && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            {showCreate ? "Đóng" : "Tạo hóa đơn"}
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Tên khách hàng *</label>
              <input
                value={draft.customerName}
                onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Email *</label>
              <input
                type="email"
                value={draft.customerEmail}
                onChange={(e) => setDraft({ ...draft, customerEmail: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Tên khóa học *</label>
              <input
                value={draft.itemName}
                onChange={(e) => setDraft({ ...draft, itemName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Số tiền (VNĐ) *</label>
              <input
                type="number"
                value={draft.rate}
                onChange={(e) => setDraft({ ...draft, rate: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            {isCreating ? "Đang tạo..." : "Tạo hóa đơn"}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Chưa có hóa đơn nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">Mã HĐ</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">Khách hàng</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">Tổng tiền</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">Trạng thái</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-400">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.invoice_id || inv.id} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{inv.invoice_number || inv.invoice_id || inv.id}</td>
                    <td className="px-4 py-3 text-slate-200">{inv.customer_name || "—"}</td>
                    <td className="px-4 py-3 font-medium text-emerald-300">{inv.total || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                        {inv.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDownloadPdf(inv.invoice_id || inv.id)}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/5"
                      >
                        Tải PDF
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

export default ZohoInvoices;
