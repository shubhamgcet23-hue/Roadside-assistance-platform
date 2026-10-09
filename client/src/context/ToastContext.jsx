import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../utils/cn.js';

const ToastContext = createContext(null);
let counter = 0;

const STYLES = {
  success: { icon: CheckCircle2, bar: 'bg-go-500' },
  error: { icon: AlertCircle, bar: 'bg-stop-500' },
  info: { icon: Info, bar: 'bg-info-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message, duration = 4500) => {
    counter += 1;
    const id = counter;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m, 7000),
    info: (m) => push('info', m),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((t) => {
          const { icon: Icon, bar } = STYLES[t.type];
          return (
            <div key={t.id} role={t.type === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-xl bg-ink-950 text-white shadow-lift">
              <span className={cn('w-1.5 shrink-0', bar)} />
              <div className="flex flex-1 items-start gap-3 p-3.5">
                <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
                <p className="flex-1 text-sm leading-snug">{t.message}</p>
                <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="rounded p-0.5 text-ink-300 hover:text-white"><X size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
