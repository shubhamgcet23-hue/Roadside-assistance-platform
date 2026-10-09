import { Activity, Briefcase, CheckCircle2, ClipboardList, Navigation, Power, Star, Wallet } from 'lucide-react';
import IncomingRequestCard from '../../components/IncomingRequestCard.jsx';
import VerificationBanner from '../../components/VerificationBanner.jsx';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatsCard, StatusBadge } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useSocketEvents } from '../../hooks/useSocketEvent.js';
import { partnerService } from '../../services/partners.js';
import { requestService } from '../../services/requests.js';
import { formatCurrency } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { AVAILABILITY_META, STATUS_META } from '../../utils/status.js';
import { usePartnerActions } from './usePartnerActions.js';

const LIVE_EVENTS = ['service-request-created', 'request-taken', 'request-cancelled'];

export default function PartnerDashboard() {
  useDocumentTitle('Dashboard');
  const { user, partnerProfile } = useAuth();
  const stats = useFetch(() => partnerService.dashboard(), []);
  const open = useFetch(() => requestService.openForPartner(), []);
  const job = useFetch(() => requestService.active(), []);
  const refreshAll = () => { stats.reload({ silent: true }); open.reload({ silent: true }); job.reload({ silent: true }); };
  useSocketEvents(LIVE_EVENTS, refreshAll);
  const { accept, reject } = usePartnerActions(refreshAll);

  if (stats.loading && !stats.data) return <LoadingState variant="page" />;
  if (stats.error && !stats.data) return <ErrorState message={stats.error} onRetry={stats.reload} />;
  const s = stats.data.stats;
  const availability = partnerProfile?.availability || stats.data.profile.availability;

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Here is how today is going." actions={<><StatusBadge meta={AVAILABILITY_META} value={availability} icon={Power} /><Button to="/partner/availability" size="sm" variant="secondary">Change</Button></>} />
      <VerificationBanner />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatsCard icon={Briefcase} label="Today's jobs" value={s.todaysJobs} />
        <StatsCard icon={Activity} label="Active" value={s.activeRequests} tone="info" />
        <StatsCard icon={CheckCircle2} label="Completed" value={s.completedJobs} tone="success" />
        <StatsCard icon={Wallet} label="Today's earnings" value={formatCurrency(s.todaysEarnings)} tone="brand" />
        <StatsCard icon={Star} label="Rating" value={s.rating ? s.rating.toFixed(1) : 'New'} hint={`${s.reviews} reviews`} tone="brand" />
      </div>

      {job.data && (
        <Card className="mt-6 border-ink-900 ring-2 ring-brand-400">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-semibold text-ink-600">Active job</p><h2 className="font-display text-3xl font-semibold">{serviceLabel(job.data.serviceType)}</h2><p className="text-sm text-ink-600">{job.data.userId?.name} · {job.data.breakdownLocation?.address}</p></div>
            <div className="flex items-center gap-3"><Badge tone="info">{STATUS_META[job.data.status]?.label}</Badge><Button to="/partner/active" icon={Navigation}>Open job</Button></div>
          </div>
        </Card>
      )}

      <section className="mt-8" aria-labelledby="inc">
        <h2 id="inc" className="mb-3 font-display text-3xl font-semibold">Incoming requests</h2>
        {open.loading && !open.data ? <LoadingState variant="list" count={2} />
          : open.data?.length ? <div className="space-y-3">{open.data.slice(0, 3).map((r) => <IncomingRequestCard key={r._id} request={r} onAccept={accept} onReject={reject} />)}</div>
            : <EmptyState icon={ClipboardList} title="No requests right now" description={availability === 'AVAILABLE' ? 'You are online. New requests nearby will pop up here instantly.' : 'Go online to start receiving requests.'} action={availability !== 'AVAILABLE' && <Button to="/partner/availability">Go online</Button>} />}
      </section>
    </>
  );
}
