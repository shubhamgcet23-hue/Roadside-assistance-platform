import { Check, XCircle } from 'lucide-react';
import { TIMELINE } from '../types/constants.js';
import { cn } from '../utils/cn.js';

/** Live progress of a request. SEARCHING -> ... -> COMPLETED; CANCELLED replaces the track with a notice. */
export default function StatusTimeline({ status, reason }) {
  if (status === 'CANCELLED') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl bg-stop-50 p-4 text-stop-700">
        <XCircle className="mt-0.5 shrink-0" size={22} aria-hidden />
        <div><p className="font-semibold">Request cancelled</p>{reason && <p className="text-sm">{reason}</p>}</div>
      </div>
    );
  }
  const current = Math.max(0, TIMELINE.findIndex((t) => t.status === (status === 'PENDING' ? 'SEARCHING' : status)));
  return (
    <ol className="relative" aria-label="Service progress">
      {TIMELINE.map((step, i) => {
        const done = i < current || status === 'COMPLETED';
        const active = i === current && status !== 'COMPLETED';
        return (
          <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0" aria-current={active ? 'step' : undefined}>
            {i < TIMELINE.length - 1 && <span aria-hidden className={cn('absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5', done ? 'bg-go-500' : 'bg-ink-200')} />}
            <span className={cn('relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold',
              done && 'border-go-500 bg-go-500 text-white', active && 'border-ink-900 bg-brand-400 text-ink-950', !done && !active && 'border-ink-200 bg-white text-ink-400')}
            >
              {done ? <Check size={16} aria-hidden /> : i + 1}
              {active && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand-400/60" />}
            </span>
            <div className="pt-0.5">
              <p className={cn('font-semibold leading-tight', !done && !active && 'text-ink-400')}>{step.label}</p>
              {(active || done) && <p className="text-sm text-ink-600">{step.hint}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
