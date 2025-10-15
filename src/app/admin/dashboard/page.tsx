"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Smartphone, Star } from "lucide-react";
import { AdminUser } from "@/lib/types";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const adminUser = user as AdminUser;

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

  if (!adminUser) {
    return null;
  }

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}. View your profile details below.</p>
      </div>

      <Card className="max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            <span>Your Profile</span>
          </CardTitle>
          <CardDescription>
            This is your current administrator profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
           <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium text-muted-foreground">Name</span>
            <span className="font-semibold">{adminUser.name}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium text-muted-foreground">Email</span>
            <span className="font-semibold">{adminUser.email}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/>Date Joined</span>
            <span className="font-semibold">{new Date(adminUser.createdAt).toLocaleDateString()}</span>
          </div>
           <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium text-muted-foreground flex items-center gap-2"><Smartphone className="h-4 w-4" />Allowed Devices</span>
            <span className="font-semibold">{adminUser.devices}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium text-muted-foreground flex items-center gap-2"><Star className="h-4 w-4" />Subscription Plan</span>
            <Badge variant={planVariant(adminUser.plan)}>{adminUser.plan}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
