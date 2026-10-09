import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Phone, User } from 'lucide-react';
import Logo from '../../components/Logo.jsx';
import { Button, Card, Input, Segmented } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../../services/api.js';
import { homeFor } from '../../types/constants.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email'),
  phone: z.string().trim().regex(/^\+?[0-9]{10,13}$/, 'Enter a valid phone number (10-13 digits)'),
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Add an uppercase letter').regex(/[a-z]/, 'Add a lowercase letter').regex(/[0-9]/, 'Add a digit'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

const ROLES = [
  { value: 'USER', label: 'I need help' },
  { value: 'MECHANIC', label: 'Mechanic' },
  { value: 'TOWING_PARTNER', label: 'Towing partner' },
];

export default function Register() {
  useDocumentTitle('Create account');
  const { register: signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = ROLES.some((r) => r.value === params.get('role')) ? params.get('role') : 'USER';
  const [role, setRole] = useState(initial);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' } });

  const submit = async ({ confirmPassword: _c, ...values }) => {
    try {
      const user = await signUp({ ...values, role });
      toast.success(role === 'USER' ? 'Account created. Add your vehicle to get started.' : 'Account created. Complete your profile to apply for verification.');
      navigate(role === 'USER' ? '/app/vehicles' : '/partner/profile', { replace: true });
      return user;
    } catch (e) {
      toast.error(getErrorMessage(e, 'Unable to create your account.'));
      return null;
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-4xl font-semibold">Create your account</h1>
          <div className="mt-4"><Segmented label="Account type" options={ROLES} value={role} onChange={setRole} /></div>
          {role !== 'USER' && <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-ink-700">Partner accounts are reviewed by an administrator before you can receive requests.</p>}
          <form onSubmit={handleSubmit(submit)} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
            <Input className="sm:col-span-2" label="Full name" autoComplete="name" icon={User} error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" autoComplete="email" icon={Mail} error={errors.email?.message} {...register('email')} />
            <Input label="Phone" type="tel" inputMode="tel" autoComplete="tel" icon={Phone} error={errors.phone?.message} {...register('phone')} />
            <Input label="Password" type="password" autoComplete="new-password" icon={Lock} hint="8+ characters with upper, lower case and a digit" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" autoComplete="new-password" icon={Lock} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" size="lg" full loading={isSubmitting} className="sm:col-span-2">Create account</Button>
          </form>
          <p className="mt-5 text-center text-sm text-ink-600">Already registered? <Link to="/login" className="font-semibold text-ink-900 underline">Log in</Link></p>
        </Card>
      </div>
    </div>
  );
}
