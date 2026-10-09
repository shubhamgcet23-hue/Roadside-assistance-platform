import { useState } from 'react';
import { AlertTriangle, Check, Clock, MapPin, X } from 'lucide-react';
import { Badge, Button, Card } from './ui/index.js';
import { formatCountdown, useCountdown } from '../hooks/useCountdown.js';
import { formatCurrency, formatDistance } from '../utils/format.js';
import { serviceLabel } from '../utils/icons.js';

/** New roadside assistance request with a countdown, shown to nearby partners. */
export default function IncomingRequestCard({ request, onAccept, onReject }) {
  const [busy, setBusy] = useState(null);
  const left = useCountdown(request.offerExpiresAt);
  const expired = left <= 0;
  const v = request.vehicleId;
  const run = async (kind, fn) => { setBusy(kind); try { await fn(request); } finally { setBusy(null); } };
  return (
    <Card data-testid="incoming-request" className={request.emergencyLevel === 'HIGH' ? 'border-stop-500' : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-600">New roadside assistance request</p>
          <h3 className="font-display text-3xl font-semibold leading-tight">{serviceLabel(request.serviceType)}</h3>
          <p className="text-sm text-ink-600">{request.userId?.name}{v?.make && ` · ${v.make} ${v.model}`}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold leading-none">{formatCurrency(request.estimatedEarnings)}</p>
          <p className="text-xs text-ink-500">estimated earnings</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5"><MapPin size={16} aria-hidden /> {formatDistance(request.distanceKm)} away</span>
        <span className={expired ? 'text-stop-600' : 'inline-flex items-center gap-1.5'}><Clock size={16} className="inline" aria-hidden /> {expired ? 'Expired' : `Respond in ${formatCountdown(left)}`}</span>
        {request.emergencyLevel === 'HIGH' && <Badge tone="danger" icon={AlertTriangle}>Urgent</Badge>}
      </div>
      <p className="mt-2 text-sm text-ink-700">{request.breakdownLocation?.address}</p>
      {(request.issue || request.description) && <p className="mt-1 text-sm text-ink-500">{request.issue || request.description}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={X} loading={busy === 'reject'} disabled={Boolean(busy) || expired} onClick={() => run('reject', onReject)}>Reject</Button>
        <Button icon={Check} loading={busy === 'accept'} disabled={Boolean(busy) || expired} onClick={() => run('accept', onAccept)}>Accept</Button>
      </div>
    </Card>
  );
}
