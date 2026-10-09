import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, Input, PageHeader } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../../services/api.js';
import { authService } from '../../services/auth.js';

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  phone: z.string().trim().regex(/^\+?[0-9]{10,13}$/, 'Enter a valid phone number (10-13 digits)'),
});

/** Name and phone editor shared by every role's profile page. */
export function AccountForm() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name, phone: user.phone } });
  const submit = async (values) => {
    try { const updated = await authService.updateProfile(values); updateUser(updated); reset(values); toast.success('Profile updated'); } catch (e) { toast.error(getErrorMessage(e, 'Could not update your profile.')); }
  };
  return (
    <Card>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <Input className="sm:col-span-2" label="Email" value={user.email} disabled readOnly hint="Email cannot be changed." />
        <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="sm:col-span-2 sm:w-fit">Save changes</Button>
      </form>
    </Card>
  );
}

export default function Profile() {
  useDocumentTitle('Profile');
  return (<><PageHeader title="Profile" subtitle="Your account details." /><AccountForm /></>);
}
