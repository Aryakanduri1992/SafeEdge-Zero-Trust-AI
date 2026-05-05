"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Cpu, Plus, Loader2, Search, MoreVertical, AlertCircle, QrCode, Check, Copy, Download, Trash2, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';

interface OrgData {
  departments: any[];
  floors: any[];
  devices: any[];
  statistics: {
    totalDevices: number;
  };
}

interface DeviceFormData {
  name: string;
  type: string;
  departmentId: string;
  floorId: string;
  roomId: string;
  manufacturer: string;
  model: string;
  macAddress: string;
  ipAddress: string;
  notes: string;
  connectionType: string; // 'ethernet' or 'wifi'
  wifiSsid: string;
  wifiPassword: string;
}

interface ProvisioningData {
  device_id: string;
  qr_code: string;
  config_json: any;
  provisioning_token: string;
  certificate: string;
  private_key: string;
  encryption_key: string;
  ca_certificate: string;
}

export default function DevicesPage() {
  const router = useRouter();
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [provisioningData, setProvisioningData] = useState<ProvisioningData | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    type: '',
    departmentId: '',
    floorId: '',
    roomId: '',
    manufacturer: '',
    model: '',
    macAddress: '',
    ipAddress: '',
    notes: '',
    connectionType: 'ethernet',
    wifiSsid: '',
    wifiPassword: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchOrgData(userData.organizationId);
    }
  }, []);

  useEffect(() => {
    // Update available rooms when floor is selected
    if (formData.floorId && orgData) {
      const floor = orgData.floors.find(f => f.id === formData.floorId);
      setAvailableRooms(floor?.rooms || []);
      // Reset room selection when floor changes
      setFormData(prev => ({ ...prev, roomId: '' }));
    } else {
      setAvailableRooms([]);
    }
  }, [formData.floorId, orgData]);

  const fetchOrgData = async (organizationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/org-data?organizationId=${organizationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setOrgData(data);
    } catch (error: any) {
      console.error('Error fetching org data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load device data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDevice = async () => {
    // Validation - Device configuration is MANDATORY
    if (!formData.name || !formData.type || !formData.departmentId || !formData.floorId || !formData.roomId) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields (Name, Type, Department, Floor, Room)',
      });
      return;
    }

    // Validate WiFi credentials if WiFi is selected
    if (formData.connectionType === 'wifi' && (!formData.wifiSsid || !formData.wifiPassword)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'WiFi SSID and Password are required for WiFi connection',
      });
      return;
    }

    try {
      setIsSaving(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);

      // Step 1: Call backend provisioning API to generate certificates and QR code
      const provisionResponse = await fetch('http://localhost:8000/api/devices/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_name: formData.name,
          device_type: formData.type,
          location: `${getRoomName(formData.roomId)} - ${getFloorNumber(formData.roomId)}`,
          organization_id: userData.organizationId,
          department_id: formData.departmentId,
          connection_type: formData.connectionType,
          wifi_ssid: formData.connectionType === 'wifi' ? formData.wifiSsid : null,
          wifi_password: formData.connectionType === 'wifi' ? formData.wifiPassword : null,
          gateway_address: '192.168.1.177',
          gateway_port: 8883,
        }),
      });

      const provisionData = await provisionResponse.json();

      if (!provisionResponse.ok) {
        throw new Error(provisionData.detail || 'Failed to provision device');
      }

      // Step 2: Store device in Firestore for frontend display
      const dbResponse = await fetch('/api/devices/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          departmentId: formData.departmentId,
          floorId: formData.floorId,
          roomId: formData.roomId,
          manufacturer: formData.manufacturer,
          model: formData.model,
          macAddress: formData.macAddress,
          ipAddress: formData.ipAddress,
          notes: formData.notes,
          organizationId: userData.organizationId,
          status: 'pending', // Status is 'pending' until ESP32 validates
          esp32DeviceId: provisionData.device_id, // Link to ESP32 device in Firebase Realtime DB
          connectionType: formData.connectionType,
        }),
      });

      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(dbData.error || 'Failed to store device in Firestore');
      }

      console.log('✅ Device stored in Firestore:', dbData.deviceId);

      // Store provisioning data and show QR code
      setProvisioningData(provisionData);
      setShowQRCode(true);

      toast({
        title: 'Device Provisioned!',
        description: 'Certificates generated. Scan QR code to provision ESP32.',
      });

    } catch (error: any) {
      console.error('Error provisioning device:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to provision device',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getOnlineDevices = () => {
    if (!orgData) return 0;
    return orgData.devices.filter(d => d.status === 'online').length;
  };

  const getOfflineDevices = () => {
    if (!orgData) return 0;
    return orgData.devices.filter(d => d.status === 'offline').length;
  };

  const getWarningDevices = () => {
    // Mock data - devices with warnings
    return 8;
  };

  const filteredDevices = orgData?.devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getRoomName = (roomId: string) => {
    for (const floor of orgData?.floors || []) {
      const room = floor.rooms?.find((r: any) => r.id === roomId);
      if (room) return room.identifier;
    }
    return 'N/A';
  };

  const getFloorNumber = (roomId: string) => {
    for (const floor of orgData?.floors || []) {
      const room = floor.rooms?.find((r: any) => r.id === roomId);
      if (room) return `F${floor.floorNumber}`;
    }
    return 'N/A';
  };

  const getDepartmentName = (deptId: string) => {
    const dept = orgData?.departments.find(d => d.id === deptId);
    return dept?.name || 'N/A';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Copied to clipboard',
    });
  };

  const downloadConfig = () => {
    if (!provisioningData) return;

    const configBlob = new Blob(
      [JSON.stringify(provisioningData.config_json, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(configBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${provisioningData.device_id}_config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;

    try {
      setIsDeleting(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);

      // Call frontend API to delete device
      const response = await fetch(`/api/devices/delete?deviceId=${deviceToDelete.id}&organizationId=${userData.organizationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete device');
      }

      toast({
        title: 'Device Deleted',
        description: `${deviceToDelete.name} has been deleted successfully`,
      });

      // Refresh device list
      fetchOrgData(userData.organizationId);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);

    } catch (error: any) {
      console.error('Error deleting device:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete device',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeviceClick = (device: any) => {
    router.push(`/org-dashboard/devices/${device.id}`);
  };

  const openDeleteDialog = (device: any) => {
    setDeviceToDelete(device);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setShowQRCode(false);
    setProvisioningData(null);
    setFormData({
      name: '',
      type: '',
      departmentId: '',
      floorId: '',
      roomId: '',
      manufacturer: '',
      model: '',
      macAddress: '',
      ipAddress: '',
      notes: '',
      connectionType: 'ethernet',
      wifiSsid: '',
      wifiPassword: ''
    });
    
    // Refresh device list
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchOrgData(userData.organizationId);
    }
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Devices</h1>
              <p className="text-gray-200">Monitor and manage all IoT devices</p>
            </div>
            <Button 
              className="bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876] font-semibold"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Devices</CardTitle>
                  <Cpu className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{orgData?.statistics.totalDevices || 0}</div>
                  <p className="text-xs text-[#5B6B8F] mt-1">Registered devices</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Online</CardTitle>
                  <div className="h-3 w-3 bg-[#6B8E6F] rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{getOnlineDevices()}</div>
                  <p className="text-xs text-[#6B8E6F] mt-1">
                    {orgData?.statistics.totalDevices ? Math.round((getOnlineDevices() / orgData.statistics.totalDevices) * 100) : 0}% operational
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Offline</CardTitle>
                  <div className="h-3 w-3 bg-[#8B2635] rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{getOfflineDevices()}</div>
                  <p className="text-xs text-[#8B2635] mt-1">
                    {orgData?.statistics.totalDevices ? Math.round((getOfflineDevices() / orgData.statistics.totalDevices) * 100) : 0}% offline
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Warnings</CardTitle>
                  <AlertCircle className="h-5 w-5 text-[#C17A3A]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{getWarningDevices()}</div>
                  <p className="text-xs text-[#C17A3A] mt-1">Requires attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="border-[#242d53]/10">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5B6B8F]" />
                    <Input
                      placeholder="Search devices by name or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-[#242d53]/20 focus:border-[#d3b78f]"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-40 border-[#242d53]/20">
                      <SelectValue placeholder="Floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Floors</SelectItem>
                      {orgData?.floors.map(floor => (
                        <SelectItem key={floor.id} value={floor.id}>Floor {floor.floorNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-40 border-[#242d53]/20">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Devices Table */}
            <Card className="border-[#242d53]/20 bg-white shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-t-lg">
                <CardTitle className="text-white text-xl">Device Inventory</CardTitle>
                <CardDescription className="text-gray-200">All registered devices in your organization</CardDescription>
              </CardHeader>
              <CardContent className="bg-white p-0">
                {filteredDevices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-[#d3b78f] bg-gradient-to-r from-[#242d53]/10 to-[#d3b78f]/10 hover:bg-gradient-to-r hover:from-[#242d53]/10 hover:to-[#d3b78f]/10">
                        <TableHead className="text-[#242d53] font-bold text-sm">Status</TableHead>
                        <TableHead className="text-[#242d53] font-bold text-sm">Name</TableHead>
                        <TableHead className="text-[#242d53] font-bold text-sm">Type</TableHead>
                        <TableHead className="text-[#242d53] font-bold text-sm">Floor</TableHead>
                        <TableHead className="text-[#242d53] font-bold text-sm">Room</TableHead>
                        <TableHead className="text-[#242d53] font-bold text-sm">Department</TableHead>
                        <TableHead className="text-[#242d53] font-bold text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {filteredDevices.map((device: any) => (
                        <TableRow 
                          key={device.id} 
                          className="border-b border-gray-200 hover:bg-[#d3b78f]/5 transition-colors cursor-pointer"
                          onClick={() => handleDeviceClick(device)}
                        >
                          <TableCell>
                            <Badge 
                              variant={device.status === 'online' ? 'default' : 'destructive'}
                              className={device.status === 'online' ? 'bg-[#6B8E6F] hover:bg-[#6B8E6F]/90 text-white font-medium' : 'bg-[#8B2635] hover:bg-[#8B2635]/90 text-white font-medium'}
                            >
                              {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-[#242d53]">{device.name}</TableCell>
                          <TableCell className="text-gray-700 font-medium">{device.type}</TableCell>
                          <TableCell className="text-gray-700 font-medium">{getFloorNumber(device.roomId)}</TableCell>
                          <TableCell className="text-gray-700 font-medium">{getRoomName(device.roomId)}</TableCell>
                          <TableCell className="text-gray-700 font-medium">{getDepartmentName(device.departmentId)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="hover:bg-[#d3b78f]/30 hover:text-[#242d53] transition-colors"
                                  onClick={(e) => e.stopPropagation()} // Prevent row click when clicking menu
                                >
                                  <MoreVertical className="w-4 h-4 text-[#242d53]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click
                                    handleDeviceClick(device);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                >
                                  <Activity className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click
                                    openDeleteDialog(device);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Device
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Cpu className="w-12 h-12 mx-auto mb-4 text-[#d3b78f]" />
                    <p className="text-[#242d53] mb-2 font-semibold">No devices found</p>
                    <p className="text-sm text-[#5B6B8F] mb-4">Add your first device to get started</p>
                    <Button 
                      className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90 border-2 border-transparent hover:border-[#d3b78f]"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Device
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-2 border-[#242d53]/10 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-[#242d53]">
              {showQRCode ? 'Device Provisioned - Scan QR Code' : 'Add New ESP32 Device'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {showQRCode 
                ? 'Scan the QR code with your mobile to provision the ESP32 device'
                : 'Fill in the device configuration to generate certificates and QR code'}
            </DialogDescription>
          </DialogHeader>

          {!showQRCode ? (
            /* Device Configuration Form */
            <div className="space-y-6 py-4">
              {/* Device Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#d3b78f]/30">
                  <div className="w-1 h-5 bg-[#d3b78f] rounded"></div>
                  <h4 className="font-semibold text-[#242d53]">Device Information</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-[#242d53]">
                      Device Name <span className="text-[#8B2635]">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., ESP32-Sensor-101"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="border-gray-300 focus-visible:ring-[#d3b78f] focus-visible:border-[#d3b78f] bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-[#242d53]">
                      Device Type <span className="text-[#8B2635]">*</span>
                    </Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="border-gray-300 focus:border-[#d3b78f] focus:ring-2 focus:ring-[#d3b78f]/20 bg-white text-[#242d53]">
                        <SelectValue placeholder="Select type" className="text-[#242d53]" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300 shadow-lg z-50">
                        <SelectItem value="temperature_sensor" className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 data-[state=checked]:bg-[#d3b78f]/30 text-[#242d53] cursor-pointer">Temperature Sensor</SelectItem>
                        <SelectItem value="door_lock" className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 data-[state=checked]:bg-[#d3b78f]/30 text-[#242d53] cursor-pointer">Door Lock</SelectItem>
                        <SelectItem value="camera" className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 data-[state=checked]:bg-[#d3b78f]/30 text-[#242d53] cursor-pointer">Security Camera</SelectItem>
                        <SelectItem value="medical_device" className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 data-[state=checked]:bg-[#d3b78f]/30 text-[#242d53] cursor-pointer">Medical Device</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Connection Type */}
                <div className="space-y-2">
                  <Label htmlFor="connectionType" className="text-sm font-medium text-[#242d53]">
                    Connection Type <span className="text-[#8B2635]">*</span>
                  </Label>
                  <Select value={formData.connectionType} onValueChange={(value) => setFormData({ ...formData, connectionType: value })}>
                    <SelectTrigger className="border-gray-300 focus:border-[#d3b78f] focus:ring-2 focus:ring-[#d3b78f]/20 bg-white text-[#242d53]">
                      <SelectValue placeholder="Select connection" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 shadow-lg z-50">
                      <SelectItem value="ethernet" className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 text-[#242d53] cursor-pointer">Ethernet (Wired)</SelectItem>
                      <SelectItem value="wifi" className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 text-[#242d53] cursor-pointer">WiFi (Wireless)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* WiFi Credentials (conditional) */}
                {formData.connectionType === 'wifi' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <Label htmlFor="wifiSsid" className="text-sm font-medium text-[#242d53]">
                        WiFi SSID <span className="text-[#8B2635]">*</span>
                      </Label>
                      <Input
                        id="wifiSsid"
                        placeholder="e.g., Hospital-WiFi"
                        value={formData.wifiSsid}
                        onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
                        className="border-gray-300 focus-visible:ring-[#d3b78f] bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wifiPassword" className="text-sm font-medium text-[#242d53]">
                        WiFi Password <span className="text-[#8B2635]">*</span>
                      </Label>
                      <Input
                        id="wifiPassword"
                        type="password"
                        placeholder="WiFi password"
                        value={formData.wifiPassword}
                        onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                        className="border-gray-300 focus-visible:ring-[#d3b78f] bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Location Assignment */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#d3b78f]/30">
                  <div className="w-1 h-5 bg-[#d3b78f] rounded"></div>
                  <h4 className="font-semibold text-[#242d53]">Location Assignment</h4>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-[#242d53]">
                    Department <span className="text-[#8B2635]">*</span>
                  </Label>
                  <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                    <SelectTrigger className="border-gray-300 focus:border-[#d3b78f] focus:ring-2 focus:ring-[#d3b78f]/20 bg-white text-[#242d53]">
                      <SelectValue placeholder="Select department" className="text-[#242d53]" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 shadow-lg z-50">
                      {orgData?.departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id} className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 data-[state=checked]:bg-[#d3b78f]/30 text-[#242d53] cursor-pointer">{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor" className="text-sm font-medium text-[#242d53]">
                    Floor <span className="text-[#8B2635]">*</span>
                  </Label>
                  <Select value={formData.floorId} onValueChange={(value) => setFormData({ ...formData, floorId: value })}>
                    <SelectTrigger className="border-gray-300 focus:border-[#d3b78f] focus:ring-2 focus:ring-[#d3b78f]/20 bg-white text-[#242d53]">
                      <SelectValue placeholder="Select floor" className="text-[#242d53]" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 shadow-lg z-50">
                      {orgData?.floors.map(floor => (
                        <SelectItem key={floor.id} value={floor.id} className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 data-[state=checked]:bg-[#d3b78f]/30 text-[#242d53] cursor-pointer">
                          Floor {floor.floorNumber} - {floor.floorName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room" className="text-sm font-medium text-[#242d53]">
                    Room <span className="text-[#8B2635]">*</span>
                  </Label>
                  <Select 
                    value={formData.roomId} 
                    onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                    disabled={!formData.floorId}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#d3b78f] focus:ring-2 focus:ring-[#d3b78f]/20 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed text-[#242d53]">
                      <SelectValue placeholder={formData.floorId ? "Select room" : "Select floor first"} className="text-[#242d53]" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 shadow-lg z-50">
                      {availableRooms.map(room => (
                        <SelectItem key={room.id} value={room.id} className="hover:bg-[#d3b78f]/20 focus:bg-[#d3b78f]/20 data-[state=checked]:bg-[#d3b78f]/30 text-[#242d53] cursor-pointer">
                          {room.identifier} - {room.name} ({room.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Device Configuration (Optional) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#d3b78f]/30">
                  <div className="w-1 h-5 bg-[#d3b78f] rounded"></div>
                  <h4 className="font-semibold text-[#242d53]">Additional Info <span className="text-sm font-normal text-gray-500">(Optional)</span></h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="text-sm font-medium text-[#242d53]">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      placeholder="e.g., Espressif"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="border-gray-300 focus-visible:ring-[#d3b78f] focus-visible:border-[#d3b78f] bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-medium text-[#242d53]">Model</Label>
                    <Input
                      id="model"
                      placeholder="e.g., ESP32-DevKit"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="border-gray-300 focus-visible:ring-[#d3b78f] focus-visible:border-[#d3b78f] bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-[#242d53]">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this device..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="border-gray-300 focus-visible:ring-[#d3b78f] focus-visible:border-[#d3b78f] bg-white resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* QR Code Display */
            <div className="space-y-6 py-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>Device provisioned successfully! Certificates and keys generated.</span>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Device ID
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={provisioningData?.device_id || ''}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <Button
                    onClick={() => copyToClipboard(provisioningData?.device_id || '')}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Scan QR Code to Provision ESP32
                </h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        📱 Mobile Provisioning Steps:
                      </h4>
                      <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                        <li>Power on your ESP32 device</li>
                        <li>ESP32 creates WiFi AP: <code className="bg-white px-2 py-1 rounded">SafeEdge-XXXXXX</code></li>
                        <li>Connect your phone to ESP32 WiFi (Password: <code className="bg-white px-2 py-1 rounded">SafeEdge2026</code>)</li>
                        <li><strong>Click "Copy Config JSON" button below</strong></li>
                        <li>Browser opens automatically with provisioning page</li>
                        <li>Paste the JSON in the text area</li>
                        <li>Click "Provision Device"</li>
                        <li>ESP32 validates with backend and restarts ✅</li>
                      </ol>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                      {provisioningData?.qr_code && (
                        <img
                          src={provisioningData.qr_code}
                          alt="Device Configuration QR Code"
                          className="w-48 h-48"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    📋 Copy Config JSON (Easiest Method)
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Click the button below to copy the configuration JSON. Then paste it in the ESP32 provisioning page on your phone.
                  </p>
                  <Button
                    onClick={() => {
                      if (provisioningData?.config_json) {
                        copyToClipboard(JSON.stringify(provisioningData.config_json));
                        toast({
                          title: 'Config Copied!',
                          description: 'Paste it in the ESP32 provisioning page on your phone',
                        });
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Config JSON
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    🔐 Enterprise Security Features:
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>✅ ECC Certificate generated (secp256r1)</li>
                    <li>✅ AES-256-GCM encryption key created</li>
                    <li>✅ One-time provisioning token (prevents replay attacks)</li>
                    <li>✅ MAC address binding (prevents device cloning)</li>
                    <li>✅ Backend validation before accepting credentials</li>
                  </ul>
                </div>

                <Button
                  onClick={downloadConfig}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Config File (Backup)
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-gray-200 pt-4 gap-2">
            {!showQRCode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCloseDialog} 
                  disabled={isSaving}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddDevice} 
                  disabled={isSaving} 
                  className="bg-[#242d53] text-white hover:bg-[#242d53]/90 shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Certificates...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleCloseDialog} 
                className="bg-[#242d53] text-white hover:bg-[#242d53]/90 shadow-md w-full"
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Device
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              <div>
                Are you sure you want to delete <strong>{deviceToDelete?.name}</strong>? 
                This action cannot be undone and will:
              </div>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove the device from your organization</li>
                <li>Revoke all certificates and encryption keys</li>
                <li>Delete all sensor data and history</li>
                <li>Disconnect the device permanently</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDevice}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Device
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutWrapper>
  );
}
