import axiosClient from './axiosClient';
import type { Product, CreateProductDto, UpdateProductDto, ProductQueryParams } from '../types/product';

export const productApi = {
  getAll: async (params?: ProductQueryParams): Promise<Product[]> => {
    const response = await axiosClient.get<Product[]>('/product', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await axiosClient.get<Product>(`/product/${id}`);
    return response.data;
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await axiosClient.post<Product>('/product', data);
    return response.data;
  },

  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    const response = await axiosClient.put<Product>(`/product/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/product/${id}`);
  },
};
