import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import Button from './Button.jsx';

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden />;
}

export function Spinner({ className, label = 'Loading' }) {
  return <Loader2 role="status" aria-label={label} className={cn('animate-spin text-ink-500', className)} />;
}

/** Skeleton placeholders so pages never flash blank. */
export function LoadingState({ variant = 'cards', count = 3 }) {
  if (variant === 'list') {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading">
        {Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }
  if (variant === 'page') {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40" />
        <div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-36" />)}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-950" aria-busy="true">
      <div className="flex flex-col items-center gap-4">
        <div className="lane-dash w-24" />
        <Spinner className="text-brand-400" label="Loading RoadsideAAA" />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
      {Icon && <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-600"><Icon size={26} aria-hidden /></span>}
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-ink-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-stop-100 bg-stop-50 px-6 py-10 text-center">
      <AlertTriangle className="mb-3 text-stop-600" size={30} aria-hidden />
      <p className="max-w-md font-medium text-stop-700">{message}</p>
      {onRetry && <Button className="mt-4" variant="secondary" onClick={() => onRetry()}>Try again</Button>}
    </div>
  );
}
