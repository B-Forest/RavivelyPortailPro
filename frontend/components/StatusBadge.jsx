import { STATUSES } from "../lib/constants";

export default function StatusBadge({ status }) {
  const info = STATUSES[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${info.color}`}>
      {info.label}
    </span>
  );
}
