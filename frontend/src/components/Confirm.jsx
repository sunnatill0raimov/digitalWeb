export default function Confirm({ open, onClose, onOk, text, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex gap-3 mb-5">
          <div className="w-10 h-10 shrink-0 bg-red-100 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Tasdiqlash</p>
            <p className="text-sm text-slate-500 mt-0.5">{text}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Bekor</button>
          <button onClick={onOk} disabled={loading} className="btn btn-danger">
            {loading ? 'Yuklanmoqda...' : "O'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
}
