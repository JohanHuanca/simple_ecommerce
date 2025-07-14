// Producto base (sin precio ni imagen)
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category_id: number;
}

// Tipos de variante (Color, Talla)
export interface VariantType {
  id: number;
  name: string;
}

// Valores de variante (Negro, S, M, L, XL)
export interface VariantValue {
  id: number;
  type_id: number;
  sort_order: number;
  value: string;
}

// Variante comprable de un producto
export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  price: number;
  stock_quantity: number;
}

// Opciones de una variante (relación variante-valores)
export interface ProductVariantOption {
  variant_id: number;
  value_id: number;
}

// Imágenes de un producto
export interface ProductImage {
  id: number;
  product_id: number;
  image_urls: string[];
}

// Opciones de imagen (relación imagen-valores)
export interface ProductImageOption {
  product_image_id: number;
  value_id: number;
}

// Producto con información completa
export interface ProductWithDetails extends Product {
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  variants?: ProductVariant[];
  images?: ProductImage[];
}

// Variante con información completa
export interface ProductVariantWithDetails extends ProductVariant {
  product?: Product;
  options?: VariantValue[];
}

// Producto con variantes y valores organizados
export interface ProductWithVariants extends Product {
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  variants?: ProductVariantWithDetails[];
  images?: ProductImage[];
} 