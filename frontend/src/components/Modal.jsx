import { useEffect } from 'react';

const SIZES = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${SIZES[size]} flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
