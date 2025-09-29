import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If authentication is required and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      setLocation('/login');
      return;
    }

    // If specific roles are required and user doesn't have the right role
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.userType)) {
      // Redirect to user's appropriate dashboard based on their role
      switch (user.userType) {
        case 'seller':
          setLocation('/seller/dashboard');
          break;
        case 'kayayo':
          setLocation('/kayayo/dashboard');
          break;
        case 'rider':
          setLocation('/rider/dashboard');
          break;
        case 'buyer':
        default:
          setLocation('/');
          break;
      }
      return;
    }
  }, [isAuthenticated, user, allowedRoles, requireAuth, setLocation]);

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If specific roles are required and user doesn't have the right role
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.userType)) {
    return null;
  }

  return <>{children}</>;
}