import { cn } from '../../utils/cn.js';
import Card from './Card.jsx';

const TONES = {
  brand: 'bg-brand-400 text-ink-950',
  dark: 'bg-ink-900 text-brand-400',
  success: 'bg-go-50 text-go-600',
  danger: 'bg-stop-50 text-stop-600',
  info: 'bg-info-50 text-info-600',
};

export default function StatsCard({ icon: Icon, label, value, hint, tone = 'dark' }) {
  return (
    <Card className="flex items-center gap-4">
      {Icon && <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl', TONES[tone])}><Icon size={22} aria-hidden /></span>}
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-600">{label}</p>
        <p className="font-display text-3xl font-semibold leading-tight tracking-tight">{value}</p>
        {hint && <p className="truncate text-xs text-ink-500">{hint}</p>}
      </div>
    </Card>
  );
}
