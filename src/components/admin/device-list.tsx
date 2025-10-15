
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  PlusCircle,
  Pencil,
  Trash2,
  Signal,
  SignalLow,
  SignalHigh,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Device, DeviceStatus, AdminUser, Alert, AlertSeverity, AlertStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { DeviceForm } from "./device-form";
import { DeleteDeviceDialog } from "./delete-device-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { collection, doc, query, where, setDoc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";

// --- Custom Hook for Device Status Simulation ---
const useDeviceStatusSimulation = (devices: Device[] | null, adminId: string) => {
    const firestore = useFirestore();

    useEffect(() => {
        if (!devices || devices.length === 0 || !firestore) return;

        const intervalId = setInterval(() => {
            const deviceToUpdate = devices[Math.floor(Math.random() * devices.length)];
            const statuses: DeviceStatus[] = ["online", "offline", "alerting"];
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

            if (deviceToUpdate.status !== newStatus) {
                const deviceRef = doc(firestore, "devices", deviceToUpdate.id);
                const updatePayload = { status: newStatus, lastSeen: new Date().toISOString() };
                
                updateDoc(deviceRef, updatePayload).catch(serverError => {
                    const permissionError = new FirestorePermissionError({
                        path: deviceRef.path,
                        operation: 'update',
                        requestResourceData: updatePayload,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });

                // Create an alert if status is 'offline' or 'alerting'
                if (newStatus === "offline" || newStatus === "alerting") {
                    let severity: AlertSeverity;
                    let type: string;

                    if (newStatus === "offline") {
                        severity = "high";
                        type = "Device Offline";
                    } else { // alerting
                        severity = "critical";
                        type = "Anomalous Behaviour";
                    }

                    const alertRef = collection(firestore, "alerts");
                    const newAlert: Omit<Alert, 'id'> = {
                        deviceId: deviceToUpdate.id,
                        deviceName: deviceToUpdate.name,
                        adminId: adminId,
                        type: type,
                        severity: severity,
                        status: 'new' as AlertStatus,
                        createdAt: new Date().toISOString(),
                        details: `Device "${deviceToUpdate.name}" reported status: ${newStatus}.`,
                    };

                    addDoc(alertRef, newAlert).catch(serverError => {
                       const permissionError = new FirestorePermissionError({
                            path: 'alerts',
                            operation: 'create',
                            requestResourceData: newAlert,
                        });
                        errorEmitter.emit('permission-error', permissionError);
                    });
                }
            }
        }, 5000); // Run every 5 seconds

        return () => clearInterval(intervalId);
    }, [devices, firestore, adminId]);
};


const getStatusInfo = (status: DeviceStatus) => {
  switch (status) {
    case "online":
      return {
        variant: "default",
        className: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: <SignalHigh className="h-3.5 w-3.5" />,
        label: "Online",
      };
    case "offline":
      return {
        variant: "secondary",
        className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icon: <Signal className="h-3.5 w-3.5" />,
        label: "Offline",
      };
    case "alerting":
      return {
        variant: "destructive",
        className: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <SignalLow className="h-3.5 w-3.5" />,
        label: "Alerting",
      };
    default:
      return {
        variant: "outline",
        icon: <Signal className="h-3.5 w-3.5" />,
        label: "Unknown",
      };
  }
};

export function DeviceList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isMutationLoading, setIsMutationLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const adminUser = user as AdminUser;
  const firestore = useFirestore();

  const devicesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    return query(collection(firestore, "devices"), where("adminId", "==", user.id));
  }, [firestore, user?.id]);

  const { data: devices, isLoading: areDevicesLoading } = useCollection<Device>(devicesQuery);
  
  // Activate the device status simulation
  useDeviceStatusSimulation(devices, user?.id ?? '');

  const devicesUsed = devices?.length ?? 0;
  const maxDevices = adminUser?.plan === 'Pro' ? 25 : adminUser?.plan === 'Enterprise' ? 100 : 10;

  const handleAddClick = () => {
    if (devicesUsed >= maxDevices) {
      toast({
        variant: "destructive",
        title: "Quota Exceeded",
        description: `You have reached your device limit of ${maxDevices}. Please upgrade your plan.`,
      });
      return;
    }
    setSelectedDevice(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (device: Device) => {
    setSelectedDevice(device);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (device: Device) => {
    setSelectedDevice(device);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    if (!user || !firestore) return;
    setIsMutationLoading(true);
    
    if (selectedDevice) {
      // Edit mode
      const deviceRef = doc(firestore, "devices", selectedDevice.id);
      updateDoc(deviceRef, values)
        .then(() => {
            toast({
              title: "Device Updated",
              description: `"${values.name}" has been successfully updated.`,
            });
            setIsFormOpen(false);
            setSelectedDevice(null);
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: deviceRef.path,
                operation: 'update',
                requestResourceData: values,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsMutationLoading(false);
        });
    } else {
      // Create mode
      const deviceId = values.id;
      const deviceRef = doc(firestore, "devices", deviceId);
      const newDevice: Omit<Device, 'id'> = {
        ...values,
        adminId: user.id,
        status: "offline",
        lastSeen: new Date().toISOString(),
        sensorData: { temperature: 0, humidity: 0, motion: false, gas: 0 },
      };
      setDoc(deviceRef, newDevice)
        .then(() => {
            toast({
              title: "Device Added",
              description: `"${values.name}" has been added to your devices.`,
            });
            setIsFormOpen(false);
            setSelectedDevice(null);
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: deviceRef.path,
                operation: 'create',
                requestResourceData: newDevice,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsMutationLoading(false);
        });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDevice || !firestore) return;
    setIsMutationLoading(true);

    const deviceRef = doc(firestore, "devices", selectedDevice.id);
    deleteDoc(deviceRef)
        .then(() => {
            toast({
                title: "Device Removed",
                description: `"${selectedDevice.name}" has been permanently removed.`,
            });
            setIsDeleteOpen(false);
            setSelectedDevice(null);
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: deviceRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsMutationLoading(false);
        });
  };

  const EmptyState = () => (
    <div className="text-center py-16">
      <h3 className="mt-2 text-lg font-semibold">No devices registered yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by adding your first IoT device.
      </p>
      <div className="mt-6">
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>
    </div>
  );
  
  const LoadingState = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Device Registry</CardTitle>
            <CardDescription>
                <span className="font-semibold text-foreground">
                    {devicesUsed}
                </span>
                /{maxDevices} Devices Used
            </CardDescription>
          </div>
          <Button onClick={handleAddClick} disabled={areDevicesLoading} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </CardHeader>
        <CardContent>
          {areDevicesLoading ? <LoadingState /> : (devices && devices.length > 0) ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="hidden xl:table-cell">Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const statusInfo = getStatusInfo(device.status);
                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <Badge
                          variant={statusInfo.variant as any}
                          className={statusInfo.className}
                        >
                          {statusInfo.icon}
                          <span className="hidden sm:inline-block ml-1">{statusInfo.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {device.id}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{device.type}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{device.location}</TableCell>
                      <TableCell className="text-muted-foreground hidden xl:table-cell">
                        {new Date(device.lastSeen).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditClick(device)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(device)}
                              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDevice ? "Edit Device" : "Add New Device"}
            </DialogTitle>
            <DialogDescription>
                {selectedDevice ? `Update the details for "${selectedDevice.name}".` : "Enter the details for your new IoT device."}
            </DialogDescription>
          </DialogHeader>
           <div className="text-center text-sm text-muted-foreground py-2">
              Devices Used: {devicesUsed}/{maxDevices}
            </div>
          <DeviceForm
            device={selectedDevice}
            onSubmit={handleFormSubmit}
            isLoading={isMutationLoading}
          />
        </DialogContent>
      </Dialog>
      
      <DeleteDeviceDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        device={selectedDevice}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

    

    