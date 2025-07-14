import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../../core/services/useSupabaseAuth';
import { signOut, signInWithGoogle } from '../../core/services/supabase';
import { supabase } from '../../core/services/supabase';
import type { Category } from '../../core/models/category.model';

const Header: React.FC = () => {
  const { session } = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredParent, setHoveredParent] = useState<number | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (!error && data) setCategories(data);
    }
    loadCategories();
  }, []);

  const parentCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: number) => categories.filter(cat => cat.parent_id === parentId);

  const handleLogout = async () => {
    await signOut();
  };

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  // Detectar categoría seleccionada por la URL
  const selectedSlug = new URLSearchParams(location.search).get('category');

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo SHIKES */}
        <Link to="/products" className="font-black text-3xl tracking-widest text-gray-900 hover:text-green-600 transition-all select-none">
          SHIKES
        </Link>
        {/* Menú de categorías principales */}
        <nav className="flex-1 flex justify-center">
          <ul className="flex gap-8 items-center h-full relative">
            {parentCategories.map(parent => (
              <li
                key={parent.id}
                className="relative h-full group"
                onMouseEnter={() => setHoveredParent(parent.id)}
                onMouseLeave={() => setHoveredParent(null)}
              >
                <Link
                  to={`/products?category=${parent.slug}`}
                  className={`uppercase font-bold text-base tracking-wide px-2 pb-2 pt-4 transition-colors duration-200 ${selectedSlug === parent.slug ? 'text-green-600' : 'text-gray-900 hover:text-green-600'} flex flex-col items-center`}
                >
                  {parent.name}
                  {/* Subrayado animado */}
                  <span className={`h-1 w-6 mt-1 rounded-full transition-all duration-200 ${selectedSlug === parent.slug ? 'bg-green-600 scale-x-100' : 'bg-transparent scale-x-0'} group-hover:bg-green-500 group-hover:scale-x-100`}></span>
                </Link>
                {/* Mega menú de subcategorías */}
                {getSubcategories(parent.id).length > 0 && hoveredParent === parent.id && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white shadow-2xl rounded-xl border border-gray-100 min-w-[600px] max-w-[900px] z-50 p-8 flex gap-12 animate-fade-in">
                    {/* Subcategorías en columnas */}
                    <div className="grid grid-cols-2 gap-8 w-full">
                      {getSubcategories(parent.id).map(sub => (
                        <div key={sub.id} className="mb-2">
                          <Link
                            to={`/products?category=${sub.slug}`}
                            className="block font-semibold text-gray-800 hover:text-green-600 text-base mb-1 transition"
                          >
                            {sub.name}
                          </Link>
                          {/* Aquí podrías agregar un tercer nivel si lo tuvieras */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
        {/* Iconos de usuario, carrito y órdenes */}
        <nav className="flex items-center gap-4 ml-4">
          {/* Carrito */}
          <button
            onClick={() => navigate('/cart')}
            className={`p-2 rounded-full hover:bg-gray-100 transition ${location.pathname === '/cart' ? 'bg-gray-100' : ''}`}
            aria-label="Carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </button>
          {/* Órdenes */}
          <button
            onClick={() => navigate('/orders')}
            className={`p-2 rounded-full hover:bg-gray-100 transition ${location.pathname === '/orders' ? 'bg-gray-100' : ''}`}
            aria-label="Órdenes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </button>
          {/* Login/Logout */}
          {session?.user ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 text-sm truncate max-w-[120px]">{session.user.user_metadata.full_name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 font-bold text-sm transition"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-bold transition text-sm"
            >
              Iniciar sesión
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 