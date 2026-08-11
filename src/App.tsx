import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { MainLayout } from './components/MainLayout';
import { PrivateRoute, RoleRoute } from './components/PrivateRoute';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { Orders } from './pages/Orders';
import { AuditLog } from './pages/AuditLog';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Route công khai */}
          <Route path="/login" element={<Login />} />

          {/* Route cần đăng nhập */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard"   element={<Dashboard />} />
              <Route path="/products"    element={<Products />} />
              <Route path="/categories"  element={<Categories />} />
              <Route path="/orders"      element={<Orders />} />

              {/* Route chỉ dành cho Admin */}
              <Route element={<RoleRoute roles={['Admin']} />}>
                <Route path="/audit-log" element={<AuditLog />} />
              </Route>
            </Route>
          </Route>

          {/* Chuyển hướng mặc định */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
