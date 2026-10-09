import { CheckCircle2, Circle, Power } from 'lucide-react';
import { Button, Card, ErrorState, LoadingState, PageHeader, StatusBadge } from '../../components/ui/index.js';
import VerificationBanner from '../../components/VerificationBanner.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage } from '../../services/api.js';
import { partnerService } from '../../services/partners.js';
import { AVAILABILITY_META } from '../../utils/status.js';
import { useState } from 'react';

const Check = ({ ok, children }) => (
  <li className="flex items-center gap-2 text-sm">{ok ? <CheckCircle2 size={18} className="text-go-600" aria-hidden /> : <Circle size={18} className="text-ink-300" aria-hidden />}<span className={ok ? '' : 'text-ink-600'}>{children}</span></li>
);

export default function Availability() {
  useDocumentTitle('Availability');
  const toast = useToast();
  const { refresh } = useAuth();
  const { data: profile, loading, error, reload } = useFetch(() => partnerService.profile(), []);
  const [busy, setBusy] = useState(false);

  if (loading && !profile) return <LoadingState variant="page" />;
  if (error && !profile) return <ErrorState message={error} onRetry={reload} />;

  const set = async (availability) => {
    setBusy(true);
    try {
      await partnerService.setAvailability(availability);
      toast.success(availability === 'AVAILABLE' ? 'You are online' : 'You are offline');
      await Promise.all([reload({ silent: true }), refresh().catch(() => {})]);
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };
  const [lng, lat] = profile.location?.coordinates || [0, 0];
  const verified = profile.verificationStatus === 'VERIFIED';
  const placed = Boolean(lat || lng);
  const online = profile.availability === 'AVAILABLE';

  return (
    <>
      <PageHeader title="Availability" subtitle="Only online, verified partners receive requests." />
      <VerificationBanner />
      <Card className="text-center">
        <StatusBadge meta={AVAILABILITY_META} value={profile.availability} icon={Power} />
        <p className="mt-3 font-display text-5xl font-bold">{online ? 'You are online' : profile.availability === 'BUSY' ? 'On a job' : 'You are offline'}</p>
        <div className="mx-auto mt-6 max-w-sm">
          {profile.availability === 'BUSY' ? <p className="text-ink-600">Finish your active job to become available again.</p>
            : online ? <Button size="xl" full variant="secondary" loading={busy} onClick={() => set('OFFLINE')}>Go offline</Button>
              : <Button size="xl" full loading={busy} onClick={() => set('AVAILABLE')}>Go online</Button>}
        </div>
      </Card>
      <Card className="mt-4">
        <h2 className="mb-3 font-display text-2xl font-semibold">Before you can go online</h2>
        <ul className="space-y-2"><Check ok={verified}>Profile verified by an admin</Check><Check ok={placed}>Base location set in your profile</Check><Check ok={profile.services?.length > 0}>At least one service offered</Check></ul>
      </Card>
    </>
  );
}
