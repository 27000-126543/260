import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import FarmerHome from '@/pages/FarmerHome';
import LandManagement from '@/pages/LandManagement';
import Recommendation from '@/pages/Recommendation';
import StoreHome from '@/pages/StoreHome';
import ProductDetail from '@/pages/ProductDetail';
import ShoppingCart from '@/pages/ShoppingCart';
import OrderList from '@/pages/OrderList';
import FieldManagement from '@/pages/FieldManagement';
import WeatherAlert from '@/pages/WeatherAlert';
import MarketHome from '@/pages/MarketHome';
import Traceability from '@/pages/Traceability';
import AgricultureFinance from '@/pages/AgricultureFinance';
import MemberCenter from '@/pages/MemberCenter';
import AdminDashboard from '@/pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <FarmerHome />
            </AppLayout>
          }
        />
        <Route
          path="/lands"
          element={
            <AppLayout>
              <LandManagement />
            </AppLayout>
          }
        />
        <Route
          path="/recommendations"
          element={
            <AppLayout>
              <Recommendation />
            </AppLayout>
          }
        />
        <Route
          path="/store"
          element={
            <AppLayout>
              <StoreHome />
            </AppLayout>
          }
        />
        <Route
          path="/store/product/:id"
          element={
            <AppLayout>
              <ProductDetail />
            </AppLayout>
          }
        />
        <Route
          path="/store/cart"
          element={
            <AppLayout>
              <ShoppingCart />
            </AppLayout>
          }
        />
        <Route
          path="/store/orders"
          element={
            <AppLayout>
              <OrderList />
            </AppLayout>
          }
        />
        <Route
          path="/field"
          element={
            <AppLayout>
              <FieldManagement />
            </AppLayout>
          }
        />
        <Route
          path="/weather"
          element={
            <AppLayout>
              <WeatherAlert />
            </AppLayout>
          }
        />
        <Route
          path="/market"
          element={
            <AppLayout>
              <MarketHome />
            </AppLayout>
          }
        />
        <Route
          path="/traceability"
          element={
            <AppLayout>
              <Traceability />
            </AppLayout>
          }
        />
        <Route
          path="/finance"
          element={
            <AppLayout>
              <AgricultureFinance />
            </AppLayout>
          }
        />
        <Route
          path="/member"
          element={
            <AppLayout>
              <MemberCenter />
            </AppLayout>
          }
        />
        <Route
          path="/admin"
          element={
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
