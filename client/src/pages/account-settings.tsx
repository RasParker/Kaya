import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Phone, Mail, Save, Store, Clock, Globe, Camera, X } from "lucide-react";

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [profileImagePreview, setProfileImagePreview] = useState(user?.profileImage || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Seller-specific fields
  const [market, setMarket] = useState("Makola");
  const [openingHours, setOpeningHours] = useState({ start: "06:00", end: "18:00" });
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");

  // Fetch seller profile if user is a seller
  const { data: sellerProfile } = useQuery<any[]>({
    queryKey: [`/api/sellers?userId=${user?.id}`],
    enabled: !!user && user.userType === 'seller',
  });

  // Update state when seller profile is loaded
  useEffect(() => {
    if (sellerProfile && Array.isArray(sellerProfile) && sellerProfile.length > 0) {
      const seller = sellerProfile[0];
      setMarket(seller.market || "Makola");
      setOpeningHours(seller.openingHours || { start: "06:00", end: "18:00" });
      setLanguages(seller.languages || []);
    }
  }, [sellerProfile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
        setProfileImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setProfileImage("");
    setProfileImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string; email?: string; profileImage?: string; sellerData?: any }) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, {
        name: data.name,
        phone: data.phone,
        email: data.email,
        profileImage: data.profileImage,
      });
      const updatedUser = await response.json();
      
      // Update seller profile if user is a seller and seller data is provided
      if (user?.userType === 'seller' && data.sellerData && sellerProfile && Array.isArray(sellerProfile) && sellerProfile.length > 0) {
        const seller = sellerProfile[0];
        // Verify this seller belongs to the current user
        if (seller.userId === user.id) {
          const sellerResponse = await apiRequest("PATCH", `/api/sellers/${seller.id}`, data.sellerData);
          await sellerResponse.json();
        } else {
          throw new Error('Unauthorized: Cannot update another seller\'s profile');
        }
      }
      
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      // Update local storage with new user data
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      if (user?.userType === 'seller') {
        queryClient.invalidateQueries({ queryKey: [`/api/sellers?userId=${user.id}`] });
      }
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

    const sellerData = user?.userType === 'seller' ? {
      market,
      openingHours,
      languages,
    } : undefined;

    updateProfileMutation.mutate({
      name,
      phone: phone || undefined,
      email: email || undefined,
      profileImage: profileImage === "" ? "" : (profileImage || undefined),
      sellerData,
    });
  };

  const addLanguage = () => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      setLanguages([...languages, languageInput.trim()]);
      setLanguageInput("");
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
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
              {/* Profile Image */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                          data-testid="img-profile-preview"
                        />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    {profileImagePreview && (
                      <button
                        type="button"
                        onClick={removeProfileImage}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                        data-testid="button-remove-avatar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      data-testid="input-avatar-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-upload-avatar"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Change Picture
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max 5MB
                    </p>
                  </div>
                </div>
              </div>

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

          {/* Seller-specific Information */}
          {user.userType === 'seller' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Market */}
                <div className="space-y-2">
                  <Label htmlFor="market">
                    <Store className="h-4 w-4 inline mr-2" />
                    Market
                  </Label>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger data-testid="select-market">
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Makola">Makola</SelectItem>
                      <SelectItem value="Kaneshie">Kaneshie</SelectItem>
                      <SelectItem value="Madina">Madina</SelectItem>
                      <SelectItem value="Dome">Dome</SelectItem>
                      <SelectItem value="Ashaiman">Ashaiman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Opening Hours */}
                <div className="space-y-2">
                  <Label>
                    <Clock className="h-4 w-4 inline mr-2" />
                    Opening Hours
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time" className="text-xs text-muted-foreground">Start</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={openingHours.start}
                        onChange={(e) => setOpeningHours({ ...openingHours, start: e.target.value })}
                        data-testid="input-start-time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-xs text-muted-foreground">End</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={openingHours.end}
                        onChange={(e) => setOpeningHours({ ...openingHours, end: e.target.value })}
                        data-testid="input-end-time"
                      />
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-2">
                  <Label htmlFor="languages">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Languages
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="languages"
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                      placeholder="Add a language"
                      data-testid="input-language"
                    />
                    <Button type="button" onClick={addLanguage} variant="outline" data-testid="button-add-language">
                      Add
                    </Button>
                  </div>
                  {languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {languages.map((lang) => (
                        <div key={lang} className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2">
                          <span className="text-sm">{lang}</span>
                          <button
                            type="button"
                            onClick={() => removeLanguage(lang)}
                            className="text-primary hover:text-primary/80"
                            data-testid={`button-remove-${lang}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
