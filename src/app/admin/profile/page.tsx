
"use client";

import { useAuth } from "@/hooks/use-auth";
import { AdminUser, Device } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, Star, HardDrive, Calendar, CheckCircle, XCircle, Globe, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const adminUser = user as AdminUser;
  const firestore = useFirestore();

  const devicesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    return query(collection(firestore, "devices"), where("adminId", "==", user.id));
  }, [firestore, user?.id]);

  const { data: devices, isLoading: areDevicesLoading } = useCollection<Device>(devicesQuery);

  const isLoading = isAuthLoading || areDevicesLoading;

  if (isLoading || !adminUser) {
    return <LoadingSkeleton />;
  }

  const devicesUsed = devices?.length ?? 0;

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
            <CardDescription>Your personal and location details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-foreground">{adminUser.organizationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Department Name</p>
                <p className="text-sm text-foreground">{adminUser.departmentName}</p>
              </div>
            </div>
             <div className="flex items-center gap-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-foreground">{adminUser.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Building / Floor</p>
                <p className="text-sm text-foreground">{adminUser.building}, Floor {adminUser.floor}</p>
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
                <p className="text-sm text-foreground">{devicesUsed} / {adminUser.devices} Devices</p>
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
