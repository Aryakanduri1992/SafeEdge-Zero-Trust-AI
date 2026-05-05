
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Device, Department, Room } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, HardDrive, AlertTriangle } from 'lucide-react';
import { DeviceForm } from './device-form';
import { DeleteDeviceDialog } from './delete-device-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';

type DeviceListProps = {
    devices: Device[];
    departments: Department[];
};

export function DeviceList({ devices, departments }: DeviceListProps) {
    const { deleteDevice, globalSearchTerm, user } = useAuth();
    const router = useRouter();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [roomsMap, setRoomsMap] = useState<Map<string, Room>>(new Map());

    // Load rooms for room name display
    useEffect(() => {
        const loadRooms = async () => {
            if (!user) return;
            
            try {
                // Use API endpoint to get rooms from current floor plan
                const response = await fetch(`/api/floor-plans/current/rooms?organizationId=${user.id}`);
                const result = await response.json();
                
                if (result.success && result.data) {
                    const rooms = new Map<string, Room>();
                    result.data.forEach((room: Room) => {
                        rooms.set(room.id, room);
                    });
                    setRoomsMap(rooms);
                }
            } catch (error) {
                console.error("Failed to load rooms:", error);
            }
        };

        loadRooms();
    }, [user]);

    const filteredDevices = useMemo(() => {
        return devices.filter(device => {
            const department = departments.find(d => d.id === device.departmentId);
            const room = roomsMap.get(device.roomId || '');
            const searchCorpus = `${device.name} ${device.location} ${device.type} ${department?.departmentName || ''} ${room?.name || ''}`.toLowerCase();
            return globalSearchTerm ? searchCorpus.includes(globalSearchTerm.toLowerCase()) : true;
        });
    }, [devices, departments, globalSearchTerm, roomsMap]);

    const handleEditClick = (e: React.MouseEvent, device: Device) => {
        e.stopPropagation();
        setSelectedDevice(device);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, device: Device) => {
        e.stopPropagation();
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
    
    const handleRowClick = (deviceId: string) => {
        router.push(`/admin/devices/${deviceId}`);
    };

    const getDepartmentName = (departmentId: string) => {
        return departments.find(d => d.id === departmentId)?.departmentName || 'Unknown';
    };

    const getRoomName = (roomId: string | undefined) => {
        if (!roomId) return 'Unassigned';
        const room = roomsMap.get(roomId);
        return room ? `${room.name} (${room.identifier})` : 'Unknown Room';
    };
    
    return (
        <>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Registered Devices</CardTitle>
                    <CardDescription>A list of all devices registered to your organization. Click a device name to see its live data.</CardDescription>
                </CardHeader>
                <CardContent>
                    {devices.length > 0 ? (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Device Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Department</TableHead>
                                        <TableHead className="hidden md:table-cell">Room</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDevices.map((device) => (
                                        <TableRow key={device.id} onClick={() => handleRowClick(device.id)} className="cursor-pointer">
                                            <TableCell className="font-medium">
                                                {device.name}
                                                <div className="text-xs text-muted-foreground sm:hidden">
                                                    {getDepartmentName(device.departmentId)} • {getRoomName(device.roomId)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{getDepartmentName(device.departmentId)}</TableCell>
                                            <TableCell className="hidden md:table-cell">{getRoomName(device.roomId)}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => handleEditClick(e, device)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => handleDeleteClick(e, device)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
                                            <TableCell colSpan={4} className="h-24 text-center">
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
