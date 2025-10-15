
"use client";

import { useAuth } from "@/hooks/use-auth";
import { AdminUser } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, Star, HardDrive, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
    <div className="grid gap-8 md:grid-cols-2">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const adminUser = user as AdminUser;

  if (isLoading || !adminUser) {
    return <LoadingSkeleton />;
  }

  const planVariant = (plan: AdminUser['plan']) => {
    switch (plan) {
      case 'Pro':
        return 'default';
      case 'Enterprise':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">
          View your account details and subscription status.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal and organizational details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-foreground">{adminUser.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-foreground">{adminUser.organization}</p>
              </div>
            </div>
             <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-foreground">
                  {format(new Date(adminUser.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Subscription & Quotas</CardTitle>
            <CardDescription>Your current plan and usage limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Star className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Subscription Plan</p>
                <Badge variant={planVariant(adminUser.plan)}>{adminUser.plan}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Device Quota</p>
                <p className="text-sm text-foreground">{adminUser.devices} Devices</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {adminUser.status === 'active' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">Account Status</p>
                <p className="text-sm text-foreground capitalize">{adminUser.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
