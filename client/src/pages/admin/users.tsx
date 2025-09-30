import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  ArrowLeft,
  Filter,
  Star,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import type { User } from "@shared/schema";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/verify`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "User verified",
        description: "User has been successfully verified.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify user.",
        variant: "destructive",
      });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/suspend`, { suspend });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: variables.suspend ? "User suspended" : "User unsuspended",
        description: variables.suspend 
          ? "User has been suspended and cannot access the platform."
          : "User has been reinstated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setUserToDelete(null);
      toast({
        title: "User removed",
        description: "User has been permanently removed from the platform.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove user.",
        variant: "destructive",
      });
    },
  });

  if (!currentUser || currentUser.userType !== 'admin') {
    setLocation('/login');
    return null;
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery)) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Role filter
    const matchesRole = roleFilter === "all" || user.userType === roleFilter;
    
    // Verification filter
    const matchesVerification = 
      verificationFilter === "all" ||
      (verificationFilter === "verified" && user.isVerified) ||
      (verificationFilter === "unverified" && !user.isVerified);
    
    return matchesSearch && matchesRole && matchesVerification;
  });

  const getUserRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'kayayo': return 'bg-purple-100 text-purple-800';
      case 'rider': return 'bg-orange-100 text-orange-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/admin/dashboard')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary" data-testid="admin-users-title">
                User Management
              </h1>
              <p className="text-sm text-muted-foreground">View and manage platform users</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="buyer">Buyers</SelectItem>
                  <SelectItem value="seller">Sellers</SelectItem>
                  <SelectItem value="kayayo">Kayayos</SelectItem>
                  <SelectItem value="rider">Riders</SelectItem>
                </SelectContent>
              </Select>

              {/* Verification Filter */}
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger data-testid="select-verification-filter">
                  <SelectValue placeholder="Filter by verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-bold">{filteredUsers.length}</span> of {users.length} users
          </p>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No users found matching your filters</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Joined {new Date(user.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getUserRoleBadgeColor(user.userType)}>
                            {user.userType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {user.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </p>
                            )}
                            {user.email && (
                              <p className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.isVerified ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                <XCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                            {user.isSuspended && (
                              <Badge variant="destructive" className="ml-1">
                                <Ban className="h-3 w-3 mr-1" />
                                Suspended
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{parseFloat(user.rating || "0").toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.totalOrders || 0}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!user.isVerified && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verifyUserMutation.mutate(user.id)}
                                disabled={verifyUserMutation.isPending}
                                data-testid={`button-verify-${user.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => suspendUserMutation.mutate({ userId: user.id, suspend: !user.isSuspended })}
                              disabled={suspendUserMutation.isPending}
                              data-testid={`button-suspend-${user.id}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </Button>
                            {user.userType !== 'admin' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setUserToDelete(user)}
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently remove <span className="font-bold">{userToDelete?.name}</span>?
              This action cannot be undone and will delete all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
