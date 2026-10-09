import { useState } from 'react';
import { Search, Users as UsersIcon } from 'lucide-react';
import { Badge, Button, EmptyState, ErrorState, Input, Modal, PageHeader, Pagination, Select, Table } from '../../components/ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { getErrorMessage } from '../../services/api.js';
import { formatCurrency, formatDate, humanize } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';

const ROLE_OPTIONS = [{ value: 'USER', label: 'Vehicle owners' }, { value: 'MECHANIC', label: 'Mechanics' }, { value: 'TOWING_PARTNER', label: 'Towing partners' }, { value: 'ADMIN', label: 'Admins' }];
const ACTIVE_OPTIONS = [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Deactivated' }];

function UserDetail({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => adminService.user(id), [id]);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try { await adminService.setUserStatus(id, !data.user.isActive); toast.success(data.user.isActive ? 'User deactivated' : 'User activated'); await reload({ silent: true }); onChanged(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} size="lg" title="User details">
      {loading && !data ? <p>Loading...</p> : error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="space-y-4">
          <dl className="grid gap-2 sm:grid-cols-2 text-sm">
            <div><dt className="text-ink-500">Name</dt><dd className="font-medium">{data.user.name}</dd></div>
            <div><dt className="text-ink-500">Role</dt><dd className="font-medium">{humanize(data.user.role)}</dd></div>
            <div><dt className="text-ink-500">Email</dt><dd className="font-medium">{data.user.email}</dd></div>
            <div><dt className="text-ink-500">Phone</dt><dd className="font-medium">{data.user.phone}</dd></div>
            <div><dt className="text-ink-500">Joined</dt><dd className="font-medium">{formatDate(data.user.createdAt)}</dd></div>
            <div><dt className="text-ink-500">Status</dt><dd><Badge tone={data.user.isActive ? 'success' : 'danger'}>{data.user.isActive ? 'Active' : 'Deactivated'}</Badge></dd></div>
          </dl>
          {data.user.role !== 'ADMIN' && <Button variant={data.user.isActive ? 'danger' : 'success'} loading={busy} onClick={toggle}>{data.user.isActive ? 'Deactivate user' : 'Activate user'}</Button>}
          <h3 className="font-display text-2xl font-semibold">Service history</h3>
          {data.history.length === 0 ? <p className="text-sm text-ink-500">No requests yet.</p> : (
            <ul className="divide-y divide-ink-100 text-sm">
              {data.history.map((r) => <li key={r._id} className="flex justify-between gap-3 py-2"><span>{formatDate(r.createdAt)} · {serviceLabel(r.serviceType)}</span><span className="text-ink-600">{humanize(r.status)} · {formatCurrency(r.finalCost ?? r.estimatedCost)}</span></li>)}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AdminUsers() {
  useDocumentTitle('Users');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const search = useDebounce(q);
  const { data, loading, error, reload } = useFetch(() => adminService.users({ q: search || undefined, role: role || undefined, active: active || undefined, page, limit: 10 }), [search, role, active, page]);
  const columns = [
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u) => humanize(u.role) },
    { key: 'joined', header: 'Joined', render: (u) => formatDate(u.createdAt) },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge> },
    { key: 'view', header: '', render: (u) => <Button size="sm" variant="secondary" onClick={() => setSelected(u._id)}>View</Button> },
  ];
  return (
    <>
      <PageHeader title="Users" subtitle="All accounts on the platform." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_180px]">
        <Input aria-label="Search users" placeholder="Search name, email or phone" icon={Search} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select aria-label="Filter by role" placeholder="All roles" options={ROLE_OPTIONS} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} />
        <Select aria-label="Filter by status" placeholder="Any status" options={ACTIVE_OPTIONS} value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }} />
      </div>
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <Table columns={columns} rows={data?.users} loading={loading && !data} empty={<EmptyState icon={UsersIcon} title="No users found" description="Try changing your filters." />} />
          <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
        </>
      )}
      {selected && <UserDetail id={selected} onClose={() => setSelected(null)} onChanged={() => reload({ silent: true })} />}
    </>
  );
}
