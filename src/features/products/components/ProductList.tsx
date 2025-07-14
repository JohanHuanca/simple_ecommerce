import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../core/services/supabase';

interface ProductFromRPC {
  id: number;
  name: string;
  slug: string;
  description: string;
  min_price: number;
  max_price: number;
  image_url: string | null;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/e2e8f0/64748b?text=Producto';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<ProductFromRPC[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categorySlug = searchParams.get('category');
  const categoryTitle = categorySlug || 'Todos los Productos';

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_products_by_category', {
        p_category_slug: categorySlug || null
      });
      setProducts(error ? [] : data || []);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, [categorySlug]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const formatPrice = useCallback((min: number, max: number) => 
    min === max ? `S/ ${min.toFixed(2)}` : `S/ ${min.toFixed(2)} - ${max.toFixed(2)}`, []);

  const handleProductClick = useCallback((slug: string) => {
    navigate(`/products/${slug}`);
  }, [navigate]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  }, []);

  const renderHeader = useMemo(() => (
    <div className="flex items-end gap-3">
      <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wide text-gray-900">
        {categoryTitle}
      </h1>
      <span className="text-gray-400 text-base font-semibold">[{products.length}]</span>
    </div>
  ), [categoryTitle, products.length]);

  const renderProductCard = useCallback((product: ProductFromRPC) => (
    <div
      key={product.id}
      className="bg-white shadow-md overflow-hidden border border-gray-100 flex flex-col cursor-pointer hover:shadow-xl transition group"
      onClick={() => handleProductClick(product.slug)}
    >
      <div className="bg-[#f5f5f5] w-full h-56 flex items-center justify-center overflow-hidden">
        <img
          src={product.image_url || PLACEHOLDER_IMAGE}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={handleImageError}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <span className="text-lg font-bold text-gray-900 mb-1">
          {formatPrice(product.min_price, product.max_price)}
        </span>
        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-1 flex-grow">
          {product.description || ''}
        </p>
      </div>
    </div>
  ), [formatPrice, handleProductClick, handleImageError]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        {renderHeader}
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        {renderHeader}
        <div className="text-center py-12">
          <p className="text-gray-500">
            {categorySlug ? 'No hay productos en esta categoría.' : 'No hay productos disponibles.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        {renderHeader}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map(renderProductCard)}
      </div>
    </div>
  );
};

export default ProductList; 