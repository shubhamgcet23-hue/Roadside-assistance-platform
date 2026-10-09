import { Car, Plus } from 'lucide-react';
import VehicleCard from '../../../components/VehicleCard.jsx';
import { Button, EmptyState } from '../../../components/ui/index.js';
import { cn } from '../../../utils/cn.js';

/** Step 1: choose which vehicle needs help. */
export default function VehicleStep({ vehicles, value, onChange, onAdd }) {
  if (!vehicles.length) {
    return <EmptyState icon={Car} title="Add a vehicle first" description="We need to know which vehicle needs help." action={<Button icon={Plus} onClick={onAdd}>Add vehicle</Button>} />;
  }
  return (
    <div className="space-y-3">
      {vehicles.map((v) => (
        <button key={v._id} type="button" aria-pressed={value === v._id} onClick={() => onChange(v._id)} className={cn('block w-full rounded-2xl text-left', value === v._id && 'ring-2 ring-brand-400')}>
          <VehicleCard vehicle={v} compact />
        </button>
      ))}
      <Button variant="secondary" icon={Plus} onClick={onAdd}>Add another vehicle</Button>
    </div>
  );
}
