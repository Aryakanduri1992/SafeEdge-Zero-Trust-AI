
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, HardDrive, AlertTriangle } from 'lucide-react';
import { DeviceForm } from '@/components/admin/device-form';
import { DeviceList } from '@/components/admin/device-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';


const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-9 w-64 mb-2" />
      <Skeleton className="h-5 w-80" />
    </div>
    <div className="flex justify-end">
        <Skeleton className="h-10 w-36" />
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
);


export default function DevicesPage() {
    const { user, devices, departments, isLoading } = useAuth();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { toast } = useToast();

    const { totalDeviceQuota, usedDevices } = useMemo(() => {
        const quota = departments.reduce((acc, dept) => acc + dept.devices, 0);
        return {
        totalDeviceQuota: quota,
        usedDevices: devices.length,
        };
    }, [departments, devices]);

    const handleAddDeviceClick = () => {
        if (departments.length === 0) {
            toast({
                variant: "destructive",
                title: "Cannot Add Device",
                description: "You must create at least one department before adding a device.",
            });
            return;
        }
        if (usedDevices >= totalDeviceQuota) {
            toast({
                variant: "destructive",
                title: "License Quota Reached",
                description: "You cannot add more devices. Please upgrade your plan or contact your administrator.",
            });
            return;
        }
        setIsCreateDialogOpen(true);
    };

    if (isLoading || !user) {
        return <LoadingSkeleton />;
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Devices</h1>
                    <p className="text-muted-foreground">
                        Register, view, and manage all security devices for your organization.
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <Button onClick={handleAddDeviceClick}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Device
                    </Button>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Add a New Device</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to register a new device.
                        </DialogDescription>
                        </DialogHeader>
                        <DeviceForm onFinished={() => setIsCreateDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>
            
            <DeviceList devices={devices} departments={departments} />
        </div>
    );
}

