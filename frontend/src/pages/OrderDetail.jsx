import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { fmt, fmtDate, statusMap } from '../lib/utils';
import useAuth from '../store/auth';
import StatusBadge from '../components/StatusBadge';
import { PageLoader } from '../components/Spinner';

const STATUSES = ['pending','processing','shipped','delivered','cancelled'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['admin','manager'].includes(user?.role);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/orders/${id}`)
      .then(r => setOrder(r.data))
      .catch(() => toast.error('Topilmadi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Status yangilandi');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <PageLoader/>;
  if (!order)  return <div className="text-center py-20 text-slate-400">Buyurtma topilmadi</div>;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/orders')} className="btn-secondary btn-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Orqaga
      </button>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Buyurtma raqami</p>
            <h2 className="text-2xl font-bold text-slate-900">#{order.id}</h2>
            <p className="text-sm text-slate-500 mt-1">{fmtDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={order.status}/>
            <p className="text-2xl font-bold text-slate-900 mt-2">{fmt(order.total_amount)}</p>
            {order.paid_amount < order.total_amount && (
              <p className="text-sm text-red-500 mt-0.5">
                Qarz: {fmt(order.total_amount - order.paid_amount)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400">Mijoz</p>
            <p className="font-semibold text-slate-900 mt-0.5">{order.customer_name || '—'}</p>
            <p className="text-sm text-slate-500">{order.customer_phone || ''}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">To'langan</p>
            <p className="font-semibold text-emerald-700 mt-0.5">{fmt(order.paid_amount)}</p>
          </div>
          {order.notes && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400">Izoh</p>
              <p className="text-sm text-slate-700 mt-0.5">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-900">Mahsulotlar</h3>
        </div>
        <div className="table-wrap border-0">
          <table className="table">
            <thead><tr>
              <th>Mahsulot</th><th>SKU</th><th>Miqdor</th><th>Narx</th><th>Jami</th>
            </tr></thead>
            <tbody>
              {order.items?.map(it => (
                <tr key={it.id}>
                  <td className="font-medium">{it.product_name || '—'}</td>
                  <td className="font-mono text-xs text-slate-400">{it.sku}</td>
                  <td>{it.quantity} {it.unit}</td>
                  <td>{fmt(it.price)}</td>
                  <td className="font-semibold">{fmt(it.price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">Jami:</td>
                <td className="px-4 py-3 font-bold text-slate-900 text-base">{fmt(order.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Status change */}
      {canEdit && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Status o'zgartirish</h3>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => {
              const cfg = statusMap[s];
              const isActive = order.status === s;
              return (
                <button
                  key={s}
                  onClick={() => !isActive && changeStatus(s)}
                  disabled={updating || isActive}
                  className={`badge cursor-pointer transition-all ${cfg.color} ${
                    isActive ? 'ring-2 ring-offset-1 ring-blue-400 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {isActive && '✓ '}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
