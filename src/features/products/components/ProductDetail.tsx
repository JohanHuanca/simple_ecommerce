import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../core/services/supabase';
import { useSupabaseAuth } from '../../../core/services/useSupabaseAuth';
import type { ProductVariantWithDetails, Product } from '../../../core/models/product.model';
import { upsertLocalCartItem } from '../../../core/services/localCart';

interface OptionsUI {
  id: number;
  name: string;
  values: { id: number; value: string }[];
}

interface FullProductData {
  product: Product & { category: { id: number; name: string; slug: string; } };
  options_ui: OptionsUI[];
  variants: (ProductVariantWithDetails & { options: number[]; image_urls: string[][] | null })[];
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/e2e8f0/64748b?text=Producto';

const ProductDetail: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { session } = useSupabaseAuth();
    
    const [productData, setProductData] = useState<FullProductData | null>(null);
    const [selectedValues, setSelectedValues] = useState<{ [typeId: string]: number }>({});
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const fetchProductDetails = useCallback(async () => {
        if (!slug) return;
        setLoading(true);

        const { data, error } = await supabase.rpc('get_product_page_details', { p_slug: slug });
        console.log(data);
        setProductData(error || !data ? null : data);
        setLoading(false);
    }, [slug]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);

    useEffect(() => {
        if (productData) {
            const initialSelected: { [typeId: string]: number } = {};
            productData.options_ui.forEach((type) => {
                const urlValue = searchParams.get(type.name.toLowerCase());
                const valueFromUrl = type.values.find((v) => v.value === urlValue);
                initialSelected[type.id] = valueFromUrl?.id || type.values[0]?.id;
            });
            setSelectedValues(initialSelected);
        }
    }, [searchParams, productData]);

    const selectedVariant = useMemo(() => {
        if (!productData) return null;
        const selectedValueIds = Object.values(selectedValues);
        return selectedValueIds.length === 0 ? null : 
               productData.variants.find(variant => selectedValueIds.every(id => variant.options.includes(id))) || null;
    }, [selectedValues, productData]);

    const galleryImages = useMemo(() => {
        if (!selectedVariant?.image_urls?.length) return [PLACEHOLDER_IMAGE];
        const images = selectedVariant.image_urls.flat();
        return images.length > 0 ? images : [PLACEHOLDER_IMAGE];
    }, [selectedVariant]);

    const [mainImage, setMainImage] = useState(galleryImages[0]);

    useEffect(() => {
        setMainImage(galleryImages[0]);
    }, [galleryImages]);

