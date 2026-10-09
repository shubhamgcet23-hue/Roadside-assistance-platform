import { Navigate, useLocation } from 'react-router-dom';
import { FullPageLoader } from '../components/ui/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { homeFor } from '../types/constants.js';

/** Requires a signed-in user whose role is in `roles`; otherwise redirects to login or the user's own home. */
export function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

/** Login / register pages: signed-in users go straight to their dashboard. */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
