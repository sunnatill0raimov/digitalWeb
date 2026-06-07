export const fmt = (n) =>
  new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0 }).format(n || 0) + " so'm";

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }) : '—';

export const statusMap = {
  pending:    { label: 'Kutilmoqda',  color: 'bg-amber-50  text-amber-700  border border-amber-200'  },
  processing: { label: 'Jarayonda',   color: 'bg-blue-50   text-blue-700   border border-blue-200'   },
  shipped:    { label: 'Yuborildi',   color: 'bg-violet-50 text-violet-700 border border-violet-200' },
  delivered:  { label: 'Yetkazildi',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200'},
  cancelled:  { label: 'Bekor',       color: 'bg-red-50    text-red-700    border border-red-200'    }
};

export const roleMap = {
  admin:     { label: 'Admin',      color: 'bg-purple-50 text-purple-700 border border-purple-200' },
  manager:   { label: 'Menejer',    color: 'bg-blue-50   text-blue-700   border border-blue-200'   },
  warehouse: { label: 'Omborchi',   color: 'bg-slate-100 text-slate-700  border border-slate-200'  }
};
