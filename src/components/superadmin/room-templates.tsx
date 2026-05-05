"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Info, Users, Ruler, Zap } from 'lucide-react';
import { ROOM_TEMPLATES, getRoomTemplatesByCategory, type RoomTemplate } from '@/lib/room-templates';
import { calculateRoomCapacity } from '@/utils/room-calculations';

interface RoomTemplatesProps {
  onSelectTemplate: (template: RoomTemplate, customSize?: { width: number; height: number }) => void;
  className?: string;
}

export function RoomTemplates({ onSelectTemplate, className }: RoomTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate | null>(null);
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [customHeight, setCustomHeight] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const categories = [
    { id: 'workspace', name: 'Workspace', icon: '🏢' },
    { id: 'meeting', name: 'Meeting', icon: '👥' },
    { id: 'common', name: 'Common Areas', icon: '🏛️' },
    { id: 'utility', name: 'Utility', icon: '📦' },
    { id: 'technical', name: 'Technical', icon: '🖥️' }
  ];

  const handleTemplateSelect = (template: RoomTemplate) => {
    setSelectedTemplate(template);
    setCustomWidth(template.defaultSize.width);
    setCustomHeight(template.defaultSize.height);
    setIsDialogOpen(true);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      const customSize = (customWidth !== selectedTemplate.defaultSize.width || 
                         customHeight !== selectedTemplate.defaultSize.height) 
        ? { width: customWidth, height: customHeight } 
        : undefined;
      
      onSelectTemplate(selectedTemplate, customSize);
      setIsDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const getCapacityInfo = (template: RoomTemplate, width: number, height: number) => {
    return calculateRoomCapacity(width, height, template.type);
  };

  return (
    <div className={className}>
      <Tabs defaultValue="workspace" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getRoomTemplatesByCategory(category.id).map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="text-lg">{template.icon}</span>
                      {template.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Ruler className="w-4 h-4 text-muted-foreground" />
                          <span>{template.defaultSize.width}×{template.defaultSize.height} ft</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{template.suggestedCapacity} people</span>
                        </div>
                      </div>

                      <Badge variant="outline" className={template.color}>
                        {template.type}
                      </Badge>

                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="w-3 h-3" />
                          <span>Recommended devices:</span>
                        </div>
                        <div className="ml-4">
                          {template.deviceRecommendations.slice(0, 2).map((device, index) => (
                            <div key={index}>• {device.type} ({device.count})</div>
                          ))}
                          {template.deviceRecommendations.length > 2 && (
                            <div>• +{template.deviceRecommendations.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Template Customization Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon} {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Customize Size</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (ft)</Label>
                    <Input
                      id="width"
                      type="number"
                      min={selectedTemplate.minSize.width}
                      max={selectedTemplate.maxSize.width}
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Range: {selectedTemplate.minSize.width}-{selectedTemplate.maxSize.width} ft
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="height">Height (ft)</Label>
                    <Input
                      id="height"
                      type="number"
                      min={selectedTemplate.minSize.height}
                      max={selectedTemplate.maxSize.height}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Range: {selectedTemplate.minSize.height}-{selectedTemplate.maxSize.height} ft
                    </div>
                  </div>
                </div>

                {/* Live Capacity Calculation */}
                {customWidth > 0 && customHeight > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Area</div>
                          <div>{customWidth * customHeight} sq ft</div>
                        </div>
                        <div>
                          <div className="font-medium">Capacity</div>
                          <div>{getCapacityInfo(selectedTemplate, customWidth, customHeight).comfortableOccupancy} people</div>
                        </div>
                        <div>
                          <div className="font-medium">Devices</div>
                          <div>{getCapacityInfo(selectedTemplate, customWidth, customHeight).recommendedDevices} recommended</div>
                        </div>
                        <div>
                          <div className="font-medium">HVAC</div>
                          <div>{Math.round(getCapacityInfo(selectedTemplate, customWidth, customHeight).hvacRequirement)} BTU/hr</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Device Recommendations */}
                <div>
                  <h5 className="font-medium mb-2">Device Recommendations</h5>
                  <ScrollArea className="h-24">
                    <div className="space-y-1 text-sm">
                      {selectedTemplate.deviceRecommendations.map((device, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{device.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {device.count}x
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmSelection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}