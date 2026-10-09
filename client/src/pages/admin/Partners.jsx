import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { Badge, Button, EmptyState, ErrorState, Input, Modal, PageHeader, Pagination, Segmented, Select, StarRating, StatusBadge, Table, Textarea } from '../../components/ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { getErrorMessage } from '../../services/api.js';
import { formatCurrency, formatDate, humanize } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';
import { AVAILABILITY_META, VERIFICATION_META } from '../../utils/status.js';

const STATUS_FILTERS = [{ value: '', label: 'All' }, { value: 'PENDING', label: 'Pending' }, { value: 'VERIFIED', label: 'Verified' }, { value: 'REJECTED', label: 'Rejected' }, { value: 'SUSPENDED', label: 'Suspended' }];
const ROLE_OPTIONS = [{ value: 'MECHANIC', label: 'Mechanics' }, { value: 'TOWING_PARTNER', label: 'Towing partners' }];
// Which actions an admin can take from each verification state (mirrors the server rules).
const ACTIONS = {
  PENDING: ['verify', 'reject'], REJECTED: ['verify'], VERIFIED: ['suspend', 'reject'], SUSPENDED: ['reactivate'],
};
const ACTION_UI = {
  verify: { label: 'Verify', variant: 'success', done: 'Partner verified' },
  reject: { label: 'Reject', variant: 'danger', done: 'Partner rejected' },
  suspend: { label: 'Suspend', variant: 'danger', done: 'Partner suspended' },
  reactivate: { label: 'Reactivate', variant: 'success', done: 'Partner reactivated' },
};

function PartnerDetail({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => adminService.partner(id), [id]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(null);
  const act = async (action) => {
    setBusy(action);
    try {
      await adminService.partnerAction(id, action, action === 'reject' ? { reason: reason.trim() || undefined } : undefined);
      toast.success(ACTION_UI[action].done);
      await reload({ silent: true });
      onChanged();
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(null); }
  };
  const p = data?.partner;
  return (
    <Modal open onClose={onClose} size="lg" title="Partner details">
      {loading && !data ? <p>Loading...</p> : error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-3xl font-semibold">{p.user?.name}</h3><StatusBadge meta={VERIFICATION_META} value={p.verificationStatus} icon={ShieldCheck} /><StatusBadge meta={AVAILABILITY_META} value={p.availability} /></div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-ink-500">Role</dt><dd className="font-medium">{humanize(p.user?.role)}</dd></div>
            <div><dt className="text-ink-500">Contact</dt><dd className="font-medium">{p.user?.email} · {p.user?.phone}</dd></div>
            <div><dt className="text-ink-500">Experience</dt><dd className="font-medium">{p.experienceYears} years</dd></div>
            <div><dt className="text-ink-500">Service radius</dt><dd className="font-medium">{p.serviceRadiusKm} km</dd></div>
            <div><dt className="text-ink-500">Government ID ref</dt><dd className="font-medium">{p.governmentIdRef || '-'}</dd></div>
            <div><dt className="text-ink-500">Licence ref</dt><dd className="font-medium">{p.licenseRef || '-'}</dd></div>
            <div><dt className="text-ink-500">Rating</dt><dd className="font-medium">{p.ratingAverage || 'New'} ({p.ratingCount} reviews) · {p.jobsCompleted} jobs</dd></div>
            <div><dt className="text-ink-500">Applied</dt><dd className="font-medium">{formatDate(p.createdAt)}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-1.5">{p.services?.length ? p.services.map((s) => <Badge key={s}>{serviceLabel(s)}</Badge>) : <span className="text-sm text-ink-500">No services selected yet.</span>}</div>
          {p.rejectionReason && <p className="rounded-xl bg-stop-50 px-4 py-3 text-sm text-stop-700">Rejection reason: {p.rejectionReason}</p>}
          <div className="space-y-3 rounded-xl border border-ink-100 p-4">
            {(ACTIONS[p.verificationStatus] || []).includes('reject') && <Textarea aria-label="Rejection reason" rows={2} placeholder="Reason shown to the partner if you reject (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />}
            <div className="flex flex-wrap gap-2">
              {(ACTIONS[p.verificationStatus] || []).map((a) => <Button key={a} variant={ACTION_UI[a].variant} loading={busy === a} disabled={Boolean(busy)} onClick={() => act(a)}>{ACTION_UI[a].label}</Button>)}
            </div>
          </div>
          <h3 className="font-display text-2xl font-semibold">Recent jobs</h3>
          {data.history.length === 0 ? <p className="text-sm text-ink-500">No jobs yet.</p> : (
            <ul className="divide-y divide-ink-100 text-sm">{data.history.map((r) => <li key={r._id} className="flex justify-between gap-3 py-2"><span>{formatDate(r.createdAt)} · {serviceLabel(r.serviceType)}</span><span className="text-ink-600">{humanize(r.status)} · {formatCurrency(r.finalCost ?? r.estimatedCost)}</span></li>)}</ul>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AdminPartners() {
  useDocumentTitle('Partners');
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const search = useDebounce(q);
  const { data, loading, error, reload } = useFetch(() => adminService.partners({ status: status || undefined, role: role || undefined, q: search || undefined, page, limit: 10 }), [status, role, search, page]);

  const quick = async (p, action) => {
    try { await adminService.partnerAction(p.userId, action); toast.success(ACTION_UI[action].done); reload({ silent: true }); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const columns = [
    { key: 'name', header: 'Partner', render: (p) => <div><p className="font-medium">{p.user?.name}</p><p className="text-xs text-ink-500">{humanize(p.user?.role)}</p></div> },
    { key: 'services', header: 'Services', render: (p) => `${p.services?.length || 0} offered` },
    { key: 'rating', header: 'Rating', render: (p) => (p.ratingCount ? <StarRating value={p.ratingAverage} size={14} /> : <span className="text-ink-500">New</span>) },
    { key: 'status', header: 'Verification', render: (p) => <StatusBadge meta={VERIFICATION_META} value={p.verificationStatus} /> },
    { key: 'availability', header: 'Availability', render: (p) => <StatusBadge meta={AVAILABILITY_META} value={p.availability} /> },
    { key: 'actions', header: '', render: (p) => (
      <div className="flex gap-2">
        {p.verificationStatus === 'PENDING' && <Button size="sm" variant="success" onClick={() => quick(p, 'verify')}>Verify</Button>}
        <Button size="sm" variant="secondary" onClick={() => setSelected(p.userId)}>Review</Button>
      </div>
    ) },
  ];
  return (
    <>
      <PageHeader title="Partners" subtitle="Review applications and manage mechanics and towing partners." />
      <div className="mb-4 space-y-3">
        <Segmented label="Verification status" options={STATUS_FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <Input aria-label="Search partners" placeholder="Search name, email or phone" icon={Search} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <Select aria-label="Filter by type" placeholder="Mechanics and towing" options={ROLE_OPTIONS} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} />
        </div>
      </div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <Table columns={columns} rows={data?.partners} rowKey={(p) => p.userId} loading={loading && !data} empty={<EmptyState icon={ShieldCheck} title="No partners found" description="Try changing your filters." />} />
          <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
        </>
      )}
      {selected && <PartnerDetail id={selected} onClose={() => setSelected(null)} onChanged={() => reload({ silent: true })} />}
    </>
  );
}
