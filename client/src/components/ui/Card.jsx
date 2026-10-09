import { cn } from '../../utils/cn.js';

export default function Card({ as: Tag = 'div', className, padded = true, children, ...rest }) {
  return (
    <Tag className={cn('rounded-2xl border border-ink-100 bg-white shadow-card', padded && 'p-4 sm:p-5', className)} {...rest}>
      {children}
    </Tag>
  );
}
