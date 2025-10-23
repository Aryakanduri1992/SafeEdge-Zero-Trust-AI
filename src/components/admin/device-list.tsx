
"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Device, Department } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, HardDrive, AlertTriangle, Search, X } from 'lucide-react';
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
import { Input } from '../ui/input';

type DeviceListProps = {
    devices: Device[];
    departments: Department[];
};

export function DeviceList({ devices, departments }: DeviceListProps) {
    const { deleteDevice } = useAuth();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDevices = useMemo(() => {
        return devices.filter(device => {
            const department = departments.find(d => d.id === device.departmentId);
            const searchCorpus = `${device.name} ${device.location} ${device.type} ${department?.departmentName || ''}`.toLowerCase();
            return searchCorpus.includes(searchTerm.toLowerCase());
        });
    }, [devices, departments, searchTerm]);

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
                     <div className="mt-4 flex items-center gap-2">
                        <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search devices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                                onClick={() => setSearchTerm('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {devices.length > 0 ? (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Device Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Department</TableHead>
                                        <TableHead className="hidden md:table-cell">Location</TableHead>
                                        <TableHead className="hidden lg:table-cell">Type</TableHead>
                                        <TableHead className="hidden lg:table-cell">Last Seen</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDevices.map((device) => (
                                        <TableRow key={device.id}>
                                            <TableCell className="font-medium">
                                                {device.name}
                                                <div className="text-xs text-muted-foreground sm:hidden">{getDepartmentName(device.departmentId)}</div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{getDepartmentName(device.departmentId)}</TableCell>
                                            <TableCell className="hidden md:table-cell">{device.location}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{device.type}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{format(parseISO(device.lastSeen), 'PPpp')}</TableCell>
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
                                    {filteredDevices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No devices found matching your criteria.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
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
