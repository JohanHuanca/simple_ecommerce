export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
}

export interface CategoryWithChildren extends Category {
  children?: Category[];
} 