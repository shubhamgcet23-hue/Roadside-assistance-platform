import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary: 'bg-brand-400 text-ink-950 hover:bg-brand-300 active:bg-brand-500 shadow-sm',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950',
  secondary: 'bg-white text-ink-900 border border-ink-200 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'text-ink-700 hover:bg-ink-100 active:bg-ink-200',
  danger: 'bg-stop-600 text-white hover:bg-stop-700 active:bg-stop-700',
  success: 'bg-go-600 text-white hover:bg-go-700 active:bg-go-700',
  outlineLight: 'border border-white/30 text-white hover:bg-white/10',
};
const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-[15px] gap-2',
  lg: 'h-14 px-6 text-base gap-2.5',
  xl: 'h-16 px-8 text-lg gap-3',
};

export default function Button({
  variant = 'primary', size = 'md', loading = false, icon: Icon, full = false, to, href, className, children, disabled, type = 'button', ...rest
}) {
  const classes = cn(
    'inline-flex shrink-0 select-none items-center justify-center rounded-xl font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant], SIZES[size], full && 'w-full', className,
  );
  const content = (
    <>
      {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 16 : 20} aria-hidden /> : Icon && <Icon size={size === 'sm' ? 16 : 20} aria-hidden />}
      {children}
    </>
  );
  if (to && !disabled) return <Link to={to} className={classes} {...rest}>{content}</Link>;
  if (href && !disabled) return <a href={href} className={classes} {...rest}>{content}</a>;
  return <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>{content}</button>;
}
