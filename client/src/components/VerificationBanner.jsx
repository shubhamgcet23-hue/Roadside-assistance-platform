import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const COPY = {
  PENDING: 'Your profile is awaiting admin verification. You can complete your details while you wait.',
  REJECTED: 'Your application was not approved. Update your details; an admin can review it again.',
  SUSPENDED: 'Your account is suspended. Contact support to reactivate it.',
};

/** Shown to partners who cannot yet receive requests. */
export default function VerificationBanner() {
  const { partnerProfile } = useAuth();
  const status = partnerProfile?.verificationStatus;
  if (!status || status === 'VERIFIED') return null;
  return (
    <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-300 bg-brand-50 p-4">
      <ShieldAlert className="mt-0.5 shrink-0 text-brand-700" aria-hidden />
      <div><p className="font-semibold">Verification {status.toLowerCase()}</p><p className="text-sm text-ink-700">{COPY[status]}</p>
        <Link to="/partner/profile" className="mt-1 inline-block text-sm font-semibold underline">Open profile</Link></div>
    </div>
  );
}
