import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './store/auth';
import Layout     from './components/Layout';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Customers  from './pages/Customers';
import Products   from './pages/Products';
import Orders     from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Users      from './pages/Users';

function Guard({ children, roles }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace/> : <Login/>}/>
      <Route element={<Guard><Layout/></Guard>}>
        <Route path="/"          element={<Dashboard/>}/>
        <Route path="/customers" element={<Customers/>}/>
        <Route path="/products"  element={<Products/>}/>
        <Route path="/orders"    element={<Orders/>}/>
        <Route path="/orders/:id" element={<OrderDetail/>}/>
        <Route path="/users" element={
          <Guard roles={['admin']}><Users/></Guard>
        }/>
      </Route>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}
