import { useNavigate } from 'react-router-dom';
import { Car, History, Phone, Plus, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import RequestListItem from '../../components/RequestListItem.jsx';
import ServiceCard from '../../components/ServiceCard.jsx';
import VehicleCard from '../../components/VehicleCard.jsx';
import { Button, Card, EmptyState, ErrorState, LoadingState, StatusBadge } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useRequestLive } from '../../hooks/useRequestLive.js';
import { catalogService } from '../../services/catalog.js';
import { requestService } from '../../services/requests.js';
import { vehicleService } from '../../services/vehicles.js';
import { STATUS_META } from '../../utils/status.js';
import { formatTime } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';

export default function UserDashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();
  const services = useFetch(() => catalogService.list(), []);
  const active = useFetch(() => requestService.active(), []);
  const recent = useFetch(() => requestService.list({ limit: 3 }), []);
  const vehicles = useFetch(() => vehicleService.list(), []);

  useRequestLive(active.data?._id, () => active.reload({ silent: true }));

  const start = (service) => navigate(`/app/request?service=${service.code}`);
  const request = active.data;

  return (
    <div className="space-y-8">
      <section className="on-dark relative overflow-hidden rounded-3xl bg-ink-950 p-6 text-white sm:p-10">
        <p className="text-sm font-semibold text-brand-400">Hello, {user.name.split(' ')[0]}</p>
        <h1 className="mt-1 font-display text-5xl font-bold leading-none sm:text-7xl">Need roadside assistance?</h1>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button to="/app/request" size="xl" icon={Siren}>Request Assistance</Button>
          <a href="tel:112" className="inline-flex h-16 items-center gap-2 rounded-xl border border-white/30 px-6 font-semibold hover:bg-white/10"><Phone size={20} aria-hidden /> Emergency 112</a>
        </div>
        <div className="hazard absolute inset-x-0 bottom-0 h-1.5" aria-hidden />
      </section>

      {request && (
        <Card className="border-ink-900 ring-2 ring-brand-400">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-600">Active request</p>
              <h2 className="font-display text-3xl font-semibold">{serviceLabel(request.serviceType)}</h2>
              <p className="mt-1 text-sm text-ink-600">
                {request.partnerId?.name ? `${request.partnerId.name} assigned` : 'Finding a partner near you'}
                {request.estimatedArrivalTime && ` · ETA ${formatTime(request.estimatedArrivalTime)}`}
              </p>
            </div>
            <div className="flex items-center gap-3"><StatusBadge meta={STATUS_META} value={request.status} /><Button to={`/app/active/${request._id}`}>Track</Button></div>
          </div>
        </Card>
      )}

      <section aria-labelledby="svc">
        <h2 id="svc" className="mb-3 font-display text-3xl font-semibold">What do you need?</h2>
        {services.loading && !services.data ? <LoadingState />
          : services.error && !services.data ? <ErrorState message={services.error} onRetry={services.reload} />
            : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{services.data.map((s) => <ServiceCard key={s._id} service={s} onSelect={start} />)}</div>}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="veh">
          <div className="mb-3 flex items-center justify-between"><h2 id="veh" className="font-display text-3xl font-semibold">Saved vehicles</h2><Link to="/app/vehicles" className="text-sm font-semibold underline">Manage</Link></div>
          {vehicles.loading && !vehicles.data ? <LoadingState variant="list" count={1} />
            : vehicles.data?.length ? <div className="space-y-3">{vehicles.data.slice(0, 2).map((v) => <VehicleCard key={v._id} vehicle={v} compact />)}</div>
              : <EmptyState icon={Car} title="No vehicles yet" description="Add your vehicle so requests take one tap." action={<Button to="/app/vehicles" icon={Plus}>Add a vehicle</Button>} />}
        </section>
        <section aria-labelledby="hist">
          <div className="mb-3 flex items-center justify-between"><h2 id="hist" className="font-display text-3xl font-semibold">Recent services</h2><Link to="/app/history" className="text-sm font-semibold underline">View all</Link></div>
          {recent.loading && !recent.data ? <LoadingState variant="list" count={2} />
            : recent.data?.requests?.length ? <div className="space-y-2">{recent.data.requests.map((r) => <RequestListItem key={r._id} request={r} to={`/app/history/${r._id}`} />)}</div>
              : <EmptyState icon={History} title="No service history" description="Your completed services will show up here." action={<Button to="/app/request">Request assistance</Button>} />}
        </section>
      </div>
    </div>
  );
}
