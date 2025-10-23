
"use client";

import { useState } from 'react';
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

export default function DevicesPage() {
    const { devices, departments, user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const canAddDevices = departments.length > 0;

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
                    <DialogTrigger asChild>
                        <Button disabled={!canAddDevices}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Device
                        </Button>
                    </DialogTrigger>
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
