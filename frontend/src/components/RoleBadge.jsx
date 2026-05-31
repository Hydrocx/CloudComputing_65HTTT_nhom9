const ROLE_STYLES = {
  Admin: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  Teacher: "bg-sky-500/20 text-sky-200 border-sky-500/40",
  Student: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
};

const ROLE_LABELS = {
  Admin: "Quản trị",
  Teacher: "Giảng viên",
  Student: "Sinh viên",
  Guest: "Khách",
};

const RoleBadge = ({ role }) => {
  const style = ROLE_STYLES[role] || "bg-slate-500/20 text-slate-200 border-slate-500/40";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style}`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
};

export default RoleBadge;
