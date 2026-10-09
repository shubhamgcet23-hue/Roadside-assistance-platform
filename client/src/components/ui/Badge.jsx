import { cn } from '../../utils/cn.js';

const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  success: 'bg-go-50 text-go-700',
  warning: 'bg-brand-100 text-brand-800',
  danger: 'bg-stop-50 text-stop-700',
  info: 'bg-info-50 text-info-600',
  dark: 'bg-ink-900 text-brand-400',
};

export default function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', TONES[tone], className)}>
      {Icon && <Icon size={13} aria-hidden />}
      {children}
    </span>
  );
}

/** Badge driven by one of the META maps in utils/status.js. */
export function StatusBadge({ meta, value, icon }) {
  const m = meta[value] || { label: value, tone: 'neutral' };
  return <Badge tone={m.tone} icon={icon}>{m.label}</Badge>;
}
