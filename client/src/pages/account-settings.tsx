import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Phone, Mail, Save } from "lucide-react";

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string; email?: string }) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update local storage with new user data
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Profile updated",
        description: "Your account settings have been saved successfully.",
      });
      
      // Navigate back to profile
      setLocation("/profile");
    },
    onError: () => {
      toast({
        title: "Failed to update profile",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      name,
      phone: phone || undefined,
      email: email || undefined,
    });
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/profile")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Account Settings</h1>
        </div>
      </header>

      {/* Settings Form */}
      <main className="p-4 pb-20">
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  data-testid="input-name"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  data-testid="input-phone"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  data-testid="input-email"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Type Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Account Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You are registered as a <span className="font-semibold text-foreground capitalize">{user.userType}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-settings"
          >
            {updateProfileMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </main>
    </MobileLayout>
  );
}
