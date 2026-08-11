import axiosClient from './axiosClient';
import type { AuditLog } from '../types/auditLog';

export const auditLogApi = {
  getAll: async (): Promise<AuditLog[]> => {
    const response = await axiosClient.get<AuditLog[]>('/auditlog');
    return response.data;
  },
};
