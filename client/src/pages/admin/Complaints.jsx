import { useEffect, useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { Button, EmptyState, ErrorState, Modal, PageHeader, Pagination, Segmented, Select, StatusBadge, Table, Textarea } from '../../components/ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { getErrorMessage } from '../../services/api.js';
import { complaintService } from '../../services/feedback.js';
import { COMPLAINT_CATEGORIES, PRIORITIES } from '../../types/constants.js';
import { formatDate, humanize } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { COMPLAINT_META, PRIORITY_META } from '../../utils/status.js';

const FILTERS = [{ value: '', label: 'All' }, { value: 'OPEN', label: 'Open' }, { value: 'UNDER_REVIEW', label: 'Under review' }, { value: 'RESOLVED', label: 'Resolved' }, { value: 'REJECTED', label: 'Rejected' }];
const STATUS_OPTIONS = FILTERS.filter((f) => f.value);
const categoryLabel = (v) => COMPLAINT_CATEGORIES.find((c) => c.value === v)?.label || humanize(v);

function ComplaintEditor({ complaint, onClose, onSaved }) {
  const toast = useToast();
  const [status, setStatus] = useState('OPEN');
  const [priority, setPriority] = useState('MEDIUM');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (complaint) { setStatus(complaint.status); setPriority(complaint.priority); setNote(complaint.adminNote || ''); } }, [complaint]);
  if (!complaint) return null;
  const save = async () => {
    setSaving(true);
    try { await complaintService.update(complaint._id, { status, priority, adminNote: note.trim() || undefined }); toast.success('Complaint updated'); onSaved(); onClose(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setSaving(false); }
  };
  const r = complaint.requestId;
  return (
    <Modal open onClose={onClose} title="Complaint" footer={(<><Button variant="secondary" onClick={onClose}>Close</Button><Button loading={saving} onClick={save}>Save</Button></>)}>
      <div className="space-y-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-500">Customer</dt><dd className="font-medium">{complaint.userId?.name} ({complaint.userId?.email})</dd></div>
          <div><dt className="text-ink-500">Category</dt><dd className="font-medium">{categoryLabel(complaint.category)}</dd></div>
          <div><dt className="text-ink-500">Request</dt><dd className="font-medium">{r ? `${serviceLabel(r.serviceType)} · ${formatDate(r.createdAt)}` : '-'}</dd></div>
          <div><dt className="text-ink-500">Partner</dt><dd className="font-medium">{r?.partnerId?.name || '-'}</dd></div>
        </dl>
        <p className="rounded-xl bg-ink-50 p-3 text-sm">{complaint.description}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Status" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          <Select label="Priority" options={PRIORITIES} value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>
        <Textarea label="Admin note (visible in history)" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}

export default function AdminComplaints() {
  useDocumentTitle('Complaints');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { data, loading, error, reload } = useFetch(() => adminService.complaints({ status: status || undefined, page, limit: 10 }), [status, page]);
  const columns = [
    { key: 'date', header: 'Filed', render: (c) => formatDate(c.createdAt) },
    { key: 'customer', header: 'Customer', render: (c) => c.userId?.name || '-' },
    { key: 'category', header: 'Category', render: (c) => categoryLabel(c.category) },
    { key: 'desc', header: 'Description', className: 'max-w-[240px] truncate', render: (c) => c.description },
    { key: 'priority', header: 'Priority', render: (c) => <StatusBadge meta={PRIORITY_META} value={c.priority} /> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge meta={COMPLAINT_META} value={c.status} /> },
    { key: 'open', header: '', render: (c) => <Button size="sm" variant="secondary" onClick={() => setSelected(c)}>Manage</Button> },
  ];
  return (
    <>
      <PageHeader title="Complaints" subtitle="Customer complaints and disputes." />
      <div className="mb-4"><Segmented label="Filter complaints" options={FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} /></div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <Table columns={columns} rows={data?.complaints} loading={loading && !data} empty={<EmptyState icon={MessageSquareWarning} title="No complaints" description="Nothing to review here." />} />
          <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
        </>
      )}
      <ComplaintEditor complaint={selected} onClose={() => setSelected(null)} onSaved={() => reload({ silent: true })} />
    </>
  );
}
