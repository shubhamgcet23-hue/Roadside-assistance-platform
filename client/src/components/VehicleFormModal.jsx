import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal, Select } from './ui/index.js';
import { vehicleService } from '../services/vehicles.js';
import { getErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { FUEL_TYPES, VEHICLE_TYPES } from '../types/constants.js';

const maxYear = new Date().getFullYear() + 1;
export const vehicleSchema = z.object({
  type: z.string().min(1, 'Choose a vehicle type'),
  make: z.string().trim().min(1, 'Enter the make, e.g. Hyundai'),
  model: z.string().trim().min(1, 'Enter the model, e.g. i20'),
  registrationNumber: z.string().trim().min(4, 'Enter the registration number'),
  year: z.string().refine((v) => v === '' || (/^\d{4}$/.test(v) && Number(v) >= 1980 && Number(v) <= maxYear), `Enter a year between 1980 and ${maxYear}`),
  fuelType: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const blank = { type: '', make: '', model: '', registrationNumber: '', year: '', fuelType: '', color: '', isDefault: false };
const toForm = (v) => (v ? { ...blank, ...v, year: v.year ? String(v.year) : '', fuelType: v.fuelType || '', color: v.color || '' } : blank);

/** Add or edit a vehicle. Pass `vehicle` to edit. */
export default function VehicleFormModal({ open, onClose, vehicle, onSaved }) {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(vehicleSchema), defaultValues: toForm(vehicle) });
  useEffect(() => { if (open) reset(toForm(vehicle)); }, [open, vehicle, reset]);

  const submit = async (values) => {
    const payload = { ...values, year: values.year ? Number(values.year) : undefined, fuelType: values.fuelType || undefined, color: values.color || undefined };
    try {
      const saved = vehicle ? await vehicleService.update(vehicle._id, payload) : await vehicleService.create(payload);
      toast.success(vehicle ? 'Vehicle updated' : 'Vehicle added');
      onSaved?.(saved);
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not save the vehicle.'));
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} title={vehicle ? 'Edit vehicle' : 'Add a vehicle'}
      footer={(<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="vehicle-form" loading={isSubmitting}>{vehicle ? 'Save changes' : 'Add vehicle'}</Button></>)}
    >
      <form id="vehicle-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Select className="sm:col-span-2" label="Vehicle type" placeholder="Select type" options={VEHICLE_TYPES} error={errors.type?.message} {...register('type')} />
        <Input label="Make" placeholder="Hyundai" error={errors.make?.message} {...register('make')} />
        <Input label="Model" placeholder="i20" error={errors.model?.message} {...register('model')} />
        <Input label="Registration number" placeholder="UP16 AB 1234" autoCapitalize="characters" error={errors.registrationNumber?.message} {...register('registrationNumber')} />
        <Input label="Year" inputMode="numeric" placeholder="2021" error={errors.year?.message} {...register('year')} />
        <Select label="Fuel type" placeholder="Select fuel" options={FUEL_TYPES} {...register('fuelType')} />
        <Input label="Colour" placeholder="White" {...register('color')} />
        <label className="flex items-center gap-3 text-sm font-medium sm:col-span-2">
          <input type="checkbox" className="h-5 w-5 accent-ink-900" {...register('isDefault')} /> Use as my default vehicle
        </label>
      </form>
    </Modal>
  );
}
