import axiosClient from './axiosClient';
import type { Order, CreateOrderDto, UpdateOrderStatusDto } from '../types/order';

export const orderApi = {
  getAll: async (): Promise<Order[]> => {
    const response = await axiosClient.get<Order[]>('/order');
    return response.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await axiosClient.get<Order>(`/order/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await axiosClient.post<Order>('/order', data);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateOrderStatusDto): Promise<void> => {
    await axiosClient.patch(`/order/${id}/status`, data);
  },
};
