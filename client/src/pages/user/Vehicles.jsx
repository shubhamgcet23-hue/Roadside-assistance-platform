import { useState } from 'react';
import { Car, Plus } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import VehicleCard from '../../components/VehicleCard.jsx';
import VehicleFormModal from '../../components/VehicleFormModal.jsx';
import { Button, EmptyState, ErrorState, LoadingState, Modal, PageHeader } from '../../components/ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage } from '../../services/api.js';
import { vehicleService } from '../../services/vehicles.js';
import { humanize } from '../../utils/format.js';

export default function Vehicles() {
  useDocumentTitle('My vehicles');
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => vehicleService.list(), []);
  const [form, setForm] = useState({ open: false, vehicle: null });
  const [removing, setRemoving] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);

  const makeDefault = async (v) => {
    try { await vehicleService.update(v._id, { isDefault: true }); toast.success(`${v.make} ${v.model} is now your default`); reload({ silent: true }); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const confirmDelete = async () => {
    setBusy(true);
    try { await vehicleService.remove(removing._id); toast.success('Vehicle removed'); setRemoving(null); reload({ silent: true }); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };
  const openAdd = () => setForm({ open: true, vehicle: null });

  return (
    <>
      <PageHeader title="My vehicles" subtitle="Keep your vehicles handy for faster requests." actions={<Button icon={Plus} onClick={openAdd}>Add vehicle</Button>} />
      {loading && !data ? <LoadingState />
        : error && !data ? <ErrorState message={error} onRetry={reload} />
          : data.length === 0 ? <EmptyState icon={Car} title="No vehicles yet" description="Add a vehicle to request roadside assistance." action={<Button icon={Plus} onClick={openAdd}>Add your first vehicle</Button>} />
            : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.map((v) => <VehicleCard key={v._id} vehicle={v} onView={setViewing} onEdit={(x) => setForm({ open: true, vehicle: x })} onDelete={setRemoving} onDefault={makeDefault} />)}
              </div>
            )}
      <VehicleFormModal open={form.open} vehicle={form.vehicle} onClose={() => setForm({ open: false, vehicle: null })} onSaved={() => reload({ silent: true })} />
      <ConfirmModal open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={confirmDelete} loading={busy} danger confirmLabel="Delete" title="Delete vehicle?" message={removing ? `${removing.make} ${removing.model} (${removing.registrationNumber}) will be removed.` : ''} />
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Vehicle details">
        {viewing && (
          <dl className="space-y-2">
            {[['Type', humanize(viewing.type)], ['Make', viewing.make], ['Model', viewing.model], ['Registration', viewing.registrationNumber], ['Year', viewing.year], ['Fuel', humanize(viewing.fuelType)], ['Colour', viewing.color]].map(([k, val]) => (
              <div key={k} className="flex justify-between border-b border-ink-100 py-2"><dt className="text-ink-600">{k}</dt><dd className="font-medium">{val || '-'}</dd></div>
            ))}
          </dl>
        )}
      </Modal>
    </>
  );
}
