import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Package,
  Activity,
  Eye,
  Settings,
  FileText,
  Shield
} from "lucide-react";

interface AdminStats {
  users: {
    buyers: number;
    sellers: number;
    kayayos: number;
    riders: number;
    total: number;
  };
  orders: {
    pending: number;
    active: number;
    completed: number;
    total: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  issues: {
    disputes: number;
    suspendedUsers: number;
    flaggedOrders: number;
  };
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!user || user.userType !== 'admin') {
    setLocation('/login');
    return null;
  }

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-primary" data-testid="admin-dashboard-title">
                Admin Portal
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <Activity className="h-3 w-3 mr-1" />
                System Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center justify-between">
                <span>Total Users</span>
                <Users className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900" data-testid="stat-total-users">
                {stats.users.total}
              </p>
              <p className="text-xs text-blue-700 mt-1">Registered platform users</p>
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center justify-between">
                <span>Active Orders</span>
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-900" data-testid="stat-active-orders">
                {stats.orders.active}
              </p>
              <p className="text-xs text-green-700 mt-1">{stats.orders.pending} pending acceptance</p>
            </CardContent>
          </Card>

          {/* Today's Revenue */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-900 flex items-center justify-between">
                <span>Today's Revenue</span>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-900" data-testid="stat-today-revenue">
                ₵{stats.revenue.today.toFixed(2)}
              </p>
              <p className="text-xs text-purple-700 mt-1">Platform fees collected</p>
            </CardContent>
          </Card>

          {/* Flagged Issues */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-900 flex items-center justify-between">
                <span>Flagged Issues</span>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-900" data-testid="stat-flagged-issues">
                {stats.issues.disputes + stats.issues.flaggedOrders + stats.issues.suspendedUsers}
              </p>
              <p className="text-xs text-red-700 mt-1">
                {stats.issues.suspendedUsers} unverified, {stats.issues.disputes} disputes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Breakdown by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <UserCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold" data-testid="users-buyers">{stats.users.buyers}</p>
                <p className="text-sm text-muted-foreground">Buyers</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold" data-testid="users-sellers">{stats.users.sellers}</p>
                <p className="text-sm text-muted-foreground">Sellers</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold" data-testid="users-kayayos">{stats.users.kayayos}</p>
                <p className="text-sm text-muted-foreground">Kayayos</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold" data-testid="users-riders">{stats.users.riders}</p>
                <p className="text-sm text-muted-foreground">Riders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Today's Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">₵{stats.revenue.today.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">₵{stats.revenue.thisWeek.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">₵{stats.revenue.thisMonth.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/users')}
                data-testid="button-manage-users"
              >
                <Users className="h-5 w-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold">Manage Users</p>
                  <p className="text-xs text-muted-foreground">View, approve, or suspend users</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/orders')}
                data-testid="button-monitor-orders"
              >
                <ShoppingCart className="h-5 w-5 mr-3 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold">Monitor Orders</p>
                  <p className="text-xs text-muted-foreground">Track and manage orders</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/payments')}
                data-testid="button-manage-payments"
              >
                <DollarSign className="h-5 w-5 mr-3 text-purple-600" />
                <div className="text-left">
                  <p className="font-semibold">Payments & Escrow</p>
                  <p className="text-xs text-muted-foreground">Manage payments and refunds</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/disputes')}
                data-testid="button-resolve-disputes"
              >
                <AlertTriangle className="h-5 w-5 mr-3 text-red-600" />
                <div className="text-left">
                  <p className="font-semibold">Resolve Disputes</p>
                  <p className="text-xs text-muted-foreground">{stats.issues.disputes} pending resolution</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/analytics')}
                data-testid="button-view-analytics"
              >
                <TrendingUp className="h-5 w-5 mr-3 text-orange-600" />
                <div className="text-left">
                  <p className="font-semibold">Analytics</p>
                  <p className="text-xs text-muted-foreground">Platform insights and reports</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/settings')}
                data-testid="button-platform-settings"
              >
                <Shield className="h-5 w-5 mr-3 text-gray-600" />
                <div className="text-left">
                  <p className="font-semibold">Platform Settings</p>
                  <p className="text-xs text-muted-foreground">Configure system settings</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Issues Summary */}
        {(stats.issues.disputes > 0 || stats.issues.flaggedOrders > 0 || stats.issues.suspendedUsers > 0) && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="h-5 w-5" />
                Issues Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.issues.disputes > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">Pending Disputes</span>
                    <Badge variant="destructive" data-testid="badge-pending-disputes">
                      {stats.issues.disputes}
                    </Badge>
                  </div>
                )}
                {stats.issues.flaggedOrders > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">Flagged Orders</span>
                    <Badge variant="destructive" data-testid="badge-flagged-orders">
                      {stats.issues.flaggedOrders}
                    </Badge>
                  </div>
                )}
                {stats.issues.suspendedUsers > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">Suspended Users</span>
                    <Badge variant="secondary" data-testid="badge-suspended-users">
                      {stats.issues.suspendedUsers}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
