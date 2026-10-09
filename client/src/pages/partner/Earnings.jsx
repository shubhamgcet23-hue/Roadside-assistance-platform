import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, Briefcase, CalendarDays, Wallet } from 'lucide-react';
import ChartCard from '../../components/ChartCard.jsx';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatsCard, Table } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { partnerService } from '../../services/partners.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';

const BLUE = '#2a78d6';
const shortDay = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function Earnings() {
  useDocumentTitle('Earnings');
  const { data, loading, error, reload } = useFetch(() => partnerService.earnings(), []);
  if (loading && !data) return <LoadingState variant="page" />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const { totals, daily, history } = data;
  const columns = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.completedAt) },
    { key: 'service', header: 'Service', render: (r) => serviceLabel(r.serviceType) },
    { key: 'customer', header: 'Customer', render: (r) => r.userId?.name || '-' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.finalCost ?? r.estimatedCost) },
  ];
  return (
    <>
      <PageHeader title="Earnings" subtitle="Based on completed jobs. Customers pay you directly." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard icon={Wallet} label="Today" value={formatCurrency(totals.today)} tone="brand" />
        <StatsCard icon={CalendarDays} label="Last 7 days" value={formatCurrency(totals.week)} />
        <StatsCard icon={Banknote} label="Last 30 days" value={formatCurrency(totals.month)} />
        <StatsCard icon={Briefcase} label="All time" value={formatCurrency(totals.allTime)} hint={`${totals.jobs} jobs`} tone="success" />
      </div>
      <ChartCard className="mt-6" title="Last 14 days" subtitle="Earnings per day" table={{ columns: [{ key: 'date', header: 'Day', render: (r) => shortDay(r.date) }, { key: 'amount', header: 'Earnings', render: (r) => formatCurrency(r.amount) }, { key: 'jobs', header: 'Jobs' }], rows: daily }}>
        <div className="h-64" role="img" aria-label="Bar chart of earnings per day for the last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e8ecf0" />
              <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 12, fill: '#485766' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12, fill: '#485766' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip cursor={{ fill: 'rgba(22,28,34,0.06)' }} labelFormatter={shortDay} formatter={(v) => [formatCurrency(v), 'Earnings']} />
              <Bar dataKey="amount" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <h2 className="mb-3 mt-8 font-display text-3xl font-semibold">Recent completed jobs</h2>
      <Table columns={columns} rows={history} empty={<EmptyState icon={Wallet} title="No earnings yet" description="Complete a job to see your earnings." />} />
    </>
  );
}
