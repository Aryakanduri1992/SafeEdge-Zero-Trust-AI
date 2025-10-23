
"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building } from "lucide-react";
import { Organization, Department } from "@/lib/types";

const LoadingSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div>
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-[108px] w-full" />
      <Skeleton className="h-[108px] w-full" />
    </div>
  </div>
);


export default function AdminDashboardPage() {
  const { user, departments } = useAuth();
  const orgUser = user as Organization;
  
  const isLoading = departments.length === 0;

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (!orgUser) {
    return null;
  }

  const totalDepartments = departments.length;
  const totalDeviceQuota = departments.reduce((acc, dept) => acc + dept.devices, 0);


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Organization Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.organizationName}. Here is the real-time status of your protected assets.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
             <p className="text-xs text-muted-foreground">
              Managed under this organization
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device License Quota</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeviceQuota}</div>
            <p className="text-xs text-muted-foreground">Total devices licensed</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            Overview of your departments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>A list of departments will be shown here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
