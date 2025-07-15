import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../core/services/supabase';
import { useSupabaseAuth } from '../../../core/services/useSupabaseAuth';
import type { Order } from '../../../core/models/order.model';

const Orders: React.FC = () => {
  const { session } = useSupabaseAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, status, created_at')
      .eq('user_id', session?.user.id)
      .order('created_at', { ascending: false });
    setOrders(error ? [] : data || []);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user) {
      loadOrders();
    }
  }, [session, loadOrders]);

  const createOrderFromCart = useCallback(async () => {
    if (!session?.user) return;
    setCreating(true);
    
    try {
      const { error } = await supabase.rpc('create_order_from_cart');
      
      if (error) {
        alert(`Error al crear la orden: ${error.message}`);
      } else {
        alert('¡Orden creada exitosamente!');
        await loadOrders();
      }
    } catch {
      alert('Error al crear la orden.');
    }
    
    setCreating(false);
  }, [session?.user, loadOrders]);

  const renderOrderCard = useCallback((order: Order) => (
    <div key={order.id} className="border border-gray-100 p-6 bg-white shadow-md">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold text-gray-900">Orden #{order.id}</span>
        <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-gray-900">S/ {order.total_amount.toFixed(2)}</span>
        <span className="text-sm px-4 py-2 bg-gray-100 text-gray-900 font-semibold border border-gray-200">
          {order.status}
        </span>
      </div>
    </div>
  ), []);

  const renderEmptyState = useMemo(() => (
    <div className="text-center py-12">
      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes órdenes aún</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">Cuando realices tu primera compra, aparecerá aquí.</p>
      <button
        onClick={createOrderFromCart}
        disabled={creating}
        className="bg-black text-white font-bold py-3 px-8 hover:bg-gray-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {creating ? 'Creando orden...' : 'Crear orden desde carrito'}
      </button>
    </div>
  ), [createOrderFromCart, creating]);

  const renderLoadingState = useMemo(() => (
    <div className="text-center py-8">
      <p className="text-gray-500">Cargando órdenes...</p>
    </div>
  ), []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-0 py-8">
        <h2 className="text-3xl font-black mb-8 uppercase tracking-wide text-gray-900">Mis Órdenes</h2>
        {renderLoadingState}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-0 py-8">
        <h2 className="text-3xl font-black mb-8 uppercase tracking-wide text-gray-900">Mis Órdenes</h2>
        {renderEmptyState}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-0 py-8">
      <h2 className="text-3xl font-black mb-8 uppercase tracking-wide text-gray-900">Mis Órdenes</h2>
      
      <div className="mb-6">
        <button
          onClick={createOrderFromCart}
          disabled={creating}
          className="bg-black text-white font-bold py-3 px-8 hover:bg-gray-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {creating ? 'Creando orden...' : 'Crear orden desde carrito'}
        </button>
      </div>

      <div className="space-y-4">
        {orders.map(renderOrderCard)}
      </div>
    </div>
  );
};

export default Orders; 