import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../core/services/supabase';
import type { CartItemWithVariant } from '../../../core/models/cart.model';
import { getLocalCart, upsertLocalCartItem, validateLocalCartStock } from '../../../core/services/localCart';
import { useSupabaseAuth } from '../../../core/services/useSupabaseAuth';
import NotificationContainer from "../../../shared/components/NotificationContainer";
import Notification from "../../../shared/components/Notification";

interface CartItemFromRPC extends Omit<CartItemWithVariant, 'variant'> {
  variant: {
    id: number;
    sku: string;
    price: number;
    stock_quantity: number;
    product: { id: number; name: string; slug: string };
    image_url: string | null;
  };
}

interface NotificationState {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/128x128/e2e8f0/64748b?text=Producto';

export const Cart: React.FC = () => {
  const { session } = useSupabaseAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItemWithVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingItem, setRemovingItem] = useState<number | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [variantImages, setVariantImages] = useState<{ [variantId: number]: string }>({});
  const [showStockChangeModal, setShowStockChangeModal] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState<{ [variantId: number]: number }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      let hasStockChanges = false;

      if (session?.user) {
        const { data: validationResult, error: validationError } = await supabase.rpc('validate_user_cart');
        if (validationError) throw validationError;
        hasStockChanges = Boolean(validationResult);
      } else {
        const localCart = getLocalCart();
        if (localCart.length === 0) {
          setCartItems([]);
          setVariantImages({});
          setLoading(false);
          return;
        }
        hasStockChanges = await validateLocalCartStock();
      }

      const variantIds = session?.user ? undefined : getLocalCart().map(item => item.product_variant_id);
      const { data, error: rpcError } = await supabase.rpc('get_cart_details', variantIds ? { p_variant_ids: variantIds } : {});

      if (rpcError) throw rpcError;

      let finalItems: CartItemWithVariant[] = data || [];

      if (!session?.user) {
        const localCart = getLocalCart();
        finalItems = finalItems.map((item) => ({
          ...item,
          quantity: localCart.find(localItem => localItem.product_variant_id === item.product_variant_id)?.quantity || 1,
        }));
      }

      setCartItems(finalItems);

      const images: { [variantId: number]: string } = {};
      finalItems.forEach((item) => {
        const cartItem = item as CartItemFromRPC;
        images[item.variant.id] = cartItem.variant.image_url || PLACEHOLDER_IMAGE;
      });
      setVariantImages(images);

