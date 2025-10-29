
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RealtimeChart } from "@/components/admin/realtime-chart";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingSkeleton = () => (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-72 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
)


export default function AlertsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
        <p className="text-muted-foreground">
          View and manage real-time security and operational events.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Live Sensor Feed</CardTitle>
            <CardDescription>
                Real-time data stream from active sensors across the organization.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <RealtimeChart organizationId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
