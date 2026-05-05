"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Ruler, Users, Zap, Check, Settings } from 'lucide-react';
import { ROOM_SIZE_PRESETS } from '@/lib/room-templates';
import { calculateRoomCapacity } from '@/utils/room-calculations';

interface RoomSizePresetsProps {
  currentSize?: { width: number; height: number };
  roomType?: string;
  onSizeSelect: (size: { width: number; height: number }) => void;
  className?: string;
}

export function RoomSizePresets({ 
  currentSize, 
  roomType = 'Office', 
  onSizeSelect, 
  className 
}: RoomSizePresetsProps) {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState(currentSize?.width || 12);
  const [customHeight, setCustomHeight] = useState(currentSize?.height || 10);

  const handlePresetSelect = (preset: typeof ROOM_SIZE_PRESETS[0]) => {
    if (preset.name === 'Custom') {
      setIsCustomDialogOpen(true);
    } else {
      onSizeSelect({ width: preset.width, height: preset.height });
    }
  };

  const handleCustomSizeConfirm = () => {
    onSizeSelect({ width: customWidth, height: customHeight });
    setIsCustomDialogOpen(false);
  };

  const isCurrentSize = (preset: typeof ROOM_SIZE_PRESETS[0]) => {
    return currentSize && 
           preset.width === currentSize.width && 
           preset.height === currentSize.height;
  };

  const getCapacityInfo = (width: number, height: number) => {
    return calculateRoomCapacity(width, height, roomType);
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ROOM_SIZE_PRESETS.map((preset) => {
          const isSelected = isCurrentSize(preset);
          const capacity = preset.width > 0 ? getCapacityInfo(preset.width, preset.height) : null;
          
          return (
            <Card 
              key={preset.name}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handlePresetSelect(preset)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{preset.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {preset.width > 0 ? (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        <span>{preset.width}×{preset.height} ft</span>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {preset.area} sq ft
                      </Badge>
                      
                      {capacity && (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{capacity.comfortableOccupancy} people</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>{capacity.recommendedDevices} devices</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Settings className="w-4 h-4" />
                      <span>Define custom size</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Size Dialog */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Custom Room Size
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define custom dimensions for your room. Consider the room type and intended use when setting the size.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-width">Width (ft)</Label>
                <Input
                  id="custom-width"
                  type="number"
                  min="4"
                  max="100"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="custom-height">Height (ft)</Label>
                <Input
                  id="custom-height"
                  type="number"
                  min="4"
                  max="100"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Live Preview */}
            {customWidth > 0 && customHeight > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Size Preview</h4>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Area</div>
                          <div>{customWidth * customHeight} sq ft</div>
                        </div>
                        <div>
                          <div className="font-medium">Capacity</div>
                          <div>{getCapacityInfo(customWidth, customHeight).comfortableOccupancy} people</div>
                        </div>
                        <div>
                          <div className="font-medium">Devices</div>
                          <div>{getCapacityInfo(customWidth, customHeight).recommendedDevices} recommended</div>
                        </div>
                        <div>
                          <div className="font-medium">HVAC</div>
                          <div>{Math.round(getCapacityInfo(customWidth, customHeight).hvacRequirement)} BTU/hr</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Size Recommendations */}
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Size Guidelines:</div>
                  <div className="space-y-1">
                    {customWidth * customHeight < 50 && (
                      <div>• Small room - suitable for 1-2 people or storage</div>
                    )}
                    {customWidth * customHeight >= 50 && customWidth * customHeight < 150 && (
                      <div>• Medium room - good for small meetings or private office</div>
                    )}
                    {customWidth * customHeight >= 150 && customWidth * customHeight < 300 && (
                      <div>• Large room - suitable for team meetings or shared workspace</div>
                    )}
                    {customWidth * customHeight >= 300 && (
                      <div>• Very large room - ideal for conferences or open workspace</div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCustomSizeConfirm}
                disabled={customWidth < 4 || customHeight < 4}
              >
                <Check className="w-4 h-4 mr-2" />
                Apply Size
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}