export interface CartItem {
  id: number;
  user_id: string;
  product_variant_id: number;
  quantity: number;
}

export interface CartItemWithVariant extends CartItem {
  variant: {
    id: number;
    sku: string;
    price: number;
    stock_quantity: number;
    product: {
      id: number;
      name: string;
      slug: string;
      description?: string;
    };
  };
}

export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  items: CartItemWithVariant[];
} 