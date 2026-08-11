export interface Product {
  id: number;
  sku: string;
  productName: string;
  unitPrice: number;
  stockQuantity: number;
  categoryId?: number;
}

export interface CreateProductDto {
  sku: string;
  productName: string;
  unitPrice: number;
  stockQuantity: number;
  categoryId?: number;
}