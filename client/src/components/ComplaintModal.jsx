import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Modal, Select, Textarea } from './ui/index.js';
import { complaintService } from '../services/feedback.js';
import { getErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { COMPLAINT_CATEGORIES, PRIORITIES } from '../types/constants.js';

const schema = z.object({
  category: z.string().min(1, 'Choose what went wrong'),
  priority: z.string(),
  description: z.string().trim().min(10, 'Please describe the problem in at least 10 characters').max(2000),
});

export default function ComplaintModal({ open, onClose, requestId, onSubmitted }) {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { category: '', priority: 'MEDIUM', description: '' } });
  useEffect(() => { if (open) reset({ category: '', priority: 'MEDIUM', description: '' }); }, [open, reset]);

  const submit = async (values) => {
    try {
      await complaintService.create({ ...values, requestId });
      toast.success('Complaint submitted. Our team will review it.');
      onSubmitted?.();
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not submit your complaint.'));
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} title="Report a problem"
      footer={(<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="complaint-form" loading={isSubmitting}>Submit complaint</Button></>)}
    >
      <form id="complaint-form" onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Select label="What went wrong?" placeholder="Select a category" options={COMPLAINT_CATEGORIES} error={errors.category?.message} {...register('category')} />
        <Select label="Priority" options={PRIORITIES} {...register('priority')} />
        <Textarea label="Describe the problem" rows={4} placeholder="Tell us what happened" error={errors.description?.message} {...register('description')} />
        <div>
          <label htmlFor="complaint-files" className="mb-1.5 block text-sm font-medium text-ink-800">Attachments</label>
          <input id="complaint-files" type="file" disabled className="block w-full cursor-not-allowed rounded-xl border border-dashed border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-400" />
          <p className="mt-1.5 text-sm text-ink-500">Photo uploads are not available yet.</p>
        </div>
      </form>
    </Modal>
  );
}
