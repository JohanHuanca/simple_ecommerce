import { supabase } from './supabase';

const LOCAL_CART_KEY = 'cart_items';

// --- Carrito en localStorage ---
export function getLocalCart(): { product_variant_id: number; quantity: number }[] {
  try {
    const data = localStorage.getItem(LOCAL_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setLocalCart(items: { product_variant_id: number; quantity: number }[]) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
}

// Función unificada para agregar/actualizar/eliminar ítems del carrito local
export async function upsertLocalCartItem(variantId: number, quantity: number, isIncrement: boolean = false) {
  try {
    // Verificar stock en tiempo real
    const { data: variantData, error } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (error || !variantData) {
      throw new Error('Producto no encontrado');
    }

    const stockDisponible = variantData.stock_quantity;
    const cart = getLocalCart();
    const existingItem = cart.find(item => item.product_variant_id === variantId);
    const cantidadEnCarrito = existingItem ? existingItem.quantity : 0;

    let cantidadFinal: number;
    if (isIncrement) {
      cantidadFinal = cantidadEnCarrito + quantity;
    } else {
      cantidadFinal = quantity;
    }

    // Ajustar cantidad final al stock disponible (igual que la función de Supabase)
    if (cantidadFinal > stockDisponible) {
      cantidadFinal = stockDisponible;
    }

    // Eliminar si la cantidad final es 0 o menor
    if (cantidadFinal <= 0) {
      const updatedCart = cart.filter(item => item.product_variant_id !== variantId);
      setLocalCart(updatedCart);
      return;
    }

    // Actualizar o agregar el ítem
    const idx = cart.findIndex(item => item.product_variant_id === variantId);
    if (idx >= 0) {
      cart[idx].quantity = cantidadFinal;
    } else {
      cart.push({ product_variant_id: variantId, quantity: cantidadFinal });
    }
    setLocalCart(cart);
  } catch (error) {
    console.error('Error en upsertLocalCartItem:', error);
    throw error;
  }
}

export function clearLocalCart() {
  localStorage.removeItem(LOCAL_CART_KEY);
}

// --- Validación de stock para carrito local ---
export async function validateLocalCartStock(): Promise<boolean> {
  const localCart = getLocalCart();
  
  if (localCart.length === 0) {
    return false;
  }

  try {
    // Obtener los datos actuales de las variantes para validar stock
    const variantIds = localCart.map(item => item.product_variant_id);
    const { data: cartDetails, error } = await supabase.rpc('get_cart_details', {
      p_variant_ids: variantIds
    });
    
    if (error || !cartDetails) {
      console.error('Error obteniendo detalles del carrito:', error);
      return false;
    }
    
    let hasChanges = false;
    const updatedCart = [...localCart];

    // Validar cada item del carrito local
    for (let i = 0; i < updatedCart.length; i++) {
      const localItem = updatedCart[i];
      const variantData = cartDetails.find((item: { product_variant_id: number; variant: { stock_quantity: number } }) =>
        item.product_variant_id === localItem.product_variant_id
      );

      if (!variantData) {
        // La variante ya no existe, eliminar del carrito
        updatedCart.splice(i, 1);
        hasChanges = true;
        i--; // Ajustar índice después de eliminar
        continue;
      }

      const availableStock = variantData.variant.stock_quantity;

      if (availableStock === 0) {
        // Sin stock, eliminar del carrito
        updatedCart.splice(i, 1);
        hasChanges = true;
        i--; // Ajustar índice después de eliminar
      } else if (localItem.quantity > availableStock) {
        // Ajustar cantidad al stock disponible
        updatedCart[i].quantity = availableStock;
        hasChanges = true;
      }
    }

    // Si hubo cambios, actualizar el carrito local
    if (hasChanges) {
      setLocalCart(updatedCart);
    }

    return hasChanges;
  } catch (error) {
    console.error('Error validando stock del carrito local:', error);
    return false;
  }
} 