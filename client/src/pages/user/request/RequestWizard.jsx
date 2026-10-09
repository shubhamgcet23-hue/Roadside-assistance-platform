import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Siren } from 'lucide-react';
import VehicleFormModal from '../../../components/VehicleFormModal.jsx';
import { recallLocation } from '../../../components/LocationPicker.jsx';
import { Button, ErrorState, LoadingState, PageHeader } from '../../../components/ui/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { getErrorMessage } from '../../../services/api.js';
import { catalogService } from '../../../services/catalog.js';
import { partnerService } from '../../../services/partners.js';
import { requestService } from '../../../services/requests.js';
import { vehicleService } from '../../../services/vehicles.js';
import { SERVICE_CODES } from '../../../types/constants.js';
import { isValidCoord } from '../../../utils/geo.js';
import ConfirmStep from './ConfirmStep.jsx';
import DetailsStep from './DetailsStep.jsx';
import EstimateStep from './EstimateStep.jsx';
import LocationStep from './LocationStep.jsx';
import ServiceStep from './ServiceStep.jsx';
import VehicleStep from './VehicleStep.jsx';

const STEPS = ['Vehicle', 'Service', 'Location', 'Details', 'Estimate', 'Confirm'];

export default function RequestWizard() {
  useDocumentTitle('Request assistance');
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetService = SERVICE_CODES.includes(params.get('service')) ? params.get('service') : '';

  const vehicles = useFetch(() => vehicleService.list(), []);
  const services = useFetch(() => catalogService.list(), []);

  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState('');
  const [serviceCode, setServiceCode] = useState(presetService);
  const [location, setLocation] = useState(() => recallLocation());
  const [details, setDetails] = useState({ emergencyLevel: 'MEDIUM', issue: '', description: '' });
  const [partnerId, setPartnerId] = useState(null);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const initialised = useRef(false);

  // Pre-select the default vehicle; with a service already chosen on the dashboard, jump straight to location.
  useEffect(() => {
    if (!vehicles.data || initialised.current) return;
    initialised.current = true;
    const def = vehicles.data.find((v) => v.isDefault) || vehicles.data[0];
    if (def) {
      setVehicleId(def._id);
      if (presetService) setStep(2);
    }
  }, [vehicles.data, presetService]);

  const hasLocation = isValidCoord(location?.latitude, location?.longitude);
  const nearby = useFetch(
    () => (step >= 4 && hasLocation && serviceCode
      ? partnerService.nearby({ lat: location.latitude, lng: location.longitude, serviceType: serviceCode })
      : Promise.resolve(null)),
    [step >= 4, location?.latitude, location?.longitude, serviceCode],
  );
  const partners = nearby.data?.partners || [];
  const chosen = partners.find((p) => p.partnerId === partnerId);
  const best = chosen || partners.find((p) => p.availability === 'AVAILABLE');
  const vehicle = vehicles.data?.find((v) => v._id === vehicleId);

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(vehicleId);
    if (step === 1) return Boolean(serviceCode);
    if (step === 2) return hasLocation;
    if (step === 4) return Boolean(best);
    return true;
  }, [step, vehicleId, serviceCode, hasLocation, best]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const { request } = await requestService.create({
        vehicleId, serviceType: serviceCode, emergencyLevel: details.emergencyLevel,
        issue: details.issue.trim() || undefined, description: details.description.trim() || undefined,
        preferredPartnerId: partnerId || undefined,
        location: { latitude: location.latitude, longitude: location.longitude, address: (location.address || '').slice(0, 300) || undefined },
      });
      toast.success('Request sent. Finding your partner...');
      navigate(`/app/active/${request._id}`, { replace: true });
    } catch (e) {
      toast.error(getErrorMessage(e, 'Unable to create service request.'));
    } finally {
      setSubmitting(false);
    }
  };

  if ((vehicles.loading && !vehicles.data) || (services.loading && !services.data)) return <LoadingState variant="page" />;
  if (vehicles.error && !vehicles.data) return <ErrorState message={vehicles.error} onRetry={vehicles.reload} />;
  if (services.error && !services.data) return <ErrorState message={services.error} onRetry={services.reload} />;

  const last = step === STEPS.length - 1;
  return (
    <div className="pb-24">
      <PageHeader title="Request assistance" subtitle={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`} />
      <div className="mb-6 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Request progress">
        {STEPS.map((s, i) => <span key={s} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-brand-400' : 'bg-ink-200'}`} />)}
      </div>

      {step === 0 && <VehicleStep vehicles={vehicles.data} value={vehicleId} onChange={setVehicleId} onAdd={() => setAddingVehicle(true)} />}
      {step === 1 && <ServiceStep services={services.data} value={serviceCode} onChange={setServiceCode} />}
      {step === 2 && <LocationStep value={location} onChange={setLocation} />}
      {step === 3 && <DetailsStep value={details} onChange={setDetails} />}
      {step === 4 && <EstimateStep nearby={nearby} partnerId={partnerId} onSelect={setPartnerId} best={best} onBack={() => setStep(2)} />}
      {step === 5 && <ConfirmStep vehicle={vehicle} serviceCode={serviceCode} location={location} details={details} best={best} partnerName={chosen?.name} />}

      <div className="safe-bottom fixed inset-x-0 bottom-[68px] z-20 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
        <div className="mx-auto flex max-w-5xl gap-3">
          <Button variant="secondary" size="lg" icon={ArrowLeft} disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>Back</Button>
          {last
            ? <Button size="lg" full icon={Siren} loading={submitting} disabled={!best} onClick={submit}>Send request</Button>
            : <Button size="lg" full disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Continue <ArrowRight size={20} aria-hidden /></Button>}
        </div>
      </div>

      <VehicleFormModal open={addingVehicle} onClose={() => setAddingVehicle(false)} onSaved={(v) => { vehicles.reload({ silent: true }); setVehicleId(v._id); }} />
    </div>
  );
}
