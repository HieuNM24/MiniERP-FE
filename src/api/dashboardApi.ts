import axiosClient from './axiosClient';
import type { DashboardDto } from '../types/dashboard';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardDto> => {
    const response = await axiosClient.get<DashboardDto>('/dashboard');
    return response.data;
  },
};
