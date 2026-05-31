const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const CountdownBadge = ({ secondsLeft, isExpired }) => {
  if (isExpired) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200">
        HẾT HẠN 🚫
      </span>
    );
  }

  const isWarning = secondsLeft <= 60;
  const style = isWarning
    ? "bg-rose-500/20 text-rose-200"
    : "bg-sky-500/20 text-sky-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      Còn {formatTime(secondsLeft)}
    </span>
  );
};

export default CountdownBadge;
