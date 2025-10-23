
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Device, Department } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, HardDrive, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DeviceForm } from './device-form';
import { DeleteDeviceDialog } from './delete-device-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeviceListProps = {
    devices: Device[];
    departments: Department[];
};

export function DeviceList({ devices, departments }: DeviceListProps) {
    const { deleteDevice } = useAuth();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    const handleEditClick = (device: Device) => {
        setSelectedDevice(device);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (device: Device) => {
        setSelectedDevice(device);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedDevice) {
            deleteDevice(selectedDevice.id);
            setIsDeleteDialogOpen(false);
            setSelectedDevice(null);
        }
    };

    const getDepartmentName = (departmentId: string) => {
        return departments.find(d => d.id === departmentId)?.departmentName || 'Unknown';
    };
    
    const statusVariant = (status: Device['status']) => {
        switch (status) {
            case 'online': return 'outline';
            case 'offline': return 'secondary';
            case 'alerting': return 'destructive';
        }
    };
    
    const statusColor = (status: Device['status']) => {
        switch (status) {
            case 'online': return 'text-green-400 border-green-400/50';
            case 'offline': return 'text-muted-foreground';
            case 'alerting': return '';
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Registered Devices</CardTitle>
                    <CardDescription>A list of all devices registered to your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    {devices.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Device Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Last Seen</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {devices.map((device) => (
                                    <TableRow key={device.id}>
                                        <TableCell className="font-medium">{device.name}</TableCell>
                                        <TableCell>{getDepartmentName(device.departmentId)}</TableCell>
                                        <TableCell>{device.location}</TableCell>
                                        <TableCell>{device.type}</TableCell>
                                        <TableCell>{format(parseISO(device.lastSeen), 'PPpp')}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusVariant(device.status)} className={statusColor(device.status)}>
                                                {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                                            </Badge>
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
                                                    <DropdownMenuItem onClick={() => handleEditClick(device)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(device)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-16">
                            <HardDrive className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Devices Found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Get started by adding your first device.
                            </p>
                             {departments.length === 0 && (
                                <div className="mt-4 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-md flex items-center justify-center gap-2 max-w-md mx-auto">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>You must have at least one department before you can add a device.</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Device: {selectedDevice?.name}</DialogTitle>
                        <DialogDescription>
                            Update the details for this device.
                        </DialogDescription>
                    </DialogHeader>
                    <DeviceForm
                        deviceToEdit={selectedDevice}
                        onFinished={() => setIsEditDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <DeleteDeviceDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                device={selectedDevice}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}
