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
import AdminLogin from "@/pages/auth/admin-login";
import Browse from "@/pages/buyer/browse";
import SellersPage from "@/pages/buyer/sellers";
import SellerProfile from "@/pages/buyer/seller-profile";
import KayayoProfile from "@/pages/buyer/kayayo-profile";
import Cart from "@/pages/buyer/cart";
import Payment from "@/pages/buyer/payment";
import OrderConfirmation from "@/pages/buyer/order-confirmation";
import Orders from "@/pages/buyer/orders";
import Profile from "@/pages/profile";
import AccountSettings from "@/pages/account-settings";
import SellerDashboard from "@/pages/seller/dashboard";
import SellerProducts from "@/pages/seller/products";
import SellerOrders from "@/pages/seller/orders";
import SellerOrderDetails from "@/pages/seller/order-details";
import SellerWithdraw from "@/pages/seller/withdraw";
import SellerAnalytics from "@/pages/seller/analytics";
import KayayoDashboard from "@/pages/kayayo/dashboard";
import KayayoTasks from "@/pages/kayayo/tasks";
import KayayoOrderDetails from "@/pages/kayayo/order-details";
import RiderDashboard from "@/pages/rider/dashboard";
import RiderDeliveries from "@/pages/rider/deliveries";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminOrders from "@/pages/admin/orders";
import AdminPayments from "@/pages/admin/payments";
import AdminDisputes from "@/pages/admin/disputes";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin/login" component={AdminLogin} />
      
      {/* Buyer-only routes */}
      <Route path="/browse">
        <ProtectedRoute allowedRoles={['buyer']}>
          <Browse />
        </ProtectedRoute>
      </Route>
      <Route path="/sellers">
        <ProtectedRoute allowedRoles={['buyer']}>
          <SellersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/seller-profile">
        <ProtectedRoute allowedRoles={['buyer']}>
          <SellerProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/kayayo-profile">
        <ProtectedRoute allowedRoles={['buyer']}>
          <KayayoProfile />
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
      <Route path="/buyer/orders">
        <ProtectedRoute allowedRoles={['buyer']}>
          <Orders />
        </ProtectedRoute>
      </Route>
      
      {/* General authenticated routes */}
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/account-settings">
        <ProtectedRoute>
          <AccountSettings />
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
      <Route path="/seller/order/:orderId">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerOrderDetails />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/withdraw">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerWithdraw />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/analytics">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerAnalytics />
        </ProtectedRoute>
      </Route>
      
      {/* Kayayo-only routes */}
      <Route path="/kayayo/dashboard">
        <ProtectedRoute allowedRoles={['kayayo']}>
          <KayayoDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/kayayo/tasks">
        <ProtectedRoute allowedRoles={['kayayo']}>
          <KayayoTasks />
        </ProtectedRoute>
      </Route>
      <Route path="/kayayo/order/:orderId">
        <ProtectedRoute allowedRoles={['kayayo']}>
          <KayayoOrderDetails />
        </ProtectedRoute>
      </Route>
      
      {/* Rider-only routes */}
      <Route path="/rider/dashboard">
        <ProtectedRoute allowedRoles={['rider']}>
          <RiderDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/rider/deliveries">
        <ProtectedRoute allowedRoles={['rider']}>
          <RiderDeliveries />
        </ProtectedRoute>
      </Route>
      
      {/* Admin-only routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/payments">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPayments />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/disputes">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDisputes />
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
