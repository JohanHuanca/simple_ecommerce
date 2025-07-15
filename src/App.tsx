import { Routes, Route, Navigate } from "react-router-dom";
import ProductList from "./features/products/components/ProductList";
import ProductDetail from "./features/products/components/ProductDetail";
import Cart from "./features/cart/components/Cart";
import NotificationContainer from "./shared/components/NotificationContainer";
import Header from "./shared/components/Header";
import Orders from "./features/orders/components/Orders";
import { useSupabaseAuth } from "./core/services/useSupabaseAuth";

function App() {
  const { loading } = useSupabaseAuth();
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Cargando...</div>
      </div>
    );
  }
  return (
    <>
      <Header />
      <NotificationContainer />
        <Routes>
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
    </>
  );
}

export default App;
