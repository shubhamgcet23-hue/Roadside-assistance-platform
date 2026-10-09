import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CheckCircle2, Clock, IndianRupee, ShieldCheck, Star, UserCheck, Users, Wrench, XCircle } from 'lucide-react';
import ChartCard from '../../components/ChartCard.jsx';
import { ErrorState, LoadingState, PageHeader, StatsCard } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { formatCurrency } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { AXIS_TICK, GRID, LEGEND_STYLE, SERIES, shortDay } from './chartTheme.js';

const Wrap = ({ label, children }) => <div className="h-64" role="img" aria-label={label}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
const legend = <Legend formatter={(v) => <span style={LEGEND_STYLE}>{v}</span>} />;

export default function AdminDashboard() {
  useDocumentTitle('Admin dashboard');
  const { data, loading, error, reload } = useFetch(() => adminService.dashboard(), []);
  if (loading && !data) return <LoadingState variant="page" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const { kpis: k, charts: c } = data;
  const categories = c.categories.map((x) => ({ ...x, name: serviceLabel(x.name) }));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Platform health, calculated live from the database." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard icon={Users} label="Total users" value={k.totalUsers} />
        <StatsCard icon={Wrench} label="Total partners" value={k.totalPartners} hint={`${k.pendingPartners} pending review`} />
        <StatsCard icon={ShieldCheck} label="Verified partners" value={k.verifiedPartners} tone="success" />
        <StatsCard icon={Activity} label="Active requests" value={k.activeRequests} tone="info" />
        <StatsCard icon={CheckCircle2} label="Completed" value={k.completedRequests} tone="success" />
        <StatsCard icon={XCircle} label="Cancelled" value={k.cancelledRequests} tone="danger" />
        <StatsCard icon={IndianRupee} label="Total revenue (est.)" value={formatCurrency(k.totalRevenue)} tone="brand" />
        <StatsCard icon={Star} label="Average rating" value={k.averageRating ? k.averageRating.toFixed(1) : '-'} hint={`${k.totalReviews} reviews`} tone="brand" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatsCard icon={Clock} label="Avg response time" value={`${k.averageResponseMinutes} min`} />
        <StatsCard icon={Clock} label="Avg completion time" value={`${k.averageCompletionMinutes} min`} />
        <StatsCard icon={UserCheck} label="Partner acceptance rate" value={`${k.partnerAcceptanceRate}%`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard className="lg:col-span-2" title="Service requests over time" subtitle="Last 30 days" table={{ columns: [{ key: 'date', header: 'Day', render: (r) => shortDay(r.date) }, { key: 'requests', header: 'Requests' }, { key: 'completed', header: 'Completed' }, { key: 'cancelled', header: 'Cancelled' }], rows: c.requestsOverTime }}>
          <Wrap label="Line chart of requests, completed and cancelled requests per day">
            <LineChart data={c.requestsOverTime} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="date" tickFormatter={shortDay} tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={shortDay} />
              {legend}
              <Line type="monotone" dataKey="requests" name="Requests" stroke={SERIES[0]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke={SERIES[1]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke={SERIES[2]} strokeWidth={2} dot={false} />
            </LineChart>
          </Wrap>
        </ChartCard>

        <ChartCard title="Completed vs cancelled" table={{ columns: [{ key: 'name', header: 'Outcome' }, { key: 'value', header: 'Requests' }], rows: c.completedVsCancelled }}>
          <Wrap label="Donut chart of completed versus cancelled requests">
            <PieChart>
              <Pie data={c.completedVsCancelled} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} stroke="#fff" strokeWidth={2} paddingAngle={2} label={({ name, value }) => `${name} ${value}`}>
                {c.completedVsCancelled.map((_, i) => <Cell key={i} fill={SERIES[i]} />)}
              </Pie>
              <Tooltip />
              {legend}
            </PieChart>
          </Wrap>
        </ChartCard>

        <ChartCard title="Service category distribution" table={{ columns: [{ key: 'name', header: 'Service' }, { key: 'value', header: 'Requests' }], rows: categories }}>
          <Wrap label="Bar chart of requests per service category">
            <BarChart data={categories} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(22,28,34,0.06)' }} />
              <Bar dataKey="value" name="Requests" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </Wrap>
        </ChartCard>

        <ChartCard title="Revenue trend" subtitle="Estimated, last 30 days" table={{ columns: [{ key: 'date', header: 'Day', render: (r) => shortDay(r.date) }, { key: 'revenue', header: 'Revenue', render: (r) => formatCurrency(r.revenue) }], rows: c.revenueTrend }}>
          <Wrap label="Line chart of estimated revenue per day">
            <LineChart data={c.revenueTrend} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="date" tickFormatter={shortDay} tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip labelFormatter={shortDay} formatter={(v) => [formatCurrency(v), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke={SERIES[0]} strokeWidth={2} dot={false} />
            </LineChart>
          </Wrap>
        </ChartCard>

        <ChartCard title="Partner performance" subtitle="Top partners by completed jobs" table={{ columns: [{ key: 'name', header: 'Partner' }, { key: 'assigned', header: 'Assigned' }, { key: 'completed', header: 'Completed' }, { key: 'rating', header: 'Rating' }], rows: c.partnerPerformance }}>
          <Wrap label="Grouped bar chart of assigned and completed jobs per partner">
            <BarChart data={c.partnerPerformance} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(n) => n.split(' ')[0]} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(22,28,34,0.06)' }} />
              {legend}
              <Bar dataKey="assigned" name="Assigned" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="completed" name="Completed" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </Wrap>
        </ChartCard>
      </div>
    </>
  );
}
