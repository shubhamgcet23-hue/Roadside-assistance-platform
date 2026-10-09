import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import Logo from '../../components/Logo.jsx';
import { Button, Card, Input } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../../services/api.js';
import { homeFor } from '../../types/constants.js';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

// Development / demo accounts created by `npm run seed`. Never use these in production.
const DEMO = [
  { label: 'Vehicle owner', email: 'user@roadsideaaa.com', password: 'User@123' },
  { label: 'Mechanic', email: 'mechanic@roadsideaaa.com', password: 'Mechanic@123' },
  { label: 'Admin', email: 'admin@roadsideaaa.com', password: 'Admin@123' },
];

export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const submit = async ({ email, password }) => {
    setFormError(null);
    try {
      const user = await login(email, password);
      const from = location.state?.from;
      navigate(from && from.startsWith(homeFor(user.role)) ? from : homeFor(user.role), { replace: true });
    } catch (e) {
      const msg = getErrorMessage(e, 'Unable to log in.');
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-4xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-ink-600">Log in to request or manage assistance.</p>
          <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
            <Input label="Email" type="email" autoComplete="email" icon={Mail} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="current-password" icon={Lock} error={errors.password?.message} {...register('password')} />
            {formError && <p role="alert" className="rounded-xl bg-stop-50 px-4 py-3 text-sm text-stop-700">{formError}</p>}
            <Button type="submit" size="lg" full loading={isSubmitting}>Log in</Button>
          </form>
          <p className="mt-5 text-center text-sm text-ink-600">New here? <Link to="/register" className="font-semibold text-ink-900 underline">Create an account</Link></p>
        </Card>
        <Card className="mt-4 bg-brand-50">
          <p className="text-sm font-semibold">Demo accounts (development only)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <Button key={d.email} size="sm" variant="secondary" onClick={() => { setValue('email', d.email); setValue('password', d.password); }}>{d.label}</Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-600">Fills the form with seeded demo credentials. Run <code>npm run seed</code> first.</p>
        </Card>
      </div>
    </div>
  );
}
