import { Users } from 'lucide-react';
import PartnerCard from '../../../components/PartnerCard.jsx';
import PriceBreakdown from '../../../components/PriceBreakdown.jsx';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';

/** Step 5: nearby verified partners, ETA and the estimated price. Choosing a partner is optional. */
export default function EstimateStep({ nearby, partnerId, onSelect, best, onBack }) {
  if (nearby.loading && !nearby.data) return <LoadingState variant="list" count={3} />;
  if (nearby.error && !nearby.data) return <ErrorState message={nearby.error} onRetry={nearby.reload} />;
  const partners = nearby.data?.partners || [];
  if (!partners.length) {
    return <EmptyState icon={Users} title="No mechanics available nearby." description="Try a different location or service, or check again in a few minutes." action={<Button variant="secondary" onClick={onBack}>Change location</Button>} />;
  }
  const anyAvailable = partners.some((p) => p.availability === 'AVAILABLE');
  return (
    <div className="space-y-4">
      {best && (
        <Card className="bg-ink-950 text-white">
          <p className="text-sm text-ink-300">{partnerId ? 'Your selected partner' : 'Closest available partner'}</p>
          <p className="font-display text-3xl font-semibold">{best.name}</p>
          <div className="mt-3 rounded-xl bg-white p-4 text-ink-900"><PriceBreakdown pricing={best.pricing} /></div>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-semibold">{partners.length} partner{partners.length > 1 ? 's' : ''} nearby</h3>
        {partnerId && <Button size="sm" variant="ghost" onClick={() => onSelect(null)}>Send to all nearby</Button>}
      </div>
      {!anyAvailable && <p role="alert" className="rounded-xl bg-brand-50 px-4 py-3 text-sm">Partners nearby are busy right now. You cannot send a request until one becomes available.</p>}
      <div className="space-y-3">
        {partners.map((p) => <PartnerCard key={p.partnerId} partner={p} selected={partnerId === p.partnerId} onSelect={(x) => onSelect(x.partnerId)} />)}
      </div>
      <p className="text-sm text-ink-500">Tap a partner to request them directly, or continue and we will alert every available partner nearby.</p>
    </div>
  );
}
