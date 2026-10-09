import { useState } from 'react';
import { History } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader, Pagination, Segmented, StarRating, StatusBadge, Table } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { requestService } from '../../services/requests.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { STATUS_META } from '../../utils/status.js';

const FILTERS = [{ value: 'COMPLETED,CANCELLED', label: 'All' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' }];

export default function JobHistory() {
  useDocumentTitle('Job history');
  const [status, setStatus] = useState('COMPLETED,CANCELLED');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => requestService.list({ page, limit: 10, status }), [page, status]);
  const columns = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.completedAt || r.createdAt) },
    { key: 'service', header: 'Service', render: (r) => serviceLabel(r.serviceType) },
    { key: 'customer', header: 'Customer', render: (r) => r.userId?.name || '-' },
    { key: 'location', header: 'Location', className: 'max-w-[220px] truncate', render: (r) => r.breakdownLocation?.address || '-' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge meta={STATUS_META} value={r.status} /> },
    { key: 'earn', header: 'Earnings', render: (r) => (r.status === 'COMPLETED' ? formatCurrency(r.finalCost ?? r.estimatedCost) : '-') },
    { key: 'rating', header: 'Rating', render: (r) => (r.rating ? <StarRating value={r.rating} size={14} /> : '-') },
  ];
  return (
    <>
      <PageHeader title="Job history" />
      <div className="mb-4"><Segmented label="Filter" options={FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} /></div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <Table columns={columns} rows={data?.requests} loading={loading && !data} empty={<EmptyState icon={History} title="No jobs yet" description="Completed jobs will appear here." />} />
          <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
