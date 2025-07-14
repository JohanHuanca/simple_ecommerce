import type { RouteObject } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';

const productsRoutes: RouteObject[] = [
  {
    path: '',
    element: <ProductList />,
  },
  {
    path: ':slug',
    element: <ProductDetail />,
  },
];

export default productsRoutes; 