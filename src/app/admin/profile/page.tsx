
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Organization } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Globe, User, ShieldCheck, Palette, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { ImageSelectorDialog } from "@/components/admin/image-selector-dialog";

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const orgUser = user as Organization;
  const { toast } = useToast();
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const isLoading = isAuthLoading || !orgUser;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : '';
  }

  const handleSsoClick = () => {
    toast({
        title: "Premium Feature",
        description: "SSO is a premium feature. Please contact support to enable it.",
    });
  };

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's profile, security, and appearance settings.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>Primary contact and identity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                   <div className="relative group">
                      <Avatar className="h-24 w-24 border-4 border-background outline outline-1 outline-border shadow-lg">
                        {orgUser.imageUrl ? (
                           <Image src={orgUser.imageUrl} alt={orgUser.organizationName} fill className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                            {getInitials(orgUser.organizationName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <Button
                          variant="outline"
                          size="icon"
                          className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                          onClick={() => setIsImageSelectorOpen(true)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Change Image</span>
                        </Button>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold">{orgUser.organizationName}</p>
                    <p className="text-sm text-muted-foreground">{orgUser.email}</p>
                  </div>
                </div>
                <Separator />
                 <div className="space-y-4 text-sm">
                   <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-muted-foreground">
                        {format(new Date(orgUser.createdAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                   <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">User Role</p>
                      <p className="text-muted-foreground capitalize">{orgUser.role}</p>
                    </div>
                  </div>
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>Enhance your organization's security posture.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="two-factor" className="font-semibold">Two-Factor Authentication (2FA)</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Require a second verification step for all users.
                    </p>
                  </div>
                  <Switch id="two-factor" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="sso" className="font-semibold">Single Sign-On (SSO)</Label>
                     <p className="text-sm text-muted-foreground mt-1">
                      Allow users to sign in with your identity provider.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSsoClick}>Enable SSO</Button>
                </div>
              </CardContent>
            </Card>

             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="font-semibold">Interface Theme</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select your preferred light or dark theme.
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ImageSelectorDialog
        isOpen={isImageSelectorOpen}
        onOpenChange={setIsImageSelectorOpen}
        currentImageUrl={orgUser.imageUrl}
      />
    </>
  );
}
