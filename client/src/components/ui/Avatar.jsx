import { cn } from '../../utils/cn.js';
import { initials } from '../../utils/format.js';

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-xl' };

export default function Avatar({ name, src, size = 'md', className }) {
  if (src) return <img src={src} alt={name || 'Avatar'} className={cn('shrink-0 rounded-full object-cover', SIZES[size], className)} />;
  return (
    <span aria-hidden className={cn('inline-grid shrink-0 place-items-center rounded-full bg-ink-900 font-display font-semibold tracking-wide text-brand-400', SIZES[size], className)}>
      {initials(name) || '?'}
    </span>
  );
}
