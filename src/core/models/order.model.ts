export interface Order {
  id: number;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'failed';
  izipay_transaction_id?: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_variant_id?: number;
  quantity: number;
  price_at_purchase: number;
}

export interface OrderItemWithVariant extends OrderItem {
  variant?: {
    id: number;
    sku: string;
    price: number;
    product: {
      id: number;
      name: string;
      slug: string;
      description?: string;
    };
  };
}

export interface OrderWithItems extends Order {
  items: OrderItemWithVariant[];
} 