export type OrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

export interface OrderDetail {
  orderDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface Order {
  orderId: number;
  orderCode: string;
  orderDate: string;          // ISO 8601 string from .NET
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: OrderStatus;
  createdByUsername: string;
  details: OrderDetail[];
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderDto {
  customerName: string;
  customerPhone: string;
  items: CreateOrderItem[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
