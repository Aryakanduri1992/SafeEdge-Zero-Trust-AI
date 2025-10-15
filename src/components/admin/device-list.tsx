"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Device, DeviceStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { DeviceForm } from "./device-form";
import { DeleteDeviceDialog } from "./delete-device-dialog";
import { z } from "zod";

const mockDevices: Device[] = [
  {
    id: "DEV001",
    name: "Mainframe-A",
    status: "online",
    lastSeen: "2024-07-31T10:00:00Z",
    location: "Data Center 1",
    type: "Gateway",
    description: "Primary server mainframe.",
    adminId: "admin1",
    sensorData: { temperature: 45, humidity: 30, motion: false, gas: 10 },
  },
  {
    id: "DEV002",
    name: "Sensor-B2",
    status: "offline",
    lastSeen: "2024-07-30T14:30:00Z",
    location: "Floor 2, Hallway",
    type: "Sensor",
    description: "Motion and temperature sensor.",
    adminId: "admin1",
    sensorData: { temperature: 22, humidity: 45, motion: false, gas: 5 },
  },
  {
    id: "DEV003",
    name: "Gateway-C",
    status: "alerting",
    lastSeen: "2024-07-31T10:05:00Z",
    location: "Data Center 2",
    type: "Gateway",
    description: "Backup server mainframe.",
    adminId: "admin1",
    sensorData: { temperature: 65, humidity: 25, motion: false, gas: 50 },
  },
  {
    id: "DEV004",
    name: "AccessPoint-D1",
    status: "online",
    lastSeen: "2024-07-31T09:58:00Z",
    location: "Lobby",
    type: "Actuator",
    description: "Main door access control.",
    adminId: "admin1",
    sensorData: { temperature: 25, humidity: 50, motion: true, gas: 8 },
  },
  {
    id: "DEV005",
    name: "Server-E",
    status: "online",
    lastSeen: "2024-07-31T10:02:00Z",
    location: "Data Center 1",
    type: "Camera",
    description: "Security camera feed.",
    adminId: "admin1",
    sensorData: { temperature: 30, humidity: 35, motion: true, gas: 7 },
  },
];

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
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const maxDevices = 10;
  const devicesUsed = devices.length;

  const handleAddClick = () => {
    if (devicesUsed >= maxDevices) {
      toast({
        variant: "destructive",
        title: "Quota Exceeded",
        description: "You have reached your device limit. Please upgrade your plan.",
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
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (selectedDevice) {
      // Edit mode
      setDevices(
        devices.map((d) =>
          d.id === selectedDevice.id ? { ...d, ...values } : d
        )
      );
      toast({
        title: "Device Updated",
        description: `"${values.name}" has been successfully updated.`,
      });
    } else {
      // Create mode
      const newDevice: Device = {
        ...values,
        status: "offline",
        lastSeen: new Date().toISOString(),
        adminId: "admin1", // Mock
        sensorData: { temperature: 0, humidity: 0, motion: false, gas: 0 },
      };
      setDevices([...devices, newDevice]);
      toast({
        title: "Device Added",
        description: `"${values.name}" has been added to your devices.`,
      });
    }
    setIsLoading(false);
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDevice) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setDevices(devices.filter((d) => d.id !== selectedDevice.id));
    toast({
      title: "Device Removed",
      description: `"${selectedDevice.name}" has been permanently removed.`,
    });
    setIsLoading(false);
    setIsDeleteOpen(false);
    setSelectedDevice(null);
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Device Registry</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {devicesUsed}
              </span>
              /{maxDevices} Devices Used
            </div>
            <Button onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {devices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Seen</TableHead>
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
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {device.id}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{device.type}</TableCell>
                      <TableCell className="text-muted-foreground">{device.location}</TableCell>
                      <TableCell className="text-muted-foreground">
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
                              <Pencil className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(device)}
                              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                              <Trash2 className="mr-2" />
                              Delete
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
      
      {/* Add/Edit Dialog */}
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
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <DeleteDeviceDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        device={selectedDevice}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
