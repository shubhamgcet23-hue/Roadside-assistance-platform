import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { cn } from '../utils/cn.js';

export default function Logo({ to = '/', dark = false, className }) {
  return (
    <Link to={to} aria-label="RoadsideAAA home" className={cn('inline-flex items-center gap-2 font-display text-[26px] font-bold leading-none tracking-tight', dark ? 'text-white on-dark' : 'text-ink-900', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-400 text-ink-950"><Wrench size={18} strokeWidth={2.6} aria-hidden /></span>
      <span>Roadside<span className={dark ? 'text-brand-400' : 'text-brand-600'}>AAA</span></span>
    </Link>
  );
}
