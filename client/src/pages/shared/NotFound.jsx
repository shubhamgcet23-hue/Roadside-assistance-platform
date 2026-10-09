import { Button } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { homeFor } from '../../types/constants.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  const { user } = useAuth();
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-8xl font-bold text-brand-500">404</p>
        <h1 className="font-display text-4xl font-semibold">This road does not exist</h1>
        <p className="mt-2 text-ink-600">The page you are looking for was moved or never existed.</p>
        <Button className="mt-6" to={user ? homeFor(user.role) : '/'} size="lg">{user ? 'Back to dashboard' : 'Back to home'}</Button>
      </div>
    </div>
  );
}
