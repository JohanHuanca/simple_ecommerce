import type { RouteObject } from 'react-router-dom';
import Orders from './components/Orders';

const ordersRoutes: RouteObject[] = [
  {
    path: '',
    element: <Orders />,
  },
];

export default ordersRoutes; 