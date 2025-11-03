
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DeviceList } from '@/components/admin/device-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeviceForm } from '@/components/admin/device-form';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

export default function DevicesPage() {
  const { devices, departments, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const canAddDevice = departments.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Devices</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage all your organization's devices.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canAddDevice}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Device</DialogTitle>
              <DialogDescription>
                Fill out the form below to register a new device.
              </DialogDescription>
            </DialogHeader>
            <DeviceForm onFinished={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

       {!canAddDevice && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <div className="text-sm">
                  <p className="font-semibold">Cannot Add Devices</p>
                  <p>You must have at least one department configured before you can add a new device.</p>
              </div>
          </div>
      )}

      <DeviceList devices={devices} departments={departments} />
    </div>
  );
}
