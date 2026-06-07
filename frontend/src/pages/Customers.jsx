import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { fmt, fmtDate } from '../lib/utils';
import useAuth from '../store/auth';
import Modal   from '../components/Modal';
import Confirm from '../components/Confirm';
import { PageLoader } from '../components/Spinner';

const EMPTY = { company_name:'', contact_person:'', phone:'', address:'', debt:0, notes:'' };

export default function Customers() {
  const { user } = useAuth();
  const canEdit = ['admin','manager'].includes(user?.role);

  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null);   // null | 'create' | 'edit' | 'view'
  const [sel,     setSel]     = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [delId,   setDelId]   = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/customers', { params: { search: search || undefined } })
      .then(r => setRows(r.data))
      .catch(() => toast.error('Xato'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit   = (c) => { setSel(c); setForm({ company_name:c.company_name, contact_person:c.contact_person||'', phone:c.phone||'', address:c.address||'', debt:c.debt||0, notes:c.notes||'' }); setModal('edit'); };
  const openView   = (c) => { setSel(c); setModal('view'); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/customers', form);
        toast.success("Mijoz qo'shildi");
      } else {
        await api.put(`/customers/${sel.id}`, form);
        toast.success('Mijoz yangilandi');
      }
      setModal(null);
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
      await api.delete(`/customers/${delId}`);
      toast.success("O'chirildi");
      setDelId(null);
      load();
    } catch {
      toast.error('Xato');
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            className="input pl-9"
            placeholder="Qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Yangi mijoz
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <PageLoader/> : (
          <div className="table-wrap border-0">
            <table className="table">
              <thead><tr>
                <th>#</th><th>Kompaniya</th><th>Kontakt</th><th>Telefon</th>
                <th>Manzil</th><th>Qarz</th><th>Sana</th><th></th>
              </tr></thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400">Mijozlar topilmadi</td></tr>
                )}
                {rows.map(c => (
                  <tr key={c.id}>
                    <td className="text-slate-400 text-xs">{c.id}</td>
                    <td>
                      <button onClick={() => openView(c)} className="font-medium text-blue-600 hover:underline text-left">
                        {c.company_name}
                      </button>
                    </td>
                    <td>{c.contact_person || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td className="max-w-[150px] truncate">{c.address || '—'}</td>
                    <td>
                      <span className={c.debt > 0 ? 'text-red-600 font-medium' : 'text-slate-500'}>
                        {fmt(c.debt)}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{fmtDate(c.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <button onClick={() => openEdit(c)} className="btn-icon btn-secondary btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button onClick={() => setDelId(c.id)} className="btn-icon btn-danger btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
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

      {/* View modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title="Mijoz ma'lumotlari">
        {sel && (
          <div className="space-y-3 text-sm">
            <Row label="Kompaniya"  value={sel.company_name}/>
            <Row label="Kontakt"    value={sel.contact_person}/>
            <Row label="Telefon"    value={sel.phone}/>
            <Row label="Manzil"     value={sel.address}/>
            <Row label="Qarz"       value={<span className={sel.debt > 0 ? 'text-red-600 font-bold' : ''}>{fmt(sel.debt)}</span>}/>
            <Row label="Izoh"       value={sel.notes}/>
            <Row label="Qo'shilgan" value={fmtDate(sel.created_at)}/>
          </div>
        )}
      </Modal>

      {/* Form modal */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? "Yangi mijoz qo'shish" : 'Mijozni tahrirlash'}
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Kompaniya nomi *</label>
              <input className="input" value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} required/>
            </div>
            <div>
              <label className="label">Kontakt shaxs</label>
              <input className="input" value={form.contact_person}
                onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Telefon</label>
              <input className="input" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}/>
            </div>
            <div className="col-span-2">
              <label className="label">Manzil</label>
              <input className="input" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Qarz (so'm)</label>
              <input type="number" min={0} className="input" value={form.debt}
                onChange={e => setForm(f => ({ ...f, debt: e.target.value }))}/>
            </div>
            <div className="col-span-2">
              <label className="label">Izoh</label>
              <textarea rows={2} className="input resize-none" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Bekor</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={!!delId}
        onClose={() => setDelId(null)}
        onOk={doDelete}
        loading={delLoading}
        text="Bu mijozni o'chirmoqchimisiz?"
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-4">
      <span className="text-slate-400 w-28 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium">{value || '—'}</span>
    </div>
  );
}
