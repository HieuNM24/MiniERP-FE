import type { Product } from './product';
import type { Order } from './order';

export interface DashboardDto {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProductsCount: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
}
