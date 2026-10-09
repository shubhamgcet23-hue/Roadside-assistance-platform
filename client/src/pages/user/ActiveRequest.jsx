import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FlaskConical, MapPin, Phone, Siren, X } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import LazyMap from '../../components/LazyMap.jsx';
import PriceBreakdown from '../../components/PriceBreakdown.jsx';
import ReviewForm from '../../components/ReviewForm.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, StarRating, StatusBadge, Textarea } from '../../components/ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCountdown, useCountdown } from '../../hooks/useCountdown.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useRequestLive } from '../../hooks/useRequestLive.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { getErrorMessage } from '../../services/api.js';
import { requestService } from '../../services/requests.js';
import { formatDistance, formatEta, formatTime } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { CANCELLABLE, STATUS_META } from '../../utils/status.js';

function SearchingBanner({ expiresAt }) {
  const left = useCountdown(expiresAt);
  return (
    <Card className="bg-brand-50">
      <p className="font-display text-2xl font-semibold">Finding a partner near you...</p>
      <p className="text-ink-700">Nearby partners have been alerted. {left > 0 ? `Offer stays open for ${formatCountdown(left)}.` : 'The offer window has ended.'}</p>
    </Card>
  );
}

export default function ActiveRequest() {
  useDocumentTitle('Active request');
  const { id } = useParams();
  const toast = useToast();
  const idRef = useRef(id);
  if (id) idRef.current = id;
  const { data: request, loading, error, reload } = useFetch(async () => {
    const r = idRef.current ? await requestService.get(idRef.current) : await requestService.active();
    if (r) idRef.current = r._id;
    return r;
  }, [id]);
  const [live, setLive] = useState(null); // latest mechanic position from Socket.IO
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useRequestLive(request?._id, () => reload({ silent: true }));
  useSocketEvent('location-updated', (p) => { if (String(p.requestId) === String(request?._id)) setLive(p); });

  const cancel = async () => {
    setBusy(true);
    try { await requestService.cancel(request._id, reason.trim() || undefined); toast.success('Request cancelled'); setCancelOpen(false); reload({ silent: true }); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  if (loading && !request) return <LoadingState variant="page" />;
  if (error && !request) return <ErrorState message={error} onRetry={reload} />;
  if (!request) {
    return <EmptyState icon={Siren} title="No active request" description="When you request assistance, you can track it here." action={<Button to="/app/request">Request assistance</Button>} />;
  }

  const { status, partnerId: partner, partnerProfile, breakdownLocation: spot } = request;
  const mechanicPos = live ? { latitude: live.latitude, longitude: live.longitude } : partnerProfile?.location;
  const hasMech = Boolean(partner && mechanicPos && (mechanicPos.latitude || mechanicPos.longitude) && ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(status));
  const markers = [{ id: 'me', position: [spot.latitude, spot.longitude], kind: 'user', label: 'You are here' }];
  if (hasMech) markers.push({ id: 'mech', position: [mechanicPos.latitude, mechanicPos.longitude], kind: 'mechanic', label: partner.name });
  const eta = live?.etaMinutes ?? (request.estimatedArrivalTime ? Math.max(1, Math.round((new Date(request.estimatedArrivalTime) - Date.now()) / 60000)) : null);
  const done = status === 'COMPLETED' || status === 'CANCELLED';

  return (
    <>
      <PageHeader title={serviceLabel(request.serviceType)} subtitle={spot.address} actions={<StatusBadge meta={STATUS_META} value={status} />} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {status === 'SEARCHING' && <SearchingBanner expiresAt={request.offerExpiresAt} />}
          <Card padded={false} className="overflow-hidden">
            <LazyMap markers={markers} center={[spot.latitude, spot.longitude]} fit={hasMech} className="h-72 rounded-none sm:h-96" />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 p-4 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium"><MapPin size={16} aria-hidden /> {live ? `${formatDistance(live.distanceKm)} away` : spot.address}</span>
              {eta != null && !done && <span className="font-medium">ETA {formatEta(eta)}</span>}
              {request.estimatedArrivalTime && !done && <span className="text-ink-500">around {formatTime(request.estimatedArrivalTime)}</span>}
              {live?.demo && <Badge tone="warning" icon={FlaskConical}>Demo Tracking Mode</Badge>}
            </div>
          </Card>
          {status === 'COMPLETED' && (
            <Card>
              <h2 className="font-display text-3xl font-semibold">Service completed</h2>
              {request.rating ? <p className="mt-2 flex items-center gap-2">Your rating <StarRating value={request.rating} /></p>
                : <div className="mt-3"><ReviewForm requestId={request._id} partnerName={partner?.name} onDone={() => reload({ silent: true })} /></div>}
              <Link to={`/app/history/${request._id}`} className="mt-3 inline-block text-sm font-semibold underline">View service summary</Link>
            </Card>
          )}
          {status === 'CANCELLED' && <Card><StatusTimeline status={status} reason={request.cancellationReason} /><Button className="mt-4" to="/app/request">Request again</Button></Card>}
        </div>

        <div className="space-y-4">
          {partner && (
            <Card>
              <div className="flex items-center gap-3">
                <Avatar name={partner.name} src={partner.avatar} size="lg" />
                <div className="min-w-0"><p className="font-display text-2xl font-semibold leading-tight">{partner.name}</p>
                  {partnerProfile && <p className="flex items-center gap-1 text-sm text-ink-600"><StarRating value={partnerProfile.ratingAverage} size={14} /> {partnerProfile.ratingAverage || 'New'} · {partnerProfile.jobsCompleted} jobs</p>}</div>
              </div>
              {partner.phone && <Button className="mt-3" full variant="secondary" icon={Phone} href={`tel:${partner.phone}`}>Call {partner.name.split(' ')[0]}</Button>}
            </Card>
          )}
          {status !== 'CANCELLED' && <Card><StatusTimeline status={status} /></Card>}
          <Card><PriceBreakdown pricing={request.pricing} final={status === 'COMPLETED'} total={status === 'COMPLETED' ? request.finalCost : undefined} /></Card>
          {CANCELLABLE.includes(status) && <Button full variant="secondary" icon={X} onClick={() => setCancelOpen(true)}>Cancel request</Button>}
        </div>
      </div>
      <ConfirmModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancel} loading={busy} danger confirmLabel="Cancel request" title="Cancel this request?">
        <Textarea aria-label="Reason (optional)" placeholder="Reason (optional)" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmModal>
    </>
  );
}
