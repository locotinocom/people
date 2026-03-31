import { Outlet, Navigate } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';

interface AdminRouteProps {
  fallbackPath?: string;
}

interface AuthUser {
  email?: string;
  role?: string;
}

export default function AdminRoute({ fallbackPath = '/login' }: AdminRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser<AuthUser>();

  console.log('--- AdminRoute DEBUG ---');
  console.log('isAuthenticated():', isAuthenticated);
  console.log('user:', user);
  console.log('user?.role:', user?.role);

  if (!isAuthenticated || !user) {
    console.log('→ Redirect: nicht eingeloggt');
    return <Navigate to={fallbackPath} replace />;
  }

  if (user.role !== 'superadmin') {
    console.log('→ Redirect: keine Berechtigung, user.role =', user.role);
    return <Navigate to="/" replace />;
  }

  console.log('→ Zugriff erlaubt (superadmin)');
  return <Outlet />;
}
