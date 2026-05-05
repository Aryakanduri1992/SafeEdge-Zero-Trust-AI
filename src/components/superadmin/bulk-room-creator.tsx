"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Copy, Settings, Users, Ruler, Hash } from 'lucide-react';
import { ROOM_TEMPLATES, ROOM_SIZE_PRESETS, type RoomTemplate } from '@/lib/room-templates';
import { generateRoomNameSuggestions, generateRoomIdentifierSuggestions } from '@/utils/room-calculations';

interface BulkRoomCreatorProps {
  floorNumber: number;
  existingRooms: Array<{ name: string; identifier: string }>;
  onCreateRooms: (rooms: Array<{
    name: string;
    identifier: string;
    width: number;
    height: number;
    type: string;
  }>) => void;
  className?: string;
}

interface BulkRoomConfig {
  template: RoomTemplate | null;
  count: number;
  width: number;
  height: number;
  namePattern: string;
  identifierPattern: string;
  startNumber: number;
  useAutoNaming: boolean;
  useAutoIdentifiers: boolean;
}

export function BulkRoomCreator({ floorNumber, existingRooms, onCreateRooms, className }: BulkRoomCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<BulkRoomConfig>({
    template: null,
    count: 3,
    width: 12,
    height: 10,
    namePattern: 'Office {number}',
    identifierPattern: 'O{floor}{number:02}',
    startNumber: 1,
    useAutoNaming: true,
    useAutoIdentifiers: true,
  });

  const existingNames = existingRooms.map(room => room.name);
  const existingIdentifiers = existingRooms.map(room => room.identifier);

  const handleTemplateSelect = (templateId: string) => {
    const template = ROOM_TEMPLATES.find(t => t.id === templateId) || null;
    if (template) {
      setConfig(prev => ({
        ...prev,
        template,
        width: template.defaultSize.width,
        height: template.defaultSize.height,
        namePattern: template.name + ' {number}',
        identifierPattern: getDefaultIdentifierPattern(template.type),
      }));
    }
  };

  const handleSizePresetSelect = (presetName: string) => {
    const preset = ROOM_SIZE_PRESETS.find(p => p.name === presetName);
    if (preset && preset.width > 0) {
      setConfig(prev => ({
        ...prev,
        width: preset.width,
        height: preset.height,
      }));
    }
  };

  const getDefaultIdentifierPattern = (roomType: string): string => {
    const typeMap: Record<string, string> = {
      'Office': 'O{floor}{number:02}',
      'Conference Room': 'C{floor}{number:02}',
      'Storage': 'S{floor}{number:02}',
      'Kitchen': 'K{floor}{number:02}',
      'Lobby': 'L{floor}{number:02}',
      'Server Room': 'SR{floor}{number:02}',
      'Restroom': 'R{floor}{number:02}',
    };
    return typeMap[roomType] || 'R{floor}{number:02}';
  };

  const generatePreviewRooms = (): Array<{
    name: string;
    identifier: string;
    width: number;
    height: number;
    type: string;
  }> => {
    const rooms = [];
    
    for (let i = 0; i < config.count; i++) {
      const roomNumber = config.startNumber + i;
      
      let name: string;
      if (config.useAutoNaming && config.template) {
        const suggestions = generateRoomNameSuggestions(
          config.template.type,
          floorNumber,
          existingNames
        );
        name = suggestions[i] || `${config.template.name} ${roomNumber}`;
      } else {
        name = config.namePattern
          .replace('{number}', roomNumber.toString())
          .replace('{floor}', floorNumber.toString());
      }
      
      let identifier: string;
      if (config.useAutoIdentifiers && config.template) {
        const suggestions = generateRoomIdentifierSuggestions(
          config.template.type,
          floorNumber,
          roomNumber,
          existingIdentifiers
        );
        identifier = suggestions[0] || `R${floorNumber}${roomNumber.toString().padStart(2, '0')}`;
      } else {
        identifier = config.identifierPattern
          .replace('{number}', roomNumber.toString())
          .replace('{number:02}', roomNumber.toString().padStart(2, '0'))
          .replace('{floor}', floorNumber.toString());
      }
      
      rooms.push({
        name,
        identifier,
        width: config.width,
        height: config.height,
        type: config.template?.type || 'Office',
      });
    }
    
    return rooms;
  };

  const handleCreateRooms = () => {
    const rooms = generatePreviewRooms();
    onCreateRooms(rooms);
    setIsOpen(false);
    
    // Reset config
    setConfig(prev => ({
      ...prev,
      template: null,
      count: 3,
      startNumber: 1,
    }));
  };

  const previewRooms = generatePreviewRooms();
  const totalArea = previewRooms.reduce((sum, room) => sum + (room.width * room.height), 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Copy className="w-4 h-4 mr-2" />
          Bulk Create Rooms
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Bulk Room Creation - Floor {floorNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <Label>Room Template</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room template" />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <span>{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.defaultSize.width}×{template.defaultSize.height}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Size Preset</Label>
              <Select onValueChange={handleSizePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose size preset" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_SIZE_PRESETS.filter(p => p.width > 0).map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      <div className="flex items-center gap-2">
                        <span>{preset.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {preset.width}×{preset.height} ({preset.area} sq ft)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Room Count</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={config.count}
                onChange={(e) => setConfig(prev => ({ ...prev, count: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Custom Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Width (ft)</Label>
              <Input
                type="number"
                min="4"
                max="100"
                value={config.width}
                onChange={(e) => setConfig(prev => ({ ...prev, width: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Height (ft)</Label>
              <Input
                type="number"
                min="4"
                max="100"
                value={config.height}
                onChange={(e) => setConfig(prev => ({ ...prev, height: Number(e.target.value) }))}
              />
            </div>
          </div>

          <Separator />

          {/* Naming Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Naming Configuration
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-naming"
                  checked={config.useAutoNaming}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, useAutoNaming: checked as boolean }))
                  }
                />
                <Label htmlFor="auto-naming">Use automatic naming suggestions</Label>
              </div>
              
              {!config.useAutoNaming && (
                <div>
                  <Label>Name Pattern</Label>
                  <Input
                    value={config.namePattern}
                    onChange={(e) => setConfig(prev => ({ ...prev, namePattern: e.target.value }))}
                    placeholder="e.g., Office {number}"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Use {'{number}'} for room number, {'{floor}'} for floor number
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-identifiers"
                  checked={config.useAutoIdentifiers}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, useAutoIdentifiers: checked as boolean }))
                  }
                />
                <Label htmlFor="auto-identifiers">Use automatic identifier suggestions</Label>
              </div>
              
              {!config.useAutoIdentifiers && (
                <div>
                  <Label>Identifier Pattern</Label>
                  <Input
                    value={config.identifierPattern}
                    onChange={(e) => setConfig(prev => ({ ...prev, identifierPattern: e.target.value }))}
                    placeholder="e.g., O{floor}{number:02}"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Use {'{number}'} or {'{number:02}'} for room number, {'{floor}'} for floor number
                  </div>
                </div>
              )}
              
              <div>
                <Label>Starting Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.startNumber}
                  onChange={(e) => setConfig(prev => ({ ...prev, startNumber: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div>
            <h4 className="font-medium mb-3">Preview ({config.count} rooms)</h4>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{config.count}</div>
                    <div className="text-xs text-muted-foreground">Rooms</div>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{totalArea}</div>
                    <div className="text-xs text-muted-foreground">Total Area (sq ft)</div>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {Math.floor(totalArea / (config.template?.suggestedCapacity || 25))}
                    </div>
                    <div className="text-xs text-muted-foreground">Est. Capacity</div>
                  </div>
                </div>
              </Card>
            </div>
            
            <ScrollArea className="h-48 border rounded-md p-3">
              <div className="space-y-2">
                {previewRooms.map((room, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium text-sm">{room.name}</div>
                      <div className="text-xs text-muted-foreground">{room.identifier}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{room.width}×{room.height} ft</div>
                      <div className="text-xs text-muted-foreground">{room.width * room.height} sq ft</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRooms} disabled={config.count === 0 || !config.template}>
              <Plus className="w-4 h-4 mr-2" />
              Create {config.count} Rooms
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}