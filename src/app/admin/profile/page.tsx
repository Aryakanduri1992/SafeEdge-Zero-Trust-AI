
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Organization } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Globe, User, ShieldCheck, Palette, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const orgUser = user as Organization;

  const isLoading = isAuthLoading || !orgUser;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization's profile, security, and appearance settings.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Primary contact and identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {/* <AvatarImage src="/placeholder-avatar.jpg" /> */}
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                    {getInitials(orgUser.organizationName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{orgUser.organizationName}</p>
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
           <Card>
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
                <Button variant="outline" size="sm" disabled>Enable SSO</Button>
              </div>
            </CardContent>
          </Card>

           <Card>
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
  );
}
