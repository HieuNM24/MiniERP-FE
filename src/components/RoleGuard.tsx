import React from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleGuardProps {
  roles: Array<'Admin' | 'InventoryManager' | 'Sales'>;
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children, fallback = null }) => {
  const { roleName } = useAuth();

  if (!roleName || !roles.includes(roleName as 'Admin' | 'InventoryManager' | 'Sales')) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
