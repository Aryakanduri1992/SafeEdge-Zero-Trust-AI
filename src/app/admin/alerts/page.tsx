"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center p-10 sm:p-16">
        <ShieldAlert className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="font-semibold text-xl">All Systems Green</h3>
        <p className="text-muted-foreground text-sm mt-2">There are no active alerts to display at this time.</p>
    </div>
);

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
            <CardTitle>Live Alert Feed</CardTitle>
            <CardDescription>
                No active alerts.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    </div>
  );
}
