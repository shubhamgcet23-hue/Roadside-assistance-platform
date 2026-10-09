import { useEffect, useState } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker.jsx';
import VerificationBanner from '../../components/VerificationBanner.jsx';
import { Button, Card, ErrorState, Input, LoadingState, PageHeader, StatusBadge } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage } from '../../services/api.js';
import { partnerService } from '../../services/partners.js';
import { SERVICE_CODES } from '../../types/constants.js';
import { serviceLabel } from '../../utils/icons.js';
import { VERIFICATION_META } from '../../utils/status.js';
import { AccountForm } from '../user/Profile.jsx';

const fromProfile = (p) => ({
  experienceYears: String(p.experienceYears ?? 0),
  serviceRadiusKm: String(p.serviceRadiusKm ?? 15),
  address: p.address || '',
  governmentIdRef: p.governmentIdRef || '',
  licenseRef: p.licenseRef || '',
  services: p.services || [],
  prices: Object.fromEntries((p.pricing || []).map((x) => [x.serviceCode, String(x.basePrice)])),
});

export default function PartnerProfile() {
  useDocumentTitle('Profile');
  const toast = useToast();
  const { refresh } = useAuth();
  const { data: profile, loading, error, reload } = useFetch(() => partnerService.profile(), []);
  const [form, setForm] = useState(null);
  const [location, setLocation] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm(fromProfile(profile));
    const [lng, lat] = profile.location?.coordinates || [0, 0];
    setLocation(lat || lng ? { latitude: lat, longitude: lng, address: profile.address || '' } : null);
  }, [profile]);

  if (loading && !profile) return <LoadingState variant="page" />;
  if (error && !profile) return <ErrorState message={error} onRetry={reload} />;
  if (!form) return <LoadingState variant="page" />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleService = (code) => set({ services: form.services.includes(code) ? form.services.filter((c) => c !== code) : [...form.services, code] });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnerService.updateProfile({
        experienceYears: Number(form.experienceYears) || 0,
        serviceRadiusKm: Number(form.serviceRadiusKm) || 15,
        address: (location?.address || form.address).slice(0, 300),
        governmentIdRef: form.governmentIdRef || undefined,
        licenseRef: form.licenseRef || undefined,
        services: form.services,
        pricing: form.services.filter((c) => form.prices[c] !== undefined && form.prices[c] !== '').map((c) => ({ serviceCode: c, basePrice: Number(form.prices[c]) })),
      });
      if (location) await partnerService.updateLocation({ latitude: location.latitude, longitude: location.longitude });
      toast.success('Profile saved');
      await Promise.all([reload({ silent: true }), refresh().catch(() => {})]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="Customers see your services, price and distance." actions={<StatusBadge meta={VERIFICATION_META} value={profile.verificationStatus} icon={ShieldCheck} />} />
      <VerificationBanner />
      <div className="space-y-6">
        <section aria-labelledby="acct"><h2 id="acct" className="mb-3 font-display text-3xl font-semibold">Account</h2><AccountForm /></section>
        <form onSubmit={save} className="space-y-6">
          <Card>
            <h2 className="mb-3 font-display text-3xl font-semibold">Services and pricing</h2>
            <div className="space-y-3">
              {SERVICE_CODES.map((code) => (
                <div key={code} className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 p-3">
                  <label className="flex min-w-[200px] flex-1 items-center gap-3 font-medium"><input type="checkbox" className="h-5 w-5 accent-ink-900" checked={form.services.includes(code)} onChange={() => toggleService(code)} /> {serviceLabel(code)}</label>
                  <Input aria-label={`${serviceLabel(code)} base price`} className="w-40" type="number" min="0" placeholder="Base price" disabled={!form.services.includes(code)} value={form.prices[code] ?? ''} onChange={(e) => set({ prices: { ...form.prices, [code]: e.target.value } })} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-ink-500">Leave a price empty to use the platform default.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Service radius (km)" type="number" min="1" max="100" value={form.serviceRadiusKm} onChange={(e) => set({ serviceRadiusKm: e.target.value })} />
              <Input label="Experience (years)" type="number" min="0" max="60" value={form.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} />
            </div>
          </Card>
          <Card>
            <h2 className="mb-1 font-display text-3xl font-semibold">Your base location</h2>
            <p className="mb-4 text-sm text-ink-600">Where you usually start from. Customers nearby are matched using this.</p>
            <LocationPicker value={location} onChange={setLocation} />
          </Card>
          <Card>
            <h2 className="mb-1 flex items-center gap-2 font-display text-3xl font-semibold"><FileText size={22} aria-hidden /> Verification documents</h2>
            <p className="mb-4 text-sm text-ink-600">Document upload is not available yet. Enter reference numbers for the admin to review.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Government ID reference" maxLength={100} value={form.governmentIdRef} onChange={(e) => set({ governmentIdRef: e.target.value })} />
              <Input label="Driving / trade licence reference" maxLength={100} value={form.licenseRef} onChange={(e) => set({ licenseRef: e.target.value })} />
            </div>
          </Card>
          <Button type="submit" size="lg" loading={saving}>Save profile</Button>
        </form>
      </div>
    </>
  );
}
