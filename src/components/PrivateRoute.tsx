import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

interface RoleRouteProps {
  roles: Array<'Admin' | 'InventoryManager' | 'Sales'>;
  redirectTo?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ roles, redirectTo = '/dashboard' }) => {
  const { roleName } = useAuth();

  const allowed = !!roleName && roles.includes(roleName as 'Admin' | 'InventoryManager' | 'Sales');
  return allowed ? <Outlet /> : <Navigate to={redirectTo} replace />;
};
