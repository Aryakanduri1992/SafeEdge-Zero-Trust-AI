
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, HardDrive } from "lucide-react";

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
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
           </div>
        </CardContent>
      </Card>
    </div>
)

export default function AlertsPage() {
  const { user, devices, isLoading } = useAuth();

  if (isLoading || !user) {
    return <LoadingSkeleton />;
  }

  const alertingDevices = devices.filter(d => d.status === 'alerting');

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
            <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Active Alerts
            </CardTitle>
            <CardDescription>
                The following devices are currently in an 'alerting' state.
            </CardDescription>
        </CardHeader>
        <CardContent>
          {alertingDevices.length > 0 ? (
            <div className="space-y-4">
              {alertingDevices.map(device => (
                <div key={device.id} className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                  <div>
                    <p className="font-semibold">{device.name}</p>
                    <p className="text-sm text-muted-foreground">{device.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{device.value?.toFixed(2) || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Last reading</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
                <HardDrive className="h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">All Systems Normal</h3>
                <p className="mt-2 text-sm">
                  There are no devices currently in an alerting state.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
