import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { fmt, fmtDate } from '../lib/utils';
import useAuth from '../store/auth';
import Modal   from '../components/Modal';
import Confirm from '../components/Confirm';
import StatusBadge from '../components/StatusBadge';
import { PageLoader } from '../components/Spinner';

const STATUSES = ['pending','processing','shipped','delivered','cancelled'];

export default function Orders() {
  const { user } = useAuth();
  const canEdit = ['admin','manager'].includes(user?.role);
  const navigate = useNavigate();

  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [delId, setDelId] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  // Create order form
  const [customers, setCustomers] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [custId, setCustId]   = useState('');
  const [items,  setItems]    = useState([{ product_id:'', quantity:1 }]);
  const [notes,  setNotes]    = useState('');
  const [paid,   setPaid]     = useState(0);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/orders', { params: { status: statusFilter||undefined } })
      .then(r => setRows(r.data))
      .catch(() => toast.error('Xato'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    const [c, p] = await Promise.all([api.get('/customers'), api.get('/products')]);
    setCustomers(c.data);
    setProducts(p.data);
    setCustId(''); setItems([{ product_id:'', quantity:1 }]); setNotes(''); setPaid(0);
    setCreateModal(true);
  };

  const addItem = () => setItems(is => [...is, { product_id:'', quantity:1 }]);
  const removeItem = (i) => setItems(is => is.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => setItems(is => is.map((it, idx) => idx===i ? {...it,[k]:v} : it));

  const getTotal = () => items.reduce((s, it) => {
    const p = products.find(p => String(p.id) === String(it.product_id));
    return s + (p ? p.price * (it.quantity||0) : 0);
  }, 0);

  const submitCreate = async (e) => {
    e.preventDefault();
    const filled = items.filter(it => it.product_id && it.quantity > 0);
    if (!custId || !filled.length) return toast.error('Mijoz va mahsulotlar shart');
    setSaving(true);
    try {
      await api.post('/orders', { customer_id: custId, items: filled, notes, paid_amount: paid });
      toast.success("Buyurtma yaratildi");
      setCreateModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/orders/${delId}`);
      toast.success("O'chirildi");
      setDelId(null);
      load();
    } catch { toast.error('Xato'); }
    finally { setDelLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select className="select w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Barcha statuslar</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Yangi buyurtma
          </button>
        )}
      </div>

      <div className="card">
        {loading ? <PageLoader/> : (
          <div className="table-wrap border-0">
            <table className="table">
              <thead><tr>
                <th>#</th><th>Mijoz</th><th>Summa</th><th>To'langan</th>
                <th>Status</th><th>Sana</th><th></th>
              </tr></thead>
              <tbody>
                {rows.length===0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Buyurtma topilmadi</td></tr>}
                {rows.map(o => (
                  <tr key={o.id}>
                    <td className="text-slate-400 text-xs font-mono">#{o.id}</td>
                    <td className="font-medium">{o.customer_name || '—'}</td>
                    <td className="font-semibold">{fmt(o.total_amount)}</td>
                    <td className={o.paid_amount < o.total_amount ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                      {fmt(o.paid_amount)}
                    </td>
                    <td><StatusBadge status={o.status}/></td>
                    <td className="text-xs text-slate-400">{fmtDate(o.created_at)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/orders/${o.id}`)} className="btn-secondary btn-sm">
                          Ko'rish
                        </button>
                        {user?.role==='admin' && (
                          <button onClick={() => setDelId(o.id)} className="btn-icon btn-danger btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Yangi buyurtma yaratish" size="lg">
        <form onSubmit={submitCreate} className="space-y-5">
          <div>
            <label className="label">Mijoz *</label>
            <select className="select" value={custId} onChange={e => setCustId(e.target.value)} required>
              <option value="">Mijozni tanlang</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Mahsulotlar *</label>
              <button type="button" onClick={addItem} className="btn-secondary btn-sm">+ Qo'shish</button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => {
                const prod = products.find(p => String(p.id)===String(it.product_id));
                return (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      {i===0 && <span className="label">Mahsulot</span>}
                      <select className="select" value={it.product_id} onChange={e => updateItem(i,'product_id',e.target.value)}>
                        <option value="">Tanlang</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)} ({p.quantity} ta)</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      {i===0 && <span className="label">Miqdor</span>}
                      <input type="number" min={1} className="input" value={it.quantity}
                        onChange={e => updateItem(i,'quantity',+e.target.value)}/>
                    </div>
                    <div className="w-28 text-right">
                      {i===0 && <span className="label invisible">.</span>}
                      <p className="input bg-slate-50 text-slate-600 text-right">
                        {prod ? fmt(prod.price * it.quantity) : '—'}
                      </p>
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="btn-icon btn-danger btn-sm mb-0.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">Jami summa:</span>
            <span className="text-lg font-bold text-slate-900">{fmt(getTotal())}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">To'langan summa</label>
              <input type="number" min={0} className="input" value={paid} onChange={e => setPaid(+e.target.value)}/>
            </div>
            <div>
              <label className="label">Izoh</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)}/>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Bekor</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saqlanmoqda...' : 'Buyurtma yaratish'}
            </button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!delId} onClose={()=>setDelId(null)} onOk={doDelete} loading={delLoading} text="Bu buyurtmani o'chirmoqchimisiz?"/>
    </div>
  );
}
