import { ClipboardList } from 'lucide-react';
import IncomingRequestCard from '../../components/IncomingRequestCard.jsx';
import VerificationBanner from '../../components/VerificationBanner.jsx';
import { Button, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useSocketEvents } from '../../hooks/useSocketEvent.js';
import { requestService } from '../../services/requests.js';
import { usePartnerActions } from './usePartnerActions.js';

const LIVE_EVENTS = ['service-request-created', 'request-taken', 'request-cancelled'];

export default function PartnerRequests() {
  useDocumentTitle('Incoming requests');
  const { partnerProfile } = useAuth();
  const { data, loading, error, reload } = useFetch(() => requestService.openForPartner(), []);
  useSocketEvents(LIVE_EVENTS, () => reload({ silent: true }));
  const { accept, reject } = usePartnerActions(() => reload({ silent: true }));
  const online = partnerProfile?.availability === 'AVAILABLE';

  return (
    <>
      <PageHeader title="Incoming requests" subtitle="Requests near you appear here in real time." />
      <VerificationBanner />
      {loading && !data ? <LoadingState variant="list" count={3} />
        : error && !data ? <ErrorState message={error} onRetry={reload} />
          : data.length === 0 ? <EmptyState icon={ClipboardList} title="No requests right now" description={online ? 'You are online. We will alert you when someone nearby needs help.' : 'You are not online, so you will not receive requests.'} action={!online && <Button to="/partner/availability">Go online</Button>} />
            : <div className="space-y-3">{data.map((r) => <IncomingRequestCard key={r._id} request={r} onAccept={accept} onReject={reject} />)}</div>}
    </>
  );
}
