import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { QuickViewProvider } from './context/QuickViewContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { NewsletterPopup } from './components/NewsletterPopup';
import { ComparisonBar } from './components/ComparisonBar';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';

// Pages (to be implemented)
const Home = React.lazy(() => import('./pages/Home'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Category = React.lazy(() => import('./pages/Category'));
const Offers = React.lazy(() => import('./pages/Offers'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Login = React.lazy(() => import('./pages/Login'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <QuickViewProvider>
              <ComparisonProvider>
                <Router>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <React.Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/category/:slug" element={<Category />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    
                    <Route path="/checkout" element={<Checkout />} />
                    
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/*" element={
                      <ProtectedRoute adminOnly>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </React.Suspense>
              </main>
              <Footer />
              <FloatingActions />
              <NewsletterPopup />
              <ComparisonBar />
            </div>
            <Toaster />
          </Router>
        </ComparisonProvider>
      </QuickViewProvider>
    </WishlistProvider>
    </CartProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
