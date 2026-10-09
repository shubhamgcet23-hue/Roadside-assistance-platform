import { useState } from 'react';
import { Navigation, Phone } from 'lucide-react';
import LazyMap from '../../components/LazyMap.jsx';
import LocationSharing from '../../components/LocationSharing.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { Button, Card, EmptyState, ErrorState, Input, LoadingState, Modal, PageHeader, StatusBadge } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useRequestLive } from '../../hooks/useRequestLive.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { getErrorMessage } from '../../services/api.js';
import { directionsUrl } from '../../services/location.js';
import { requestService } from '../../services/requests.js';
import { formatCurrency, formatDistance } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { NEXT_ACTION, STATUS_META } from '../../utils/status.js';

export default function ActiveJob() {
  useDocumentTitle('Active job');
  const toast = useToast();
  const { refresh } = useAuth();
  const { data: job, loading, error, reload } = useFetch(() => requestService.active(), []);
  const [mine, setMine] = useState(null);
  const [live, setLive] = useState(null);
  const [busy, setBusy] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [finalCost, setFinalCost] = useState('');

  useRequestLive(job?._id, () => reload({ silent: true }));
  useSocketEvent('location-updated', (p) => { if (String(p.requestId) === String(job?._id)) setLive(p); });

  const advance = async (to, extra) => {
    setBusy(true);
    try {
      await requestService.setStatus(job._id, to, extra);
      if (to === 'COMPLETED') { toast.success('Job completed. Nice work!'); setCompleting(false); await refresh().catch(() => {}); }
      await reload({ silent: true });
    } catch (e) { toast.error(getErrorMessage(e, 'Could not update the job status.')); } finally { setBusy(false); }
  };

  if (loading && !job) return <LoadingState variant="page" />;
  if (error && !job) return <ErrorState message={error} onRetry={reload} />;
  if (!job) return <EmptyState icon={Navigation} title="No active job" description="Accept a request to start a job." action={<Button to="/partner/requests">View requests</Button>} />;

  const spot = job.breakdownLocation;
  const pos = mine || (live && { latitude: live.latitude, longitude: live.longitude }) || job.partnerProfile?.location;
  const markers = [{ id: 'cust', position: [spot.latitude, spot.longitude], kind: 'user', label: 'Customer' }];
  if (pos && (pos.latitude || pos.longitude)) markers.push({ id: 'me', position: [pos.latitude, pos.longitude], kind: 'mechanic', label: 'You' });
  const next = NEXT_ACTION[job.status];
  const v = job.vehicleId;

  return (
    <>
      <PageHeader title={serviceLabel(job.serviceType)} subtitle={spot.address} actions={<StatusBadge meta={STATUS_META} value={job.status} />} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card padded={false} className="overflow-hidden">
            <LazyMap markers={markers} center={[spot.latitude, spot.longitude]} fit={markers.length > 1} className="h-72 rounded-none sm:h-96" />
            <div className="flex flex-wrap items-center gap-3 p-4">
              <Button href={directionsUrl(spot.latitude, spot.longitude)} target="_blank" rel="noreferrer" icon={Navigation}>Navigate</Button>
              {live && <span className="text-sm font-medium">{formatDistance(live.distanceKm)} to customer</span>}
            </div>
          </Card>
          <LocationSharing requestId={job._id} onPosition={setMine} />
        </div>
        <div className="space-y-4">
          <Card>
            <h2 className="font-display text-2xl font-semibold">Customer</h2>
            <p className="mt-1 font-medium">{job.userId?.name}</p>
            {job.userId?.phone && <Button className="mt-2" variant="secondary" icon={Phone} href={`tel:${job.userId.phone}`} full>Call customer</Button>}
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">Vehicle</dt><dd className="font-medium">{v?.make ? `${v.make} ${v.model}` : '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-600">Registration</dt><dd className="font-medium">{v?.registrationNumber || '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-600">Estimated pay</dt><dd className="font-medium">{formatCurrency(job.estimatedCost)}</dd></div>
            </dl>
            {(job.issue || job.description) && <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-700">{job.issue || job.description}</p>}
          </Card>
          <Card><StatusTimeline status={job.status} /></Card>
          {next && (
            <Button size="xl" full loading={busy} onClick={() => (next.to === 'COMPLETED' ? (setFinalCost(String(job.estimatedCost ?? '')), setCompleting(true)) : advance(next.to))}>{next.label}</Button>
          )}
        </div>
      </div>
      <Modal open={completing} onClose={() => setCompleting(false)} title="Complete service" footer={(<><Button variant="secondary" onClick={() => setCompleting(false)}>Back</Button><Button loading={busy} onClick={() => advance('COMPLETED', finalCost === '' ? undefined : { finalCost: Number(finalCost) })}>Complete</Button></>)}>
        <Input label="Final amount (INR)" type="number" min="0" inputMode="numeric" value={finalCost} onChange={(e) => setFinalCost(e.target.value)} hint="Defaults to the estimate. Collect payment from the customer directly." />
      </Modal>
    </>
  );
}