      if (hasStockChanges) {
        setShowStockChangeModal(true);
      }

    } catch {
      setCartItems([]);
      setVariantImages({});
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (cartItems) {
      const initial: { [variantId: number]: number } = {};
      cartItems.forEach(item => {
        initial[Number(item.variant.id)] = item.quantity;
      });
      setEditedQuantities(initial);
    }
  }, [cartItems]);

  const upsertCartItem = useCallback(async (variantId: number, quantity: number, isIncrement: boolean = false) => {
    if (session?.user) {
      await supabase.rpc('upsert_cart_item', {
        p_variant_id: variantId,
        p_quantity: quantity,
        p_is_increment: isIncrement
      });
      // No lanzamos error si la cantidad supera el stock, simplemente se ajusta automáticamente
    } else {
      await upsertLocalCartItem(variantId, quantity, isIncrement);
    }
  }, [session?.user]);

  const handleQuantityChange = useCallback((variantId: number, value: string, maxStock: number) => {
    let newValue = Number(value);
    if (isNaN(newValue) || newValue < 1) newValue = 1;
    if (newValue > maxStock) newValue = maxStock;
    setEditedQuantities(prev => ({ ...prev, [variantId]: newValue }));
  }, []);

  const handleSaveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      for (const item of cartItems) {
        const newQty = editedQuantities[item.variant.id];
        if (newQty !== item.quantity) {
          await upsertCartItem(item.variant.id, newQty);
        }
      }
      await loadCart();
      setNotification({ type: "success", message: "¡Cambios guardados! Si solicitaste más stock del disponible, se ajustó automáticamente." });
    } catch {
      await loadCart();
      setNotification({ type: "warning", message: "Algunos productos fueron ajustados por falta de stock." });
    } finally {
      setIsSaving(false);
    }
  }, [cartItems, editedQuantities, loadCart, upsertCartItem]);

  const hasChanges = useMemo(() => 
    cartItems.some(item => editedQuantities[item.variant.id] !== item.quantity), 
    [cartItems, editedQuantities]
  );

  const removeFromCart = useCallback(async (variantId: number) => {
    setRemovingItem(variantId);
    try {
      await upsertCartItem(variantId, 0);
      setCartItems(items => items.filter(item => item.product_variant_id !== variantId));
    } catch {
      alert('Error al eliminar del carrito.');
    } finally {
      setRemovingItem(null);
    }
  }, [upsertCartItem]);

  const handleAcceptStockChanges = useCallback(() => {
    setShowStockChangeModal(false);
    loadCart();
  }, [loadCart]);

  const proceedToCheckout = useCallback(() => {
    setProcessingCheckout(true);
    setTimeout(() => {
      alert('Integración con Izipay pendiente. Redirigiendo al checkout...');
      setProcessingCheckout(false);
    }, 1000);
  }, []);

  const renderCartItem = useCallback((item: CartItemWithVariant) => (
    <div
      key={`${item.user_id}-${item.product_variant_id}`}
      className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 bg-white shadow-md border border-gray-100 min-h-[88px]"
    >
      <div className="w-full sm:w-48 aspect-square flex-shrink-0 bg-[#f5f5f5]">
        <img
          src={variantImages[item.product_variant_id] || PLACEHOLDER_IMAGE}
          alt={item.variant.product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative flex flex-col justify-start items-start py-4 px-4 sm:pr-4 text-left">
        <div className="w-full">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">{item.variant.product.name}</h3>
          <p className="text-sm text-gray-500 mb-1">SKU: {item.variant.sku}</p>
          <p className="text-sm text-gray-500 mb-2">S/ {item.variant.price.toFixed(2)} <span className="ml-1">x unidad</span></p>
          <p className="text-xs text-gray-400">Stock: {item.variant.stock_quantity}</p>
          <div className="flex items-center gap-4 mt-2">
            <input
              type="number"
              min={1}
              max={item.variant.stock_quantity}
              value={editedQuantities[Number(item.product_variant_id)] ?? 1}
              onChange={e => handleQuantityChange(Number(item.product_variant_id), e.target.value, item.variant.stock_quantity)}
              className="w-20 border border-gray-300 px-3 py-2 text-center font-semibold focus:border-black focus:outline-none bg-white"
            />
            <span className="text-lg font-bold text-gray-900">
              S/ {(item.variant.price * (editedQuantities[Number(item.product_variant_id)] ?? 1)).toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={() => removeFromCart(item.product_variant_id)}
          disabled={removingItem === item.product_variant_id}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-600 transition disabled:opacity-50 z-10"
          title="Eliminar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
      </div>
    </div>
  ), [variantImages, editedQuantities, removingItem, handleQuantityChange, removeFromCart]);

  const totalAmount = useMemo(() => 
    cartItems.reduce((total, item) => total + (item.variant.price * (editedQuantities[Number(item.product_variant_id)] ?? 1)), 0), 
    [cartItems, editedQuantities]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-0 py-8">
        <h2 className="text-3xl font-black mb-8 uppercase tracking-wide text-gray-900">Tu Carrito</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-0 py-8">
        <h2 className="text-3xl font-black mb-8 uppercase tracking-wide text-gray-900">Tu Carrito</h2>
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tu carrito está vacío</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">Añade algunos productos deliciosos para comenzar.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-black text-white font-bold py-3 px-8 hover:bg-gray-900 transition"
          >
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  if (showStockChangeModal) {
    return (
      <div className="max-w-4xl mx-auto px-0 py-8">
        <h2 className="text-3xl font-black mb-8 uppercase tracking-wide text-gray-900">Tu Carrito</h2>
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-orange-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Cambios en el stock</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Algunos productos de tu carrito han sido ajustados debido a cambios en el stock disponible.
          </p>
          <button
            onClick={handleAcceptStockChanges}
            className="bg-black text-white font-bold py-3 px-8 hover:bg-gray-900 transition"
          >
            Ver Carrito Actualizado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-0 py-8">
      <h2 className="text-3xl font-black mb-8 uppercase tracking-wide text-gray-900">Tu Carrito</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {cartItems.map(renderCartItem)}
          
          <div className="flex justify-end mt-4">
            <button
              className="bg-black text-white font-bold py-3 px-8 hover:bg-gray-900 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
              onClick={handleSaveChanges}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar cantidades"}
            </button>
          </div>
        </div>

        <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-gray-50 shadow-md p-6 border border-gray-100 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Resumen de compra</h3>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-lg text-gray-700">Subtotal</span>
                    <span className="text-lg font-bold text-gray-900">S/ {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-black text-black">S/ {totalAmount.toFixed(2)}</span>
                </div>
                <button
                    onClick={proceedToCheckout}
                    disabled={processingCheckout || hasChanges}
                    className="w-full bg-black text-white font-bold py-4 shadow-md hover:bg-gray-900 transition mt-6 text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {hasChanges ? 'Guarda tus cambios' : (processingCheckout ? 'Procesando...' : 'Proceder al pago')}
                </button>
            </div>
        </div>
      </div>

      <NotificationContainer />
      {notification && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default Cart; 