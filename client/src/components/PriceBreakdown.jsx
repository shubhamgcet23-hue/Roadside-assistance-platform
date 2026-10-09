import { formatCurrency, formatDistance } from '../utils/format.js';

/** Base + distance = estimated total, always labelled as an estimate until the job is completed. */
export default function PriceBreakdown({ pricing, final = false, total }) {
  if (!pricing) return null;
  const grand = total ?? pricing.total;
  return (
    <div>
      <dl className="space-y-2 text-[15px]">
        <div className="flex justify-between"><dt className="text-ink-600">Base service cost</dt><dd className="font-medium">{formatCurrency(pricing.baseCost)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-600">Distance charge ({formatDistance(pricing.distanceKm)})</dt><dd className="font-medium">{formatCurrency(pricing.distanceCharge)}</dd></div>
        <div className="flex items-end justify-between border-t border-ink-200 pt-3">
          <dt className="font-semibold">{final ? 'Final total' : 'Estimated total'}</dt>
          <dd className="font-display text-3xl font-semibold leading-none">{formatCurrency(grand)}</dd>
        </div>
      </dl>
      {!final && <p className="mt-3 text-xs text-ink-500">Estimated price. Final price may vary depending on actual service requirements.</p>}
      <p className="mt-1 text-xs text-ink-500">Payment: Offline / Pay at service</p>
    </div>
  );
}
