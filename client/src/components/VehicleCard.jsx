import { Bike, Car, CircleDot, Pencil, Star, Trash2, Truck } from 'lucide-react';
import { Badge, Button, Card } from './ui/index.js';
import { humanize } from '../utils/format.js';

const ICONS = { CAR: Car, SUV: Car, BIKE: Bike, SCOOTER: Bike, COMMERCIAL: Truck, OTHER: CircleDot };

export default function VehicleCard({ vehicle, onEdit, onDelete, onDefault, onView, compact = false }) {
  const Icon = ICONS[vehicle.type] || Car;
  return (
    <Card className="flex flex-col gap-3" data-testid="vehicle-card">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-900 text-brand-400"><Icon size={24} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-2xl font-semibold leading-tight">{vehicle.make} {vehicle.model}</h3>
          <p className="mt-0.5 inline-block rounded-md border border-ink-300 bg-ink-50 px-2 py-0.5 font-mono text-sm font-semibold tracking-wider">{vehicle.registrationNumber}</p>
        </div>
        {vehicle.isDefault && <Badge tone="dark" icon={Star}>Default</Badge>}
      </div>
      {!compact && (
        <>
          <p className="text-sm text-ink-600">{[humanize(vehicle.type), vehicle.year, vehicle.fuelType && humanize(vehicle.fuelType), vehicle.color].filter(Boolean).join(' · ')}</p>
          <div className="mt-auto flex flex-wrap gap-2">
            {onView && <Button size="sm" variant="secondary" onClick={() => onView(vehicle)}>Details</Button>}
            {onEdit && <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(vehicle)}>Edit</Button>}
            {onDefault && !vehicle.isDefault && <Button size="sm" variant="ghost" icon={Star} onClick={() => onDefault(vehicle)}>Make default</Button>}
            {onDelete && <Button size="sm" variant="ghost" className="text-stop-600" icon={Trash2} onClick={() => onDelete(vehicle)} aria-label={`Delete ${vehicle.make} ${vehicle.model}`}>Delete</Button>}
          </div>
        </>
      )}
    </Card>
  );
}
