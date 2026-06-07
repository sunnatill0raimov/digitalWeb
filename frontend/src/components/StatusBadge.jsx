import { statusMap } from '../lib/utils';

export default function StatusBadge({ status }) {
  const s = statusMap[status] || { label: status, color: 'bg-slate-100 text-slate-600 border border-slate-200' };
  return <span className={`badge ${s.color}`}>{s.label}</span>;
}
