
"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DeviceList } from '@/components/admin/device-list';
import { DeviceForm } from '@/components/admin/device-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export default function DevicesPage() {
    const { devices, departments, user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const canAddDevices = departments.length > 0;

    const { totalDeviceQuota, usedDevices } = useMemo(() => {
      const quota = departments.reduce((acc, dept) => acc + dept.devices, 0);
      return {
        totalDeviceQuota: quota,
        usedDevices: devices.length,
      };
    }, [departments, devices]);
    
    const isQuotaReached = usedDevices >= totalDeviceQuota;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
                    <p className="text-muted-foreground">
                        Add, view, and manage all devices for {user?.organizationName}.
                    </p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                   <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div tabIndex={0}>
                                <DialogTrigger asChild>
                                    <Button disabled={!canAddDevices || isQuotaReached}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Device
                                    </Button>
                                </DialogTrigger>
                            </div>
                        </TooltipTrigger>
                        {isQuotaReached && (
                             <TooltipContent>
                                <p>Device quota reached.</p>
                            </TooltipContent>
                        )}
                        {!canAddDevices && (
                            <TooltipContent>
                                <p>You must have at least one department to add a device.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                   </TooltipProvider>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Device</DialogTitle>
                            <DialogDescription>
                                Fill in the details to register a new device.
                            </DialogDescription>
                        </DialogHeader>
                        <DeviceForm onFinished={() => setIsFormOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <DeviceList devices={devices} departments={departments} />
        </div>
    );
}
