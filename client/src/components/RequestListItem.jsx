import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './ui/index.js';
import { STATUS_META } from '../utils/status.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import { serviceIcon, serviceLabel } from '../utils/icons.js';

/** Compact request row used in dashboards. `to` is the destination path. */
export default function RequestListItem({ request, to }) {
  const Icon = serviceIcon(request.serviceType);
  const v = request.vehicleId;
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 hover:border-ink-300">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-900 text-brand-400"><Icon size={20} aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{serviceLabel(request.serviceType)}{v?.make ? ` · ${v.make} ${v.model}` : ''}</p>
        <p className="text-sm text-ink-500">{formatDate(request.createdAt)} · {formatCurrency(request.finalCost ?? request.estimatedCost)}</p>
      </div>
      <StatusBadge meta={STATUS_META} value={request.status} />
      <ChevronRight size={18} className="text-ink-400" aria-hidden />
    </Link>
  );
}
