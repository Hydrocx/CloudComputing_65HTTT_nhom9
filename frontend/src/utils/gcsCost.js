export function estimateUploadCost(sizeBytes) {
  return "~3 VNĐ";
}

export function estimateViewCost(sizeBytes) {
  const gb = sizeBytes / 1e9;
  const vnd = gb * 0.12 * 25000;
  return `~${Math.round(vnd).toLocaleString("vi-VN")} VNĐ`;
}

export function estimateStorageCostPerMonth(sizeBytes, storageClass) {
  const rates = { STANDARD: 500, NEARLINE: 250, COLDLINE: 100, ARCHIVE: 30 };
  const gb = sizeBytes / 1e9;
  const vnd = gb * (rates[storageClass] || 500);
  return `~${Math.round(vnd).toLocaleString("vi-VN")} VNĐ/tháng`;
}
