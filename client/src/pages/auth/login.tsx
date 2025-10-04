import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";

const loginSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const testUsers = [
  { type: "buyer", credential: "+233244123456", password: "password123", label: "Buyer" },
  { type: "seller", credential: "+233244987654", password: "password123", label: "Seller" },
  { type: "kayayo", credential: "+233244555666", password: "password123", label: "Kayayo" },
  { type: "rider", credential: "+233244666777", password: "password123", label: "Rider" },
  { type: "admin", credential: "admin@makolaconnect.com", password: "admin123", label: "Admin" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      
      // Redirect based on user type
      const redirectPath = (() => {
        switch (data.user.userType) {
          case 'seller':
            return '/seller/dashboard';
          case 'kayayo':
            return '/kayayo/dashboard';
          case 'rider':
            return '/rider/dashboard';
          case 'admin':
            return '/admin/dashboard';
          default:
            return '/';
        }
      })();
      
      setLocation(redirectPath);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Invalid phone number or password.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handleQuickLogin = (credential: string, password: string) => {
    const isEmail = credential.includes('@');
    const loginData = isEmail 
      ? { email: credential, password } 
      : { phone: credential, password };
    
    loginMutation.mutate(loginData as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Makola Connect
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" data-testid="tab-manual-login">Manual Login</TabsTrigger>
              <TabsTrigger value="test" data-testid="tab-test-login">Test Logins</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="tel"
                              placeholder="+233 24 123 4567"
                              className="pl-10"
                              data-testid="input-phone"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-10 pr-10"
                              data-testid="input-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="test" className="mt-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  Click to login as test user
                </p>
                {testUsers.map((user) => (
                  <Button
                    key={user.type}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickLogin(user.credential, user.password)}
                    disabled={loginMutation.isPending}
                    data-testid={`button-quick-login-${user.type}`}
                  >
                    <div className="flex flex-col items-start text-left w-full">
                      <span className="font-semibold">{user.label}</span>
                      <span className="text-xs text-muted-foreground">{user.credential}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="text-center w-full">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setLocation("/register")}
                data-testid="button-register-link"
              >
                Sign up
              </Button>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
