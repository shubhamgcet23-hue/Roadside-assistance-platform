import { ArrowRight, Check } from 'lucide-react';
import { Button, Card } from './ui/index.js';
import { serviceIcon } from '../utils/icons.js';
import { formatCurrency } from '../utils/format.js';
import { cn } from '../utils/cn.js';

/** One roadside service. `selected` + onSelect turn it into a choice tile for the request wizard. */
export default function ServiceCard({ service, onSelect, selected = false, actionLabel = 'Request' }) {
  const Icon = serviceIcon(service.code);
  return (
    <Card className={cn('flex flex-col gap-3 transition-shadow hover:shadow-lift', selected && 'border-ink-900 ring-2 ring-brand-400')} data-testid={`service-${service.code}`}>
      <div className="flex items-start justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink-900 text-brand-400"><Icon size={24} aria-hidden /></span>
        {selected && <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-400 text-ink-950"><Check size={16} aria-label="Selected" /></span>}
      </div>
      <div className="flex-1">
        <h3 className="font-display text-2xl font-semibold leading-tight">{service.name}</h3>
        <p className="mt-1 text-sm text-ink-600">{service.description}</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-ink-600">From <span className="font-display text-xl font-semibold text-ink-900">{formatCurrency(service.basePrice)}</span></p>
        <Button size="sm" variant={selected ? 'primary' : 'dark'} onClick={() => onSelect?.(service)} aria-label={`${actionLabel} ${service.name}`}>
          {selected ? 'Selected' : actionLabel}{!selected && <ArrowRight size={16} aria-hidden />}
        </Button>
      </div>
    </Card>
  );
}
