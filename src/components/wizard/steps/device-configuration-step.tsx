"use client";

import React, { useState } from 'react';
import { useWizard } from '@/contexts/wizard-context';
import { Device } from '@/lib/validations/organization-wizard';
import { generateId } from '@/lib/wizard-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeviceConfigurationStep() {
  const { state, setDevices, completeStep, nextStep } = useWizard();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Camera' as 'Camera' | 'Sensor' | 'Access Control' | 'Other',
    roomId: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
  });

  const handleAddDevice = () => {
    if (!formData.name || !formData.roomId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in required fields',
      });
      return;
    }

    const newDevice: Device = {
      id: generateId(),
      name: formData.name,
      type: formData.type,
      roomId: formData.roomId,
      manufacturer: formData.manufacturer,
      model: formData.model,
      serialNumber: formData.serialNumber,
      status: 'offline',
    };

    setDevices([...state.devices, newDevice]);
    setFormData({
      name: '',
      type: 'Camera',
      roomId: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
    });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDevices(state.devices.filter(d => d.id !== id));
  };

  const handleSkip = () => {
    completeStep(5);
    nextStep();
  };

  const handleContinue = () => {
    completeStep(5);
    nextStep();
  };

  // Get room name helper
  const getRoomName = (roomId: string) => {
    for (const floor of state.floors) {
      const room = floor.rooms.find(r => r.id === roomId);
      if (room) return `${room.identifier} - ${room.name} (Floor ${floor.floorNumber})`;
    }
    return 'Unknown Room';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Device Pre-Configuration (Optional)</CardTitle>
          <CardDescription>
            Add devices now or skip and configure them later from the organization dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Device</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Device Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Front Door Camera"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Device Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Camera">Camera</SelectItem>
                        <SelectItem value="Sensor">Sensor</SelectItem>
                        <SelectItem value="Access Control">Access Control</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room *</Label>
                    <Select
                      value={formData.roomId}
                      onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.floors.map(floor => (
                          <React.Fragment key={floor.id}>
                            {floor.rooms.map(room => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.identifier} - {room.name} (Floor {floor.floorNumber})
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Input
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <Button onClick={handleAddDevice} className="w-full">
                    Add Device
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleSkip}>
              Skip This Step
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      <Card>
        <CardHeader>
          <CardTitle>Devices ({state.devices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {state.devices.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No devices added yet. You can add them now or skip this step.
            </p>
          ) : (
            <div className="space-y-2">
              {state.devices.map(device => (
                <div key={device.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">{device.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {device.type} • {getRoomName(device.roomId)}
                    </div>
                    {device.manufacturer && (
                      <div className="text-xs text-muted-foreground">
                        {device.manufacturer} {device.model}
                      </div>
                    )}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(device.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          Continue to Review
        </Button>
      </div>
    </div>
  );
}
