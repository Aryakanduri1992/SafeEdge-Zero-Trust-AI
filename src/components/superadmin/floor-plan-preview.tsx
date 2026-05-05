"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, Building2, Square, Users } from 'lucide-react';
import { validateFloorPlan, calculateBuildingStats, type Floor } from '@/lib/floor-plan-validation';

interface FloorPlanPreviewProps {
  floors: Floor[];
  className?: string;
}

const ROOM_TYPE_COLORS = {
  'Office': 'bg-blue-100 border-blue-300 text-blue-800',
  'Conference Room': 'bg-purple-100 border-purple-300 text-purple-800',
  'Storage': 'bg-gray-100 border-gray-300 text-gray-800',
  'Kitchen': 'bg-orange-100 border-orange-300 text-orange-800',
  'Lobby': 'bg-green-100 border-green-300 text-green-800',
  'Server Room': 'bg-red-100 border-red-300 text-red-800',
  'Other': 'bg-slate-100 border-slate-300 text-slate-800',
};

export function FloorPlanPreview({ floors, className }: FloorPlanPreviewProps) {
  const validation = useMemo(() => validateFloorPlan(floors), [floors]);
  const stats = useMemo(() => calculateBuildingStats(floors), [floors]);

  if (floors.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No floors defined yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Validation Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {validation.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            Floor Plan Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validation.isValid ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              All validations passed
            </div>
          ) : (
            <div className="space-y-2">
              {validation.errors.slice(0, 3).map((error, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error.message}</span>
                </div>
              ))}
              {validation.errors.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  +{validation.errors.length - 3} more issues
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Building Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="w-5 h-5 text-blue-600" />
            Building Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{stats.totalFloors}</div>
              <div className="text-sm text-muted-foreground">Floors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.totalRooms}</div>
              <div className="text-sm text-muted-foreground">Rooms</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.totalArea.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Area (sq ft)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.averageRoomSize}</div>
              <div className="text-sm text-muted-foreground">Avg Room Size</div>
            </div>
          </div>
          
          {/* Room Type Distribution */}
          {Object.keys(stats.roomTypeCount).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Room Types</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.roomTypeCount).map(([type, count]) => (
                  <Badge 
                    key={type} 
                    variant="outline" 
                    className={ROOM_TYPE_COLORS[type as keyof typeof ROOM_TYPE_COLORS] || ROOM_TYPE_COLORS.Other}
                  >
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floor Details */}
      <div className="space-y-3">
        {floors.map((floor, index) => (
          <Card key={floor.id || index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Square className="w-4 h-4 text-muted-foreground" />
                  Floor {floor.floorNumber}: {floor.floorName}
                </div>
                <Badge variant="secondary">
                  {floor.rooms.length} rooms
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {floor.rooms.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No rooms defined</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {floor.rooms.map((room, roomIndex) => {
                    const area = room.width * room.height;
                    const roomErrors = validation.errors.filter(e => e.roomId === room.id);
                    
                    return (
                      <div 
                        key={room.id || roomIndex}
                        className={`flex items-center justify-between p-2 rounded border ${
                          roomErrors.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{room.identifier}</div>
                          <div className="text-sm">{room.name}</div>
                          {room.type && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${ROOM_TYPE_COLORS[room.type as keyof typeof ROOM_TYPE_COLORS] || ROOM_TYPE_COLORS.Other}`}
                            >
                              {room.type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{room.width}×{room.height} ft</span>
                          <span>({area} sq ft)</span>
                          {roomErrors.length > 0 && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}