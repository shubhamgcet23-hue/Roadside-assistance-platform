import { Link } from 'react-router-dom';
import { Card, PageHeader } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { API_URL } from '../../services/api.js';
import { SOCKET_URL } from '../../services/socket.js';
import { AccountForm } from '../user/Profile.jsx';

export default function AdminSettings() {
  useDocumentTitle('Settings');
  return (
    <>
      <PageHeader title="Settings" subtitle="Your admin account and platform configuration." />
      <div className="space-y-6">
        <section aria-labelledby="acct"><h2 id="acct" className="mb-3 font-display text-3xl font-semibold">Account</h2><AccountForm /></section>
        <section aria-labelledby="plat">
          <h2 id="plat" className="mb-3 font-display text-3xl font-semibold">Platform</h2>
          <Card>
            <ul className="space-y-3 text-sm">
              <li>Service pricing and categories are managed on the <Link to="/admin/services" className="font-semibold underline">Services</Link> page.</li>
              <li>Partner approvals are on the <Link to="/admin/partners" className="font-semibold underline">Partners</Link> page.</li>
              <li className="text-ink-600">Server tuning (average speed, offer timeout, demo tracking) is set with environment variables on the API server.</li>
            </ul>
            <dl className="mt-4 grid gap-2 border-t border-ink-100 pt-4 text-sm sm:grid-cols-2">
              <div><dt className="text-ink-500">API URL</dt><dd className="break-all font-mono">{API_URL}</dd></div>
              <div><dt className="text-ink-500">Realtime URL</dt><dd className="break-all font-mono">{SOCKET_URL}</dd></div>
            </dl>
          </Card>
        </section>
      </div>
    </>
  );
}
