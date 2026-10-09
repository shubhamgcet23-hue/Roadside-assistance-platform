import { useEffect, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { Badge, Button, EmptyState, ErrorState, Input, LoadingState, Modal, PageHeader, Select, Table, Textarea } from '../../components/ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage } from '../../services/api.js';
import { catalogService } from '../../services/catalog.js';
import { SERVICE_CODES } from '../../types/constants.js';
import { formatCurrency } from '../../utils/format.js';
import { serviceLabel } from '../../utils/icons.js';

const blank = { code: '', name: '', description: '', basePrice: '', pricePerKm: '', estimatedDurationMin: '', icon: '', isActive: true };
const toForm = (s) => (s ? { code: s.code, name: s.name, description: s.description || '', basePrice: String(s.basePrice), pricePerKm: String(s.pricePerKm ?? 0), estimatedDurationMin: s.estimatedDurationMin ? String(s.estimatedDurationMin) : '', icon: s.icon || '', isActive: s.isActive } : blank);

function ServiceForm({ open, service, usedCodes, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => { if (open) { setForm(toForm(service)); setErrors({}); } }, [open, service]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!service && !form.code) next.code = 'Choose a service type';
    if (form.name.trim().length < 2) next.name = 'Enter a name';
    if (form.basePrice === '' || Number(form.basePrice) < 0) next.basePrice = 'Enter a base price';
    if (form.pricePerKm !== '' && Number(form.pricePerKm) < 0) next.pricePerKm = 'Cannot be negative';
    setErrors(next);
    if (Object.keys(next).length) return;
    const payload = {
      name: form.name.trim(), description: form.description.trim() || undefined, basePrice: Number(form.basePrice), pricePerKm: Number(form.pricePerKm) || 0,
      estimatedDurationMin: form.estimatedDurationMin ? Number(form.estimatedDurationMin) : undefined, icon: form.icon.trim() || undefined, isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (service) await catalogService.update(service._id, payload); else await catalogService.create({ ...payload, code: form.code });
      toast.success(service ? 'Service updated' : 'Service created');
      onSaved();
      onClose();
    } catch (err) { toast.error(getErrorMessage(err, 'Could not save the service.')); } finally { setSaving(false); }
  };
  const available = SERVICE_CODES.filter((c) => !usedCodes.includes(c)).map((c) => ({ value: c, label: serviceLabel(c) }));

  return (
    <Modal open={open} onClose={onClose} title={service ? 'Edit service' : 'Add service'} footer={(<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="service-form" loading={saving}>Save</Button></>)}>
      <form id="service-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        {!service && <Select className="sm:col-span-2" label="Service type" placeholder="Select type" options={available} value={form.code} onChange={set('code')} error={errors.code} />}
        <Input className="sm:col-span-2" label="Name" value={form.name} onChange={set('name')} error={errors.name} />
        <Textarea className="sm:col-span-2" label="Description" rows={2} value={form.description} onChange={set('description')} />
        <Input label="Base price (INR)" type="number" min="0" value={form.basePrice} onChange={set('basePrice')} error={errors.basePrice} />
        <Input label="Price per km (INR)" type="number" min="0" value={form.pricePerKm} onChange={set('pricePerKm')} error={errors.pricePerKm} />
        <Input label="Estimated duration (min)" type="number" min="1" value={form.estimatedDurationMin} onChange={set('estimatedDurationMin')} />
        <Input label="Icon name" placeholder="wrench" value={form.icon} onChange={set('icon')} />
        <label className="flex items-center gap-3 text-sm font-medium sm:col-span-2"><input type="checkbox" className="h-5 w-5 accent-ink-900" checked={form.isActive} onChange={set('isActive')} /> Active (visible to customers)</label>
      </form>
    </Modal>
  );
}

export default function AdminServices() {
  useDocumentTitle('Services');
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => catalogService.list({ all: true }), []);
  const [form, setForm] = useState({ open: false, service: null });

  const toggle = async (s) => {
    try { if (s.isActive) await catalogService.deactivate(s._id); else await catalogService.update(s._id, { isActive: true }); toast.success(s.isActive ? 'Service deactivated' : 'Service activated'); reload({ silent: true }); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const used = data?.map((s) => s.code) || [];
  const columns = [
    { key: 'name', header: 'Service', render: (s) => <div><p className="font-medium">{s.name}</p><p className="text-xs text-ink-500">{s.description}</p></div> },
    { key: 'base', header: 'Base price', render: (s) => formatCurrency(s.basePrice) },
    { key: 'km', header: 'Per km', render: (s) => formatCurrency(s.pricePerKm) },
    { key: 'dur', header: 'Duration', render: (s) => (s.estimatedDurationMin ? `${s.estimatedDurationMin} min` : '-') },
    { key: 'status', header: 'Status', render: (s) => <Badge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', header: '', render: (s) => <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setForm({ open: true, service: s })}>Edit</Button><Button size="sm" variant="ghost" onClick={() => toggle(s)}>{s.isActive ? 'Deactivate' : 'Activate'}</Button></div> },
  ];
  const canAdd = used.length < SERVICE_CODES.length;
  return (
    <>
      <PageHeader title="Services" subtitle="Pricing here drives every estimate: base price + distance x price per km." actions={canAdd && <Button icon={Plus} onClick={() => setForm({ open: true, service: null })}>Add service</Button>} />
      {loading && !data ? <LoadingState variant="list" />
        : error && !data ? <ErrorState message={error} onRetry={reload} />
          : <Table columns={columns} rows={data} empty={<EmptyState icon={Wrench} title="No services" description="Run the seed script or add a service." />} />}
      <ServiceForm open={form.open} service={form.service} usedCodes={used} onClose={() => setForm({ open: false, service: null })} onSaved={() => reload({ silent: true })} />
    </>
  );
}
