import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import { getLocalCart, clearLocalCart } from './localCart';

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Solo fusionar cuando el usuario acaba de iniciar sesión (SIGNED_IN)
      const localCart = getLocalCart()
      if (event === 'SIGNED_IN' && session?.user  && localCart.length!=0) {
        console.log('Usuario inició sesión, fusionando carrito local...');        
        // Fusionar cada item del carrito local usando la función RPC
        for (const item of localCart) {
          try {
            const { error } = await supabase.rpc('upsert_cart_item', {
              p_variant_id: item.product_variant_id,
              p_quantity: item.quantity,
              p_is_increment: true
            });
            console.log(error)
          } catch (error) {
            console.error('Error fusionando item del carrito:', error);
          }
        }
        
        clearLocalCart();
      }
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { session, loading };
} 