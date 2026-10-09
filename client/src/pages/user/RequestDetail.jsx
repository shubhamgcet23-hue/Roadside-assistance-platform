import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flag } from 'lucide-react';
import ComplaintModal from '../../components/ComplaintModal.jsx';
import LazyMap from '../../components/LazyMap.jsx';
import ReviewForm from '../../components/ReviewForm.jsx';
import ServiceSummary from '../../components/ServiceSummary.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { Button, Card, ErrorState, LoadingState, PageHeader, StarRating, StatusBadge } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { requestService } from '../../services/requests.js';
import { ACTIVE_STATUSES, STATUS_META } from '../../utils/status.js';
import { formatDateTime } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';

export default function RequestDetail() {
  useDocumentTitle('Service details');
  const { id } = useParams();
  const [complaintOpen, setComplaintOpen] = useState(false);
  const { data, loading, error, reload } = useFetch(async () => {
    const [request, invoice] = await Promise.all([requestService.get(id), requestService.invoice(id)]);
    return { request, invoice };
  }, [id]);

  if (loading && !data) return <LoadingState variant="page" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const { request: r, invoice } = data;
  const spot = r.breakdownLocation;

  return (
    <>
      <PageHeader title={serviceLabel(r.serviceType)} subtitle={formatDateTime(r.createdAt)} actions={<StatusBadge meta={STATUS_META} value={r.status} />} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {ACTIVE_STATUSES.includes(r.status) && <Button to={`/app/active/${r._id}`} full size="lg">Track this request</Button>}
          <Card><StatusTimeline status={r.status} reason={r.cancellationReason} /></Card>
          <Card padded={false} className="overflow-hidden">
            <LazyMap center={[spot.latitude, spot.longitude]} zoom={15} markers={[{ id: 'spot', position: [spot.latitude, spot.longitude], kind: 'user', label: 'Breakdown location' }]} className="h-56 rounded-none" />
            <p className="p-4 text-sm text-ink-700">{spot.address}</p>
          </Card>
          {r.issue || r.description ? <Card><h2 className="font-display text-2xl font-semibold">Problem</h2>{r.issue && <p className="mt-1 font-medium">{r.issue}</p>}{r.description && <p className="text-ink-600">{r.description}</p>}</Card> : null}
        </div>
        <div className="space-y-4">
          <ServiceSummary invoice={invoice} requestId={r._id} />
          {r.status === 'COMPLETED' && (
            <Card>
              <h2 className="mb-2 font-display text-2xl font-semibold">Your review</h2>
              {r.rating ? <div><StarRating value={r.rating} />{r.review && <p className="mt-2 text-ink-700">{r.review}</p>}</div>
                : <ReviewForm requestId={r._id} partnerName={r.partnerId?.name} onDone={() => reload({ silent: true })} />}
            </Card>
          )}
          {r.partnerId && r.status !== 'SEARCHING' && <Button variant="secondary" icon={Flag} onClick={() => setComplaintOpen(true)}>Report a problem</Button>}
          <Link to="/app/history" className="block text-sm font-semibold underline">Back to history</Link>
        </div>
      </div>
      <ComplaintModal open={complaintOpen} onClose={() => setComplaintOpen(false)} requestId={r._id} />
    </>
  );
}
