"use client";

import { DeviceList } from "@/components/admin/device-list";

export default function DevicesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
        <p className="text-muted-foreground">
          View, add, and manage your organization's IoT devices.
        </p>
      </div>
      <DeviceList />
    </div>
  );
}
