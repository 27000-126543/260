import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Login } from '@/pages/Login';
import FarmerHome from '@/pages/FarmerHome';
import LandManagement from '@/pages/LandManagement';
import Recommendation from '@/pages/Recommendation';
import StoreHome from '@/pages/StoreHome';
import ProductDetail from '@/pages/ProductDetail';
import ShoppingCart from '@/pages/ShoppingCart';
import OrderList from '@/pages/OrderList';
import LogisticsDetail from '@/pages/LogisticsDetail';
import FieldManagement from '@/pages/FieldManagement';
import WeatherAlert from '@/pages/WeatherAlert';
import MarketHome from '@/pages/MarketHome';
import Traceability from '@/pages/Traceability';
import AgricultureFinance from '@/pages/AgricultureFinance';
import MemberCenter from '@/pages/MemberCenter';
import AdminDashboard from '@/pages/AdminDashboard';
import { useAppStore } from '@/stores/useAppStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAppStore();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FarmerHome />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lands"
        element={
          <ProtectedRoute>
            <AppLayout>
              <LandManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Recommendation />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/store"
        element={
          <ProtectedRoute>
            <AppLayout>
              <StoreHome />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/store/product/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProductDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/store/cart"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ShoppingCart />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/store/orders"
        element={
          <ProtectedRoute>
            <AppLayout>
              <OrderList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/store/orders/:orderId/logistics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <LogisticsDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/field"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FieldManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/weather"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WeatherAlert />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/market"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MarketHome />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/traceability"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Traceability />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AgricultureFinance />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/member"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MemberCenter />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
