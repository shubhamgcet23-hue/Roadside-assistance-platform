import { Star } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/** Read-only when onChange is omitted; otherwise a 1-5 star input. */
export default function StarRating({ value = 0, onChange, size = 18, className }) {
  const stars = [1, 2, 3, 4, 5];
  if (!onChange) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value} out of 5 stars`}>
        {stars.map((n) => <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-brand-400 text-brand-500' : 'text-ink-300'} aria-hidden />)}
      </span>
    );
  }
  return (
    <div className={cn('inline-flex items-center gap-1', className)} role="radiogroup" aria-label="Rating">
      {stars.map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} className="rounded-lg p-1.5">
          <Star size={size} className={n <= value ? 'fill-brand-400 text-brand-500' : 'text-ink-300'} aria-hidden />
        </button>
      ))}
    </div>
  );
}
