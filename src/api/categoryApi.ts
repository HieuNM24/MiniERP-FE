import axiosClient from './axiosClient';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category';

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await axiosClient.get<Category[]>('/category');
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await axiosClient.get<Category>(`/category/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await axiosClient.post<Category>('/category', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    const response = await axiosClient.put<Category>(`/category/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/category/${id}`);
  },
};
