import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth.tsx";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Browse from "@/pages/buyer/browse";
import Cart from "@/pages/buyer/cart";
import Payment from "@/pages/buyer/payment";
import OrderConfirmation from "@/pages/buyer/order-confirmation";
import Orders from "@/pages/buyer/orders";
import Profile from "@/pages/profile";
import SellerDashboard from "@/pages/seller/dashboard";
import SellerProducts from "@/pages/seller/products";
import SellerOrders from "@/pages/seller/orders";
import KayayoDashboard from "@/pages/kayayo/dashboard";
import RiderDashboard from "@/pages/rider/dashboard";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Buyer-only routes */}
      <Route path="/browse">
        <ProtectedRoute allowedRoles={['buyer']}>
          <Browse />
        </ProtectedRoute>
      </Route>
      <Route path="/cart">
        <ProtectedRoute allowedRoles={['buyer']}>
          <Cart />
        </ProtectedRoute>
      </Route>
      <Route path="/buyer/payment">
        <ProtectedRoute allowedRoles={['buyer']}>
          <Payment />
        </ProtectedRoute>
      </Route>
      <Route path="/buyer/order-confirmation">
        <ProtectedRoute allowedRoles={['buyer']}>
          <OrderConfirmation />
        </ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute allowedRoles={['buyer']}>
          <Orders />
        </ProtectedRoute>
      </Route>
      
      {/* General authenticated route */}
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      
      {/* Seller-only routes */}
      <Route path="/seller/dashboard">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/products">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/orders">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerOrders />
        </ProtectedRoute>
      </Route>
      
      {/* Kayayo-only routes */}
      <Route path="/kayayo/dashboard">
        <ProtectedRoute allowedRoles={['kayayo']}>
          <KayayoDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Rider-only routes */}
      <Route path="/rider/dashboard">
        <ProtectedRoute allowedRoles={['rider']}>
          <RiderDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
