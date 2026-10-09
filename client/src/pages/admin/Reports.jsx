import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import ChartCard from '../../components/ChartCard.jsx';
import { Button, ErrorState, Input, LoadingState, PageHeader, Segmented, StatsCard, Table } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { formatCurrency } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { AXIS_TICK, GRID, LEGEND_STYLE, SERIES } from './chartTheme.js';

const PERIODS = [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }];
const iso = (d) => d.toISOString().slice(0, 10);
const defaultRange = () => { const to = new Date(); const from = new Date(Date.now() - 29 * 864e5); return { from: iso(from), to: iso(to) }; };

function downloadCsv(rows, name) {
  const header = ['period', 'requests', 'completed', 'cancelled', 'revenue'];
  const csv = [header.join(','), ...rows.map((r) => header.map((h) => r[h]).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = `${name}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export default function AdminReports() {
  useDocumentTitle('Reports');
  const [range, setRange] = useState(defaultRange);
  const [applied, setApplied] = useState(range);
  const [period, setPeriod] = useState('daily');
  const { data, loading, error, reload } = useFetch(() => adminService.reports(applied), [applied.from, applied.to]);
  const invalid = !range.from || !range.to || range.from > range.to;

  return (
    <>
      <PageHeader title="Reports" subtitle="Filter by date to see volumes, completion and revenue estimates." />
      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (!invalid) setApplied(range); }}>
        <Input label="From" type="date" value={range.from} max={range.to} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
        <Input label="To" type="date" value={range.to} min={range.from} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
        <Button type="submit" size="lg" disabled={invalid}>Apply</Button>
      </form>
      {loading && !data ? <LoadingState variant="page" /> : error && !data ? <ErrorState message={error} onRetry={reload} /> : (() => {
        const { summary: s } = data;
        const series = data[period];
        const services = data.mostRequested.map((x) => ({ ...x, service: serviceLabel(x.service) }));
        return (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatsCard label="Requests" value={s.totalRequests} />
              <StatsCard label="Completed" value={s.completed} tone="success" />
              <StatsCard label="Cancellation rate" value={`${s.cancellationRate}%`} hint={`${s.cancelled} cancelled`} tone="danger" />
              <StatsCard label="Revenue estimate" value={formatCurrency(s.revenueEstimate)} hint={`${formatCurrency(s.pipelineEstimate)} in progress`} tone="brand" />
              <StatsCard label="Average rating" value={s.averageRating ? s.averageRating.toFixed(1) : '-'} hint={`${s.reviews} reviews`} tone="brand" />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Segmented label="Report period" options={PERIODS} value={period} onChange={setPeriod} />
              <Button size="sm" variant="secondary" icon={Download} disabled={!series.length} onClick={() => downloadCsv(series, `roadsideaaa-${period}-${applied.from}-${applied.to}`)}>Export CSV</Button>
            </div>
            <ChartCard className="mt-3" title={`${PERIODS.find((p) => p.value === period).label} service requests`} table={{ columns: [{ key: 'period', header: 'Period' }, { key: 'requests', header: 'Requests' }, { key: 'completed', header: 'Completed' }, { key: 'cancelled', header: 'Cancelled' }, { key: 'revenue', header: 'Revenue', render: (r) => formatCurrency(r.revenue) }], rows: series }}>
              <div className="h-64" role="img" aria-label={`Bar chart of ${period} requests and completed requests`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="period" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(22,28,34,0.06)' }} />
                    <Legend formatter={(v) => <span style={LEGEND_STYLE}>{v}</span>} />
                    <Bar dataKey="requests" name="Requests" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="completed" name="Completed" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ChartCard title="Most requested services" table={{ columns: [{ key: 'service', header: 'Service' }, { key: 'count', header: 'Requests' }], rows: services }}>
                <div className="h-64" role="img" aria-label="Bar chart of most requested services">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={services} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke={GRID} />
                      <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="service" width={120} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(22,28,34,0.06)' }} />
                      <Bar dataKey="count" name="Requests" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <div>
                <h3 className="mb-3 font-display text-2xl font-semibold">Partner completion rate</h3>
                <Table columns={[{ key: 'partner', header: 'Partner' }, { key: 'assigned', header: 'Assigned' }, { key: 'completed', header: 'Completed' }, { key: 'rate', header: 'Rate', render: (r) => `${r.completionRate}%` }]} rows={data.partnerCompletion} rowKey={(r) => r.partner} empty={<p className="rounded-2xl border border-dashed border-ink-200 bg-white p-6 text-center text-ink-500">No partner jobs in this range.</p>} />
              </div>
            </div>
          </>
        );
      })()}
    </>
  );
}
