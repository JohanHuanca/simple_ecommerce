import React, { useEffect, useState, useCallback } from 'react';
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
  // --- NUEVO: Estado para controlar el sidebar móvil ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (!error && data) setCategories(data);
    }
    loadCategories();
  }, []);

  // Cierra el sidebar si la ruta cambia
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    closeSidebar();
  }, [location, closeSidebar]);


  const parentCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: number) => categories.filter(cat => cat.parent_id === parentId);

  const handleLogout = async () => {
    await signOut();
  };

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  const selectedSlug = new URLSearchParams(location.search).get('category');

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-0 flex items-center justify-between h-20">
          
          {/* --- NUEVO: Botón de menú para móvil --- */}
          <div className="md:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-full text-gray-700 hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          {/* Logo SHIKES */}
          {/* Se ajusta el posicionamiento en móvil */}
          <div className="flex-1 flex justify-center md:justify-start">
            <Link to="/products" className="font-black text-3xl tracking-widest text-gray-900 hover:text-green-600 transition-all select-none">
              SHIKES
            </Link>
          </div>
          
          {/* --- MODIFICADO: Menú de categorías para desktop --- */}
          {/* Se oculta en móvil con 'hidden md:flex' */}
          <nav className="hidden md:flex flex-1 justify-center">
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
                    <span className={`h-1 w-6 mt-1 rounded-full transition-all duration-200 ${selectedSlug === parent.slug ? 'bg-green-600 scale-x-100' : 'bg-transparent scale-x-0'} group-hover:bg-green-500 group-hover:scale-x-100`}></span>
                  </Link>
                  {getSubcategories(parent.id).length > 0 && hoveredParent === parent.id && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full bg-white shadow-2xl border border-gray-100 min-w-[400px] max-w-[600px] z-50 p-4 flex gap-8 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4 w-full justify-items-center">
                        {getSubcategories(parent.id).map(sub => (
                          <div key={sub.id} className="mb-1">
                            <Link
                              to={`/products?category=${sub.slug}`}
                              className="block font-semibold text-gray-800 hover:text-green-600 text-sm mb-1 transition text-center"
                            >
                              {sub.name}
                            </Link>
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
          <nav className="flex items-center gap-2 sm:gap-4">
            {/* --- MODIFICADO: Ocultar carrito y órdenes en móvil --- */}
            <button onClick={() => navigate('/cart')} className="hidden md:flex p-2 rounded-full hover:bg-gray-100 transition ${location.pathname === '/cart' ? 'bg-gray-100' : ''}" aria-label="Carrito">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-gray-700"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            </button>
            <button onClick={() => navigate('/orders')} className="hidden md:flex p-2 rounded-full hover:bg-gray-100 transition ${location.pathname === '/orders' ? 'bg-gray-100' : ''}" aria-label="Órdenes">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-gray-700"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
            </button>
            
            {session?.user ? (
              <div className="flex items-center gap-1 sm:gap-3">
                <div className="flex items-center gap-2">
                  {session.user.user_metadata.avatar_url ? (
                    <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg></div>
                  )}
                  {/* --- MODIFICADO: Ocultar nombre en móvil --- */}
                  <span className="hidden md:inline font-semibold text-gray-700 text-sm truncate max-w-[120px]">{session.user.user_metadata.full_name}</span>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100 transition" aria-label="Cerrar sesión">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-gray-700"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-gray-700"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-gray-700"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" /></svg>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* --- NUEVO: Sidebar para móvil --- */}
      <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'bg-black bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}>
        <div 
          className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del sidebar lo cierre
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-bold text-lg">Menú</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-md hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <nav className="p-4">
            <ul>
              {parentCategories.map(parent => (
                <li key={parent.id} className="mb-2">
                  <Link
                    to={`/products?category=${parent.slug}`}
                    className={`block font-bold py-2 rounded-md transition-colors ${selectedSlug === parent.slug ? 'text-green-600' : 'text-gray-800 hover:text-green-600'}`}
                  >
                    {parent.name}
                  </Link>
                  {getSubcategories(parent.id).length > 0 && (
                    <ul className="pl-4 mt-1 border-l-2 border-gray-200">
                      {getSubcategories(parent.id).map(sub => (
                        <li key={sub.id}>
                           <Link
                             to={`/products?category=${sub.slug}`}
                             className="block py-2 text-sm transition-colors text-gray-600 hover:text-green-600"
                           >
                             {sub.name}
                           </Link>
                         </li>
                       ))}
                     </ul>
                   )}
                 </li>
               ))}
             </ul>
             
             {/* --- NUEVO: Carrito y Órdenes en sidebar móvil --- */}
             <div className="mt-8 pt-4 border-t border-gray-200">
               <Link
                 to="/cart"
                 className="flex items-center gap-3 py-3 px-2 rounded-md hover:bg-gray-100 transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-gray-700">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                 </svg>
                 <span className="font-semibold text-gray-800">Carrito</span>
               </Link>
               <Link
                 to="/orders"
                 className="flex items-center gap-3 py-3 px-2 rounded-md hover:bg-gray-100 transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-gray-700">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                 </svg>
                 <span className="font-semibold text-gray-800">Órdenes</span>
               </Link>
             </div>
           </nav>
         </div>
       </div>
    </>
  );
};

export default Header;