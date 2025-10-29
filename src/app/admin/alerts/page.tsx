
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RealtimeChart } from "@/components/admin/realtime-chart";

export default function AlertsPage() {
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
          <RealtimeChart />
        </CardContent>
      </Card>
    </div>
  );
}
