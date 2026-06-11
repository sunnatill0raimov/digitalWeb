import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import api from '../lib/api';
import { fmt, fmtDate } from '../lib/utils';
import StatusBadge from '../components/StatusBadge';
import { PageLoader } from '../components/Spinner';

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, bg, text, trend }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
      <span className={text}>{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      {trend != null && (
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          <span className="text-slate-400 font-normal ml-1">o'tgan oyga nisbatan</span>
        </span>
      )}
    </div>
  </div>
);

// ─── Status ranglari ─────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:    '#f59e0b',
  processing: '#3b82f6',
  shipped:    '#8b5cf6',
  delivered:  '#10b981',
  cancelled:  '#ef4444',
};
const STATUS_LABELS = {
  pending:    'Kutilmoqda',
  processing: 'Jarayonda',
  shipped:    'Yuborildi',
  delivered:  'Yetkazildi',
  cancelled:  'Bekor',
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[130px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800 ml-auto">
            {typeof p.value === 'number' && p.value > 10000
              ? fmt(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Mini sparkline progress bar ─────────────────────────────────────────────
const ProgressBar = ({ pct, color }) => (
  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <PageLoader />;

  // Trend hisoblash: oxirgi 2 oy
  const months = data.monthlySales || [];
  const lastM  = months[months.length - 1];
  const prevM  = months[months.length - 2];
  const revTrend = prevM && +prevM.total > 0
    ? Math.round(((+lastM?.total - +prevM.total) / +prevM.total) * 100)
    : null;

  const ordMonths = (data.monthlyRevenueTrend || []).length > 0
    ? data.monthlyRevenueTrend
    : data.monthlySales || [];
  const lastOM    = ordMonths[ordMonths.length - 1];
  const prevOM    = ordMonths[ordMonths.length - 2];
  const ordTrend  = prevOM && +prevOM.orders_count > 0
    ? Math.round(((+lastOM?.orders_count - +prevOM.orders_count) / +prevOM.orders_count) * 100)
    : prevOM && +prevOM.count > 0
    ? Math.round(((+(lastOM?.count ?? 0) - +prevOM.count) / +prevOM.count) * 100)
    : null;

  // Donut uchun
  const statusData = (data.ordersByStatus || []).map(s => ({
    name:  STATUS_LABELS[s.status] || s.status,
    value: +s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8',
  }));
  const totalStatusCount = statusData.reduce((s, d) => s + d.value, 0);

  // Combo chart: monthlyRevenueTrend bo'lsa undan, bo'lmasa monthlySales dan qur
  const trendSource = (data.monthlyRevenueTrend || []).length > 0
    ? data.monthlyRevenueTrend
    : null;

  const comboData = trendSource
    ? trendSource.map(r => ({
        month:        r.month,
        "Jami savdo": +r.revenue,
        "To'langan":  +r.paid,
        "Buyurtmalar":+r.orders_count,
      }))
    : (data.monthlySales || []).map(r => ({
        month:        r.month,
        "Jami savdo": +r.total,
        "To'langan":  0,
        "Buyurtmalar":+r.count,
      }));

  // Top customers max
  const maxSpent = Math.max(...(data.topCustomers || []).map(c => +c.total_spent), 1);

  return (
    <div className="space-y-6">

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Jami mijozlar"
          value={data.totalCustomers}
          sub="Ro'yxatdagi barcha"
          trend={null}
          bg="bg-blue-50" text="text-blue-600"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <StatCard
          label="Jami mahsulotlar"
          value={data.totalProducts}
          sub="Assortimentda"
          bg="bg-emerald-50" text="text-emerald-600"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
        />
        <StatCard
          label="Jami buyurtmalar"
          value={data.totalOrders}
          sub="Barcha vaqt"
          trend={ordTrend}
          bg="bg-violet-50" text="text-violet-600"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
        />
        <StatCard
          label="Jami daromad"
          value={fmt(data.totalRevenue)}
          sub="Yetkazilganlardan"
          trend={revTrend}
          bg="bg-amber-50" text="text-amber-600"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
      </div>

      {/* ── Combo Chart + Donut ─────────────────────────────────────────── */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Combo: Jami savdo vs To'langan */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-slate-900">Oylik savdo dinamikasi</h2>
              <p className="text-xs text-slate-400 mt-0.5">So'nggi 6 oy — savdo va to'lovlar</p>
            </div>
          </div>
          <div className="p-5">
            {comboData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={comboData} barSize={18} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`}/>
                  <Tooltip content={<ChartTooltip />}/>
                  <Legend iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}/>
                  <Bar dataKey="Jami savdo" fill="#3b82f6"  radius={[5,5,0,0]}/>
                  <Bar dataKey="To'langan"  fill="#10b981"  radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                Hali ma'lumot yo'q
              </div>
            )}
          </div>
        </div>

        {/* Donut: Statuslar */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Buyurtma statuslari</h2>
            <span className="badge bg-slate-100 text-slate-600">{totalStatusCount} ta</span>
          </div>
          <div className="p-5">
            {statusData.length ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((s, i) => (
                        <Cell key={i} fill={s.color} stroke="none"/>
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [v + ' ta', n]}
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statusData.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }}/>
                      <span className="text-xs text-slate-600 flex-1">{s.name}</span>
                      <span className="text-xs font-bold text-slate-700">{s.value}</span>
                      <span className="text-xs text-slate-400 w-8 text-right">
                        {Math.round(s.value / totalStatusCount * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Ma'lumot yo'q</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Line Chart + Low Stock ──────────────────────────────────────── */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Buyurtmalar soni trendi */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-slate-900">Buyurtmalar soni trendi</h2>
              <p className="text-xs text-slate-400 mt-0.5">So'nggi 6 oy</p>
            </div>
          </div>
          <div className="p-5">
            {comboData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={comboData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<ChartTooltip />}/>
                  <Line
                    type="monotone" dataKey="Buyurtmalar"
                    stroke="#8b5cf6" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
                Hali ma'lumot yo'q
              </div>
            )}
          </div>
        </div>

        {/* Kam qolgan mahsulotlar */}
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
            {data.lowStockProducts?.length ? data.lowStockProducts.map(p => {
              const pct = Math.min(100, Math.round((p.quantity / 20) * 100));
              const col = p.quantity === 0 ? '#ef4444' : p.quantity < 10 ? '#f59e0b' : '#10b981';
              return (
                <div key={p.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-800 truncate max-w-[130px]">{p.name}</p>
                    <span className={`text-sm font-bold shrink-0 ml-2 ${p.quantity === 0 ? 'text-red-600' : p.quantity < 10 ? 'text-amber-500' : 'text-slate-600'}`}>
                      {p.quantity} ta
                    </span>
                  </div>
                  <ProgressBar pct={pct} color={col}/>
                  <p className="text-xs text-slate-400 mt-0.5">{p.category_name || '—'}</p>
                </div>
              );
            }) : (
              <p className="px-5 py-4 text-sm text-slate-400">Barchasi yetarli ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Orders + Top Customers ──────────────────────────────── */}
      <div className="grid xl:grid-cols-2 gap-6">

        {/* Oxirgi buyurtmalar */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Oxirgi buyurtmalar</h2>
            <Link to="/orders" className="text-xs text-blue-600 hover:underline">Barchasi →</Link>
          </div>
          <div className="table-wrap rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mijoz</th>
                  <th>Summa</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders?.map(o => (
                  <tr key={o.id}>
                    <td className="text-slate-400 font-mono text-xs">#{o.id}</td>
                    <td className="font-medium max-w-[120px] truncate">{o.customer_name || '—'}</td>
                    <td className="text-sm">{fmt(o.total_amount)}</td>
                    <td><StatusBadge status={o.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top mijozlar */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Top 5 mijoz</h2>
            <span className="text-xs text-slate-400">Jami xarid bo'yicha</span>
          </div>
          <div className="p-5 space-y-4">
            {data.topCustomers?.length ? data.topCustomers.map((c, i) => {
              const pct = Math.round((+c.total_spent / maxSpent) * 100);
              const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'];
              return (
                <div key={c.id}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: colors[i] }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.company_name}</p>
                        <p className="text-sm font-bold text-slate-700 shrink-0 ml-2">{fmt(c.total_spent)}</p>
                      </div>
                      <p className="text-xs text-slate-400">{c.orders_count} ta buyurtma</p>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={colors[i]}/>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-400">Ma'lumot yo'q</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Products ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-900">Top mahsulotlar (30 kun)</h2>
          <Link to="/products" className="text-xs text-blue-600 hover:underline">Barcha mahsulotlar →</Link>
        </div>
        <div className="p-5">
          {data.topProducts?.length ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {data.topProducts.map((p, i) => {
                const colors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-red-400'];
                const textColors = ['text-blue-600','text-violet-600','text-emerald-600','text-amber-600','text-red-500'];
                const bgColors = ['bg-blue-50','bg-violet-50','bg-emerald-50','bg-amber-50','bg-red-50'];
                return (
                  <div key={p.sku} className={`rounded-xl p-4 ${bgColors[i]}`}>
                    <div className={`w-8 h-8 rounded-lg ${colors[i]} flex items-center justify-center mb-3`}>
                      <span className="text-white text-sm font-bold">{i + 1}</span>
                    </div>
                    <p className={`text-lg font-bold ${textColors[i]}`}>{p.sold} ta</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 leading-tight">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{p.sku}</p>
                    {p.revenue && (
                      <p className="text-xs font-semibold text-slate-600 mt-2">{fmt(p.revenue)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">So'nggi 30 kunda sotuvlar yo'q</p>
          )}
        </div>
      </div>

    </div>
  );
}
