import { Briefcase, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { Avatar, Badge, Card, StarRating, StatusBadge } from './ui/index.js';
import { AVAILABILITY_META } from '../utils/status.js';
import { formatCurrency, formatDistance, formatEta } from '../utils/format.js';
import { serviceLabel } from '../utils/icons.js';
import { cn } from '../utils/cn.js';

/** A nearby mechanic / towing partner. Selectable when `onSelect` is provided and the partner is available. */
export default function PartnerCard({ partner, selected = false, onSelect }) {
  const available = partner.availability === 'AVAILABLE';
  const clickable = Boolean(onSelect) && available;
  return (
    <Card
      as={clickable ? 'button' : 'div'} type={clickable ? 'button' : undefined} onClick={clickable ? () => onSelect(partner) : undefined}
      aria-pressed={clickable ? selected : undefined}
      className={cn('w-full text-left', clickable && 'cursor-pointer hover:shadow-lift', selected && 'border-ink-900 ring-2 ring-brand-400', !available && 'opacity-70')}
    >
      <div className="flex items-start gap-3">
        <Avatar name={partner.name} src={partner.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate font-display text-xl font-semibold">{partner.name}</h3>
            {partner.verified && <Badge tone="success" icon={ShieldCheck}>Verified</Badge>}
            <StatusBadge meta={AVAILABILITY_META} value={partner.availability} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
            <span className="inline-flex items-center gap-1.5"><StarRating value={partner.rating} size={14} /> {partner.rating ? partner.rating.toFixed(1) : 'New'}{partner.reviews > 0 && ` (${partner.reviews})`}</span>
            <span className="inline-flex items-center gap-1"><Briefcase size={14} aria-hidden /> {partner.jobsCompleted} jobs</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold leading-none">{formatCurrency(partner.pricing?.total)}</p>
          <p className="mt-1 text-xs text-ink-500">estimated</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-100 pt-3 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium"><MapPin size={16} aria-hidden /> {formatDistance(partner.distanceKm)} away</span>
        <span className="inline-flex items-center gap-1.5 font-medium"><Clock size={16} aria-hidden /> ETA {formatEta(partner.etaMinutes)}</span>
        <span className="text-ink-500">Starts at {formatCurrency(partner.pricing?.baseCost)}</span>
      </div>
      {partner.services?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">{partner.services.map((s) => <Badge key={s}>{serviceLabel(s)}</Badge>)}</div>
      )}
      {onSelect && !available && <p className="mt-2 text-sm text-ink-500">Partner is currently unavailable</p>}
    </Card>
  );
}