    const handleSelectValue = useCallback((type: OptionsUI, valueId: number) => {
        setSelectedValues(prev => ({ ...prev, [type.id]: valueId }));

        const value = type.values.find(v => v.id === valueId);
        if (value) {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set(type.name.toLowerCase(), value.value);
            setSearchParams(newSearchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleAddToCart = useCallback(async () => {
        if (!selectedVariant) {
            alert('Por favor selecciona una variante');
            return;
        }
        setAdding(true);
        try {
            if (!session?.user) {
                await upsertLocalCartItem(selectedVariant.id, quantity, true);
                setAdding(false);
                alert('Producto añadido al carrito local. Si solicitaste más stock del disponible, se ajustó automáticamente. Inicia sesión para guardarlo en tu cuenta.');
                return;
            }
            
            const { error } = await supabase.rpc('upsert_cart_item', {
                p_variant_id: selectedVariant.id,
                p_quantity: quantity,
                p_is_increment: true
            });
            setAdding(false);
            if (error) {
                alert(`Error al añadir al carrito: ${error.message}`);
            } else {
                alert('Producto añadido al carrito. Si solicitaste más stock del disponible, se ajustó automáticamente.');
                navigate('/cart');
            }
        } catch {
            setAdding(false);
            alert('Error al añadir al carrito');
        }
    }, [selectedVariant, quantity, session?.user, navigate]);

    const handleQuantityChange = useCallback((value: string) => {
        if (!selectedVariant) return;
        const newQuantity = Math.max(1, Math.min(selectedVariant.stock_quantity, Number(value)));
        setQuantity(newQuantity);
    }, [selectedVariant]);

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = PLACEHOLDER_IMAGE;
    }, []);

    const renderGalleryThumbnails = useCallback(() => (
        <div className="flex lg:flex-col gap-2 order-2 lg:order-1">
            {galleryImages.map((img, idx) => (
                <img
                    key={idx}
                    src={img}
                    alt={`Miniatura ${idx + 1}`}
                    className={`w-16 h-16 object-cover cursor-pointer border transition-all ${mainImage === img ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => setMainImage(img)}
                    onError={handleImageError}
                />
            ))}
        </div>
    ), [galleryImages, mainImage, handleImageError]);

    const renderMainImage = useCallback(() => (
        <div className="flex-1 order-1 lg:order-2">
            <img
                src={mainImage}
                alt={productData?.product.name || 'Producto'}
                className="w-full h-96 lg:h-[500px] object-cover shadow-md"
                onError={handleImageError}
            />
        </div>
    ), [mainImage, productData?.product.name, handleImageError]);

    const renderOptionButton = useCallback((type: OptionsUI, value: { id: number; value: string }) => {
        const variantForValue = productData?.variants.find(v => v.options.includes(value.id));
        const isOutOfStock = variantForValue ? variantForValue.stock_quantity <= 0 : false;
        const isSelected = selectedValues[type.id] === value.id;
        const textClasses = [
            isOutOfStock ? 'line-through text-gray-400' : '',
            isSelected ? 'font-bold' : '',
        ].join(' ');

        return (
            <button
                key={value.id}
                onClick={() => !isOutOfStock && handleSelectValue(type, value.id)}
                disabled={isOutOfStock}
                className={`w-full py-3 px-2 border text-base font-semibold transition-all duration-150
                    ${isSelected ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-900 border-gray-300 hover:border-black hover:bg-white'}
                    ${isOutOfStock && !isSelected ? 'text-gray-400 line-through cursor-not-allowed bg-gray-50 border-gray-200' : ''}
                `}
            >
                <span className={textClasses}>{value.value}</span>
            </button>
        );
    }, [selectedValues, handleSelectValue, productData?.variants]);

    if (loading) return <div className="text-center py-12">Cargando producto...</div>;
    if (!productData) return <div className="text-center py-12 text-red-500">Producto no encontrado.</div>;
    
    const { product, options_ui } = productData;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Galería de imágenes */}
                <div className="lg:w-1/2">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {renderGalleryThumbnails()}
                        {renderMainImage()}
                    </div>
                </div>

                {/* Información del producto */}
                <div className="lg:w-1/2 flex flex-col gap-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2 uppercase tracking-wide">{product.name}</h1>
                        {product.description && (
                            <p className="text-gray-600 text-lg leading-relaxed mb-4">{product.description}</p>
                        )}
                    </div>

                    {options_ui.map(type => (
                        <div key={type.id} className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-lg text-gray-900">{type.name}</span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {type.values.map(value => renderOptionButton(type, value))}
                            </div>
                        </div>
                    ))}

                    {selectedVariant && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold text-black">S/ {selectedVariant.price.toFixed(2)}</span>
                                <span className="text-gray-500">{selectedVariant.stock_quantity > 0 ? `Stock: ${selectedVariant.stock_quantity}` : 'Sin stock'}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="font-semibold text-gray-900">Cantidad:</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={selectedVariant.stock_quantity}
                                    value={quantity}
                                    onChange={e => handleQuantityChange(e.target.value)}
                                    className="w-20 border border-gray-300 px-3 py-2 text-center font-semibold focus:border-black focus:outline-none bg-white"
                                />
                            </div>
                            <div className="flex items-center justify-between border-t pt-4 mt-2">
                                <span className="text-lg font-semibold text-gray-900">Total:</span>
                                <span className="text-2xl font-bold text-black">S/ {(selectedVariant.price * quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <div className="border p-4 flex items-center gap-3 text-gray-700 bg-white text-base mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0118 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                        <span><b>Talla real.</b> Te recomendamos pedir tu talla habitual.</span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={adding || !selectedVariant || (selectedVariant?.stock_quantity || 0) <= 0}
                        className="w-full bg-black text-white font-bold py-4 px-8 hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-md flex items-center justify-center gap-3 mt-4"
                    >
                        {adding ? 'Añadiendo...' : (selectedVariant?.stock_quantity || 0) <= 0 ? 'Sin stock' : 'Añadir al carrito'}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail; 