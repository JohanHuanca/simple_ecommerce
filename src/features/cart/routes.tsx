import type { RouteObject } from 'react-router-dom';
import Cart from './components/Cart';

const cartRoutes: RouteObject[] = [
  {
    path: '',
    element: <Cart />,
  },
];

export default cartRoutes; 