"use client";

import React, { useState, useEffect } from 'react';
import { useWizard } from '@/contexts/wizard-context';
import { Room, RoomTemplate } from '@/lib/validations/organization-wizard';
import { generateId, generateRoomIdentifier, calculateRoomPositions, validateRoomAreas } from '@/lib/wizard-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RoomManagementStep() {
  const { state, setFloors, completeStep, nextStep } = useWizard();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<RoomTemplate[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState(state.floors[0]?.id || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Office',
    width: 10,
    height: 12,
    capacity: 2,
    departmentId: '',
  });

  useEffect(() => {
    // Fetch room templates
    fetch('/api/superadmin/room-templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []))
      .catch(err => console.error('Failed to load templates:', err));
  }, []);

  const selectedFloor = state.floors.find(f => f.id === selectedFloorId);

  const handleAddRoomFromTemplate = (template: RoomTemplate) => {
    if (!selectedFloor) return;

    const identifier = generateRoomIdentifier(selectedFloor.floorNumber, selectedFloor.rooms);
    const newRoom: Room = {
      id: generateId(),
      name: template.name,
      identifier,
      width: template.defaultSize.width,
      height: template.defaultSize.height,
      type: template.type,
      capacity: template.suggestedCapacity,
      departmentId: '',
      position: { x: 0, y: 0, width: template.defaultSize.width, height: template.defaultSize.height },
    };

    const updatedRooms = [...selectedFloor.rooms, newRoom];
    const roomsWithPositions = calculateRoomPositions(updatedRooms);

    const updatedFloor = { ...selectedFloor, rooms: roomsWithPositions };
    setFloors(state.floors.map(f => f.id === selectedFloorId ? updatedFloor : f));

    toast({
      title: 'Room Added',
      description: `${template.name} added to ${selectedFloor.floorName}`,
    });
  };

  const handleAddCustomRoom = () => {
    if (!selectedFloor || !formData.name) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    const identifier = generateRoomIdentifier(selectedFloor.floorNumber, selectedFloor.rooms);
    const newRoom: Room = {
      id: generateId(),
      name: formData.name,
      identifier,
      width: formData.width,
      height: formData.height,
      type: formData.type,
      capacity: formData.capacity,
      departmentId: formData.departmentId,
      position: { x: 0, y: 0, width: formData.width, height: formData.height },
    };

    const updatedRooms = [...selectedFloor.rooms, newRoom];
    const roomsWithPositions = calculateRoomPositions(updatedRooms);

    const updatedFloor = { ...selectedFloor, rooms: roomsWithPositions };
    setFloors(state.floors.map(f => f.id === selectedFloorId ? updatedFloor : f));

    setFormData({
      name: '',
      type: 'Office',
      width: 10,
      height: 12,
      capacity: 2,
      departmentId: '',
    });
    setIsDialogOpen(false);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!selectedFloor) return;
    const updatedRooms = selectedFloor.rooms.filter(r => r.id !== roomId);
    const roomsWithPositions = calculateRoomPositions(updatedRooms);
    const updatedFloor = { ...selectedFloor, rooms: roomsWithPositions };
    setFloors(state.floors.map(f => f.id === selectedFloorId ? updatedFloor : f));
  };

  const handleContinue = () => {
    const totalRooms = state.floors.reduce((sum, f) => sum + f.rooms.length, 0);
    if (totalRooms === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one room',
      });
      return;
    }
    completeStep(4);
    nextStep();
  };

  const validation = selectedFloor ? validateRoomAreas(selectedFloor.rooms, selectedFloor.totalArea) : null;

  return (
    <div className="space-y-6">
      {/* Floor Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Floor</CardTitle>
          <CardDescription>Choose a floor to add rooms</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {state.floors.map(floor => (
                <SelectItem key={floor.id} value={floor.id}>
                  Floor {floor.floorNumber}: {floor.floorName} ({floor.rooms.length} rooms)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validation && (
            <div className="mt-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Area Used:</span> {validation.totalArea.toFixed(0)} / {selectedFloor?.totalArea} sq ft
                <span className="ml-4 text-muted-foreground">Utilization:</span> {validation.utilizationRate.toFixed(1)}%
              </div>
              {!validation.valid && (
                <p className="text-sm text-red-500 mt-2">{validation.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Templates */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Room Templates</CardTitle>
              <CardDescription>Quick-add rooms from templates</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Custom Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Room Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Executive Office"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Room Type *</Label>
                    <Input
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g., Office, Conference Room"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Width (ft) *</Label>
                      <Input
                        type="number"
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (ft) *</Label>
                      <Input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                  <Button onClick={handleAddCustomRoom} className="w-full">
                    Add Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {templates.slice(0, 9).map(template => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => handleAddRoomFromTemplate(template)}
                disabled={!selectedFloor}
              >
                <div className="font-semibold">{template.name}</div>
                <div className="text-xs text-muted-foreground">
                  {template.defaultSize.width}x{template.defaultSize.height} ft
                </div>
                <div className="text-xs text-muted-foreground">
                  Capacity: {template.suggestedCapacity}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rooms List */}
      {selectedFloor && (
        <Card>
          <CardHeader>
            <CardTitle>Rooms on {selectedFloor.floorName} ({selectedFloor.rooms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFloor.rooms.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No rooms added yet</p>
            ) : (
              <div className="space-y-2">
                {selectedFloor.rooms.map(room => (
                  <div key={room.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">{room.identifier}</span>
                      <span className="mx-2">-</span>
                      <span>{room.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({room.width}x{room.height} ft, {room.type})
                      </span>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteRoom(room.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          Continue to Devices
        </Button>
      </div>
    </div>
  );
}
