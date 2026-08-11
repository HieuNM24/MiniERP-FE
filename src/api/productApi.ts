import axiosClient from './axiosClient';
import type { Product, CreateProductDto } from '../types/product';

export const productApi = {
  getAll: async (): Promise<Product[]> => {
    const response = await axiosClient.get<Product[]>('/products');
    return response.data;
  },
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await axiosClient.post<Product>('/products', data);
    return response.data;
  },
  update: async (id: number, data: CreateProductDto): Promise<Product> => {
    const response = await axiosClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/products/${id}`);
  },
};