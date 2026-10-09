import { AlertTriangle, Car, MapPin, Wrench } from 'lucide-react';
import PriceBreakdown from '../../../components/PriceBreakdown.jsx';
import { Badge, Card } from '../../../components/ui/index.js';
import { EMERGENCY_LEVELS } from '../../../types/constants.js';
import { formatEta } from '../../../utils/format.js';
import { serviceLabel } from '../../../utils/icons.js';

/** Step 6: review everything before sending the request. */
export default function ConfirmStep({ vehicle, serviceCode, location, details, best, partnerName }) {
  const level = EMERGENCY_LEVELS.find((l) => l.value === details.emergencyLevel);
  return (
    <div className="space-y-4">
      <Card>
        <ul className="space-y-3 text-[15px]">
          <li className="flex gap-3"><Car size={20} className="mt-0.5 shrink-0" aria-hidden /><span>{vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : '-'}</span></li>
          <li className="flex gap-3"><Wrench size={20} className="mt-0.5 shrink-0" aria-hidden /><span>{serviceLabel(serviceCode)}{details.issue && ` — ${details.issue}`}</span></li>
          <li className="flex gap-3"><MapPin size={20} className="mt-0.5 shrink-0" aria-hidden /><span>{location?.address || `${location?.latitude?.toFixed(4)}, ${location?.longitude?.toFixed(4)}`}</span></li>
          <li className="flex gap-3"><AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden /><Badge tone={details.emergencyLevel === 'HIGH' ? 'danger' : 'warning'}>{level?.label}</Badge></li>
        </ul>
        {details.description && <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-600">{details.description}</p>}
      </Card>
      <Card>
        <p className="mb-3 text-sm text-ink-600">{partnerName ? `Request will be sent to ${partnerName}` : 'Request will be sent to all available partners nearby'}{best && ` · ETA about ${formatEta(best.etaMinutes)}`}</p>
        <PriceBreakdown pricing={best?.pricing} />
      </Card>
    </div>
  );
}
