"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Plus, Trash2, Home, Grid3X3 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoomSizeValidator } from './room-size-validator';
import { RoomTemplates } from './room-templates';
import { BulkRoomCreator } from './bulk-room-creator';
import { RoomSizePresets } from './room-size-presets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Layout, Settings2 } from 'lucide-react';
import type { OrganizationWizardData } from '@/hooks/use-organization-wizard';
import type { RoomTemplate } from '@/lib/room-templates';
import { calculateSpaceUtilization, suggestRoomArrangements } from '@/utils/room-calculations';

interface FloorRoomsSetupProps {
  data: Partial<OrganizationWizardData>;
  onUpdate: (data: Partial<OrganizationWizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed?: boolean;
}

const ROOM_PRESETS = [
  { name: 'Small Office', width: 12, height: 10 },
  { name: 'Medium Office', width: 16, height: 12 },
  { name: 'Large Office', width: 24, height: 16 },
  { name: 'Conference Room', width: 20, height: 14 },
  { name: 'Storage Room', width: 8, height: 6 },
  { name: 'Server Room', width: 10, height: 8 },
  { name: 'Lobby', width: 30, height: 20 },
];

const ROOM_TYPES = [
  'Office', 'Conference Room', 'Storage', 'Server Room', 
  'Lobby', 'Kitchen', 'Bathroom', 'Hallway', 'Other'
];

export function FloorRoomsSetup({ data, onUpdate, onNext, onPrev, canProceed = true }: FloorRoomsSetupProps) {
  const [currentFloor, setCurrentFloor] = useState(0);
  const [floors, setFloors] = useState(data.floors || []);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(null);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Initialize floors if they don't exist
  useEffect(() => {
    if (floors.length === 0 && data.totalFloors) {
      const newFloors = Array.from({ length: data.totalFloors }, (_, index) => ({
        id: `floor-${index + 1}`,
        floorNumber: index + 1,
        floorName: `Floor ${index + 1}`,
        rooms: []
      }));
      setFloors(newFloors);
    }
  }, [data.totalFloors, floors.length]);

  const addRoom = (floorIndex: number) => {
    const newFloors = [...floors];
    const roomNumber = newFloors[floorIndex].rooms.length + 1;
    
    newFloors[floorIndex].rooms.push({
      id: `room-${Date.now()}`,
      floorId: newFloors[floorIndex].id,
      name: `Room ${roomNumber}`,
      identifier: `R${newFloors[floorIndex].floorNumber}${roomNumber.toString().padStart(2, '0')}`,
      width: 12,
      height: 10,
      type: 'Office',
    });
    
    setFloors(newFloors);
    onUpdate({ floors: newFloors });
  };

  const addRoomFromTemplate = (template: RoomTemplate, customSize?: { width: number; height: number }) => {
    const newFloors = [...floors];
    const roomNumber = newFloors[currentFloor].rooms.length + 1;
    const size = customSize || template.defaultSize;
    
    newFloors[currentFloor].rooms.push({
      id: `room-${Date.now()}`,
      floorId: newFloors[currentFloor].id,
      name: `${template.name} ${roomNumber}`,
      identifier: `${template.type.charAt(0)}${newFloors[currentFloor].floorNumber}${roomNumber.toString().padStart(2, '0')}`,
      width: size.width,
      height: size.height,
      type: template.type,
    });
    
    setFloors(newFloors);
    onUpdate({ floors: newFloors });
  };

  const addBulkRooms = (rooms: Array<{
    name: string;
    identifier: string;
    width: number;
    height: number;
    type: string;
  }>) => {
    const newFloors = [...floors];
    
    rooms.forEach(room => {
      newFloors[currentFloor].rooms.push({
        id: `room-${Date.now()}-${Math.random()}`,
        floorId: newFloors[currentFloor].id,
        ...room,
      });
    });
    
    setFloors(newFloors);
    onUpdate({ floors: newFloors });
  };

  const removeRoom = (floorIndex: number, roomIndex: number) => {
    const newFloors = [...floors];
    newFloors[floorIndex].rooms.splice(roomIndex, 1);
    setFloors(newFloors);
    onUpdate({ floors: newFloors });
  };

  const updateRoom = (floorIndex: number, roomIndex: number, field: string, value: any) => {
    const newFloors = [...floors];
    newFloors[floorIndex].rooms[roomIndex] = {
      ...newFloors[floorIndex].rooms[roomIndex],
      [field]: value,
    };
    setFloors(newFloors);
    onUpdate({ floors: newFloors });
  };

  const updateRoomSize = (floorIndex: number, roomIndex: number, size: { width: number; height: number }) => {
    const newFloors = [...floors];
    newFloors[floorIndex].rooms[roomIndex] = {
      ...newFloors[floorIndex].rooms[roomIndex],
      width: size.width,
      height: size.height,
    };
    setFloors(newFloors);
    onUpdate({ floors: newFloors });
  };

  const handleNext = () => {
    onUpdate({ floors });
    onNext();
  };

  const getTotalRooms = () => {
    return floors.reduce((total, floor) => total + floor.rooms.length, 0);
  };

  const getTotalArea = () => {
    return floors.reduce((total, floor) => 
      total + floor.rooms.reduce((floorTotal, room) => 
        floorTotal + (room.width * room.height), 0
      ), 0
    );
  };

  const getFloorUtilization = (floorIndex: number) => {
    if (!floors[floorIndex]) return null;
    
    // Assume a standard floor size for calculation
    const estimatedFloorSize = { width: 100, height: 80 }; // 8000 sq ft
    return calculateSpaceUtilization(
      estimatedFloorSize.width,
      estimatedFloorSize.height,
      floors[floorIndex].rooms
    );
  };

  const getExistingRoomData = (floorIndex: number) => {
    return floors[floorIndex]?.rooms.map(room => ({
      name: room.name,
      identifier: room.identifier
    })) || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Configure Rooms</h3>
            <p className="text-sm text-muted-foreground">
              Set up rooms for each floor using templates and advanced tools
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
        >
          <Settings2 className="w-4 h-4 mr-2" />
          {showAdvancedTools ? 'Hide' : 'Show'} Advanced Tools
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{floors.length}</div>
            <div className="text-sm text-muted-foreground">Floors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{getTotalRooms()}</div>
            <div className="text-sm text-muted-foreground">Total Rooms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{getTotalArea().toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Area (sq ft)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {getTotalRooms() > 0 ? Math.round(getTotalArea() / getTotalRooms()) : 0}
            </div>
            <div className="text-sm text-muted-foreground">Avg Room Size</div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Tools */}
      {showAdvancedTools && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Advanced Room Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="templates" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="templates">Room Templates</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Creator</TabsTrigger>
                <TabsTrigger value="presets">Size Presets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="templates" className="mt-4">
                <RoomTemplates onSelectTemplate={addRoomFromTemplate} />
              </TabsContent>
              
              <TabsContent value="bulk" className="mt-4">
                <BulkRoomCreator
                  floorNumber={floors[currentFloor]?.floorNumber || 1}
                  existingRooms={getExistingRoomData(currentFloor)}
                  onCreateRooms={addBulkRooms}
                />
              </TabsContent>
              
              <TabsContent value="presets" className="mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select a room below to apply size presets, or use the presets as reference for manual sizing.
                  </p>
                  {selectedRoomIndex !== null && floors[currentFloor]?.rooms[selectedRoomIndex] && (
                    <div>
                      <h4 className="font-medium mb-2">
                        Applying to: {floors[currentFloor].rooms[selectedRoomIndex].name}
                      </h4>
                      <RoomSizePresets
                        currentSize={{
                          width: floors[currentFloor].rooms[selectedRoomIndex].width,
                          height: floors[currentFloor].rooms[selectedRoomIndex].height
                        }}
                        roomType={floors[currentFloor].rooms[selectedRoomIndex].type}
                        onSizeSelect={(size) => updateRoomSize(currentFloor, selectedRoomIndex, size)}
                      />
                    </div>
                  )}
                  {selectedRoomIndex === null && (
                    <RoomSizePresets
                      roomType="Office"
                      onSizeSelect={() => {}} // Read-only mode
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Floor Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {floors.map((floor, index) => {
          const utilization = getFloorUtilization(index);
          return (
            <Button
              key={index}
              variant={currentFloor === index ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentFloor(index)}
              className="relative"
            >
              Floor {floor.floorNumber}
              <Badge 
                variant="secondary" 
                className="ml-2 text-xs"
              >
                {floor.rooms.length}
              </Badge>
              {utilization && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  utilization.efficiency === 'excellent' ? 'bg-green-500' :
                  utilization.efficiency === 'good' ? 'bg-blue-500' :
                  utilization.efficiency === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              )}
            </Button>
          );
        })}
      </div>

      {/* Current Floor Configuration */}
      {floors[currentFloor] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                <span>Floor {floors[currentFloor].floorNumber} - Rooms</span>
                {(() => {
                  const utilization = getFloorUtilization(currentFloor);
                  return utilization && (
                    <Badge variant="outline" className={
                      utilization.efficiency === 'excellent' ? 'text-green-600 border-green-600' :
                      utilization.efficiency === 'good' ? 'text-blue-600 border-blue-600' :
                      utilization.efficiency === 'fair' ? 'text-yellow-600 border-yellow-600' : 
                      'text-red-600 border-red-600'
                    }>
                      {utilization.utilizationPercentage}% utilized ({utilization.efficiency})
                    </Badge>
                  );
                })()}
              </div>
              <div className="flex gap-2">
                {!showAdvancedTools && (
                  <BulkRoomCreator
                    floorNumber={floors[currentFloor].floorNumber}
                    existingRooms={getExistingRoomData(currentFloor)}
                    onCreateRooms={addBulkRooms}
                    className="mr-2"
                  />
                )}
                <Button
                  size="sm"
                  onClick={() => addRoom(currentFloor)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {floors[currentFloor].rooms.length === 0 ? (
              <div className="text-center py-12">
                <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h4 className="text-lg font-medium mb-2">No rooms configured</h4>
                <p className="text-muted-foreground mb-4">
                  Get started by adding rooms using templates or the manual room creator
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => addRoom(currentFloor)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room Manually
                  </Button>
                  <Button variant="outline" onClick={() => setShowAdvancedTools(true)}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Use Templates
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-4 pr-4">
                  {floors[currentFloor].rooms.map((room, roomIndex) => (
                    <Card 
                      key={roomIndex} 
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedRoomIndex === roomIndex ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedRoomIndex(roomIndex)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor={`room-name-${roomIndex}`}>Room Name *</Label>
                          <Input
                            id={`room-name-${roomIndex}`}
                            value={room.name}
                            onChange={(e) => updateRoom(currentFloor, roomIndex, 'name', e.target.value)}
                            placeholder="e.g., Conference Room A"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`room-id-${roomIndex}`}>Room ID *</Label>
                          <Input
                            id={`room-id-${roomIndex}`}
                            value={room.identifier}
                            onChange={(e) => updateRoom(currentFloor, roomIndex, 'identifier', e.target.value)}
                            placeholder="e.g., R101"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`room-type-${roomIndex}`}>Room Type</Label>
                          <Select
                            value={room.type}
                            onValueChange={(value) => updateRoom(currentFloor, roomIndex, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROOM_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRoom(currentFloor, roomIndex);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`room-width-${roomIndex}`}>Width (ft) *</Label>
                            <Input
                              id={`room-width-${roomIndex}`}
                              type="number"
                              min="1"
                              value={room.width}
                              onChange={(e) => updateRoom(currentFloor, roomIndex, 'width', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`room-height-${roomIndex}`}>Height (ft) *</Label>
                            <Input
                              id={`room-height-${roomIndex}`}
                              type="number"
                              min="1"
                              value={room.height}
                              onChange={(e) => updateRoom(currentFloor, roomIndex, 'height', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-end">
                          <div className="text-sm">
                            <div className="font-medium">Area: {room.width * room.height} sq ft</div>
                            <div className="text-muted-foreground">
                              Capacity: ~{Math.floor((room.width * room.height) / 25)} people
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Room Size Validator */}
                      {selectedRoomIndex === roomIndex && (
                        <div className="mt-4 pt-4 border-t">
                          <RoomSizeValidator
                            room={{
                              id: room.id,
                              floorId: room.floorId,
                              name: room.name,
                              identifier: room.identifier,
                              width: room.width,
                              height: room.height,
                              type: room.type
                            }}
                            showRecommendations={true}
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Next: Department Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}