import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { fmt, fmtDate } from '../lib/utils';
import StatusBadge from '../components/StatusBadge';
import { PageLoader } from '../components/Spinner';

const StatCard = ({ label, value, sub, icon, bg, text }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
      <span className={text}>{icon}</span>
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <PageLoader/>;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Jami mijozlar"    value={data.totalCustomers} bg="bg-blue-50"    text="text-blue-600"    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}/>
        <StatCard label="Jami mahsulotlar" value={data.totalProducts}  bg="bg-emerald-50" text="text-emerald-600" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}/>
        <StatCard label="Jami buyurtmalar" value={data.totalOrders}    bg="bg-violet-50"  text="text-violet-600"  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}/>
        <StatCard label="Jami daromad"     value={fmt(data.totalRevenue)} bg="bg-amber-50"   text="text-amber-600"   icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}/>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Oylik savdo (6 oy)</h2>
          </div>
          <div className="p-5">
            {data.monthlySales?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthlySales} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(0)}M`}/>
                  <Tooltip
                    formatter={v => [fmt(v), 'Savdo']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: 12 }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                Hali ma'lumot yo'q
              </div>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Kam qolgan</h2>
            {data.lowStockProducts?.length > 0 && (
              <span className="badge bg-red-50 text-red-600 border border-red-100">
                {data.lowStockProducts.length} ta
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {data.lowStockProducts?.length ? data.lowStockProducts.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.category_name || '—'}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ml-3 ${p.quantity === 0 ? 'text-red-600' : 'text-amber-500'}`}>
                  {p.quantity} ta
                </span>
              </div>
            )) : (
              <p className="px-5 py-4 text-sm text-slate-400">Barchasi yetarli ✓</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Oxirgi buyurtmalar</h2>
            <Link to="/orders" className="text-xs text-blue-600 hover:underline">Barchasi</Link>
          </div>
          <div className="table-wrap rounded-none border-0">
            <table className="table">
              <thead><tr>
                <th>#</th><th>Mijoz</th><th>Summa</th><th>Status</th>
              </tr></thead>
              <tbody>
                {data.recentOrders?.map(o => (
                  <tr key={o.id}>
                    <td className="text-slate-400">#{o.id}</td>
                    <td className="font-medium">{o.customer_name || '—'}</td>
                    <td>{fmt(o.total_amount)}</td>
                    <td><StatusBadge status={o.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top products */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Top mahsulotlar (30 kun)</h2>
          </div>
          <div className="p-5 space-y-3">
            {data.topProducts?.length ? data.topProducts.map((p, i) => (
              <div key={p.sku} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.sku}</p>
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0">{p.sold} ta</span>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Ma'lumot yo'q</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
