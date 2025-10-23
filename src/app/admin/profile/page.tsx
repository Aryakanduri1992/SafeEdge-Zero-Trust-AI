
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Organization } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, HardDrive, Calendar, Globe, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { useMemo } from 'react';

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
  const { user, departments, isLoading: isAuthLoading } = useAuth();
  const orgUser = user as Organization;
  const firestore = useFirestore();

  const isLoading = isAuthLoading;

  if (isLoading || !orgUser) {
    return <LoadingSkeleton />;
  }

  const totalDeviceQuota = departments.reduce((acc, dept) => acc + dept.devices, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">
          View your organization's details and aggregate subscription status.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Details for {orgUser.organizationName}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-foreground">{orgUser.organizationName}</p>
              </div>
            </div>
             <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Contact Email</p>
                <p className="text-sm text-foreground">{orgUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Departments</p>
                <p className="text-sm text-foreground">{departments.length}</p>
              </div>
            </div>
             <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-foreground">
                  {format(new Date(orgUser.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Aggregate Quotas</CardTitle>
            <CardDescription>Total usage across all departments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Device Quota</p>
                <p className="text-sm text-foreground">{totalDeviceQuota} Devices</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Star className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Plans in Use</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(new Set(departments.map(d => d.plan))).map(plan => (
                     <Badge key={plan} variant={plan === 'Pro' ? 'default' : plan === 'Enterprise' ? 'destructive' : 'secondary'}>{plan}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
