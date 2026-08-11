// Matches BackEnd ProductDto — note sKU capitalization matches JSON from .NET
export interface Product {
  productId: number;
  sKU: string;
  productName: string;
  unitPrice: number;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  isLowStock: boolean;
}

export interface CreateProductDto {
  sKU: string;
  productName: string;
  unitPrice: number;
  stockQuantity: number;
  categoryId: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductQueryParams {
  search?: string;
  categoryId?: number;
}
