export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
  totalProducts: number;
}

export interface CreateCategoryDto {
  categoryName: string;
  description: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}
