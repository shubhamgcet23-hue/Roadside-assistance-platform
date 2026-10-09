import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader, Pagination, Segmented, StatusBadge, Table } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useSocketEvents } from '../../hooks/useSocketEvent.js';
import { adminService } from '../../services/admin.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { STATUS_META } from '../../utils/status.js';

const FILTERS = [
  { value: 'active', label: 'Active jobs' }, { value: '', label: 'All' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminRequests() {
  useDocumentTitle('Service requests');
  const [filter, setFilter] = useState('active');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => adminService.requests({ page, limit: 10, ...(filter === 'active' ? { active: true } : filter ? { status: filter } : {}) }), [filter, page]);
  useSocketEvents(['request-created', 'request-accepted', 'mechanic-on-the-way', 'mechanic-arrived', 'service-started', 'service-completed', 'request-cancelled'], () => reload({ silent: true }));
  const columns = [
    { key: 'date', header: 'Created', render: (r) => formatDateTime(r.createdAt) },
    { key: 'customer', header: 'Customer', render: (r) => r.userId?.name || '-' },
    { key: 'service', header: 'Service', render: (r) => serviceLabel(r.serviceType) },
    { key: 'partner', header: 'Partner', render: (r) => r.partnerId?.name || '-' },
    { key: 'location', header: 'Location', className: 'max-w-[220px] truncate', render: (r) => r.breakdownLocation?.address || '-' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge meta={STATUS_META} value={r.status} /> },
    { key: 'cost', header: 'Amount', render: (r) => formatCurrency(r.finalCost ?? r.estimatedCost) },
  ];
  return (
    <>
      <PageHeader title="Service requests" subtitle="Monitor active jobs as they happen." />
      <div className="mb-4"><Segmented label="Filter requests" options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} /></div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <Table columns={columns} rows={data?.requests} loading={loading && !data} empty={<EmptyState icon={ClipboardList} title="No requests" description="Nothing matches this filter." />} />
          <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
