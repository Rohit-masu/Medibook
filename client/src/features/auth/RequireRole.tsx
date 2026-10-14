import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@/api/types';
import { useAuth } from './AuthContext';

export const homeFor = (role: Role) => (role === 'admin' ? '/admin' : '/app');

export function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
