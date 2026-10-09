import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon } from 'lucide-react';
import { Button, EmptyState, ErrorState, PageHeader, Pagination, Segmented, StarRating, StatusBadge, Table } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { requestService } from '../../services/requests.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { STATUS_META } from '../../utils/status.js';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING,SEARCHING,ACCEPTED,ON_THE_WAY,ARRIVED,IN_PROGRESS', label: 'Active' },
];

export default function History() {
  useDocumentTitle('Service history');
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => requestService.list({ page, limit: 10, status: status || undefined }), [page, status]);

  const columns = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'vehicle', header: 'Vehicle', render: (r) => (r.vehicleId?.make ? `${r.vehicleId.make} ${r.vehicleId.model}` : '-') },
    { key: 'service', header: 'Service', render: (r) => serviceLabel(r.serviceType) },
    { key: 'partner', header: 'Partner', render: (r) => r.partnerId?.name || '-' },
    { key: 'location', header: 'Location', className: 'max-w-[220px] truncate', render: (r) => r.breakdownLocation?.address || '-' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge meta={STATUS_META} value={r.status} /> },
    { key: 'cost', header: 'Cost', render: (r) => formatCurrency(r.finalCost ?? r.estimatedCost) },
    { key: 'rating', header: 'Rating', render: (r) => (r.rating ? <StarRating value={r.rating} size={14} /> : '-') },
  ];

  return (
    <>
      <PageHeader title="Service history" />
      <div className="mb-4"><Segmented label="Filter by status" options={FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} /></div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <Table columns={columns} rows={data?.requests} loading={loading && !data} onRowClick={(r) => navigate(`/app/history/${r._id}`)}
            empty={<EmptyState icon={HistoryIcon} title="No service history" description="Your requests will appear here." action={<Button to="/app/request">Request assistance</Button>} />} />
          <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
