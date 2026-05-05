"use client";

import { useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, Ruler } from 'lucide-react';
import { validateRoomSize, ROOM_SIZE_CONSTRAINTS, ROOM_TYPE_CONSTRAINTS, type Room } from '@/lib/floor-plan-validation';

interface RoomSizeValidatorProps {
  room: Partial<Room>;
  showRecommendations?: boolean;
  className?: string;
}

export function RoomSizeValidator({ room, showRecommendations = true, className }: RoomSizeValidatorProps) {
  const validation = useMemo(() => {
    if (!room.width || !room.height || !room.name || !room.identifier) {
      return { errors: [], isValid: true };
    }
    
    const fullRoom: Room = {
      id: room.id || 'temp',
      floorId: room.floorId || 'temp',
      name: room.name,
      identifier: room.identifier,
      width: room.width,
      height: room.height,
      type: room.type
    };
    
    const errors = validateRoomSize(fullRoom);
    return { errors, isValid: errors.length === 0 };
  }, [room]);

  const area = useMemo(() => {
    return (room.width && room.height) ? room.width * room.height : 0;
  }, [room.width, room.height]);

  const recommendations = useMemo(() => {
    if (!room.type || !ROOM_TYPE_CONSTRAINTS[room.type as keyof typeof ROOM_TYPE_CONSTRAINTS]) {
      return null;
    }
    
    const constraints = ROOM_TYPE_CONSTRAINTS[room.type as keyof typeof ROOM_TYPE_CONSTRAINTS];
    return constraints;
  }, [room.type]);

  if (!room.width || !room.height) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Size Display */}
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <Ruler className="w-5 h-5 text-muted-foreground" />
        <div className="flex items-center gap-4 text-sm">
          <span><strong>Size:</strong> {room.width} × {room.height} ft</span>
          <span><strong>Area:</strong> {area} sq ft</span>
          {validation.isValid ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Issues
            </Badge>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="space-y-2">
          {validation.errors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Size Constraints Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div><strong>General Constraints:</strong></div>
            <div className="text-sm text-muted-foreground">
              • Width: {ROOM_SIZE_CONSTRAINTS.MIN_WIDTH}-{ROOM_SIZE_CONSTRAINTS.MAX_WIDTH} ft
              • Height: {ROOM_SIZE_CONSTRAINTS.MIN_HEIGHT}-{ROOM_SIZE_CONSTRAINTS.MAX_HEIGHT} ft
              • Area: {ROOM_SIZE_CONSTRAINTS.MIN_AREA}-{ROOM_SIZE_CONSTRAINTS.MAX_AREA.toLocaleString()} sq ft
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Room Type Recommendations */}
      {showRecommendations && recommendations && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div><strong>{room.type} Recommendations:</strong></div>
              <div className="text-sm text-muted-foreground">
                • Minimum Width: {recommendations.minWidth} ft
                • Minimum Height: {recommendations.minHeight} ft
                • Minimum Area: {recommendations.minArea} sq ft
              </div>
              {(room.width! < recommendations.minWidth || 
                room.height! < recommendations.minHeight || 
                area < recommendations.minArea) && (
                <div className="text-sm text-amber-600 mt-2">
                  ⚠️ Current size is below recommendations for {room.type}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Size Suggestions */}
      {validation.isValid && area > 0 && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Size Analysis:</span>
          </div>
          <div className="ml-6 space-y-1">
            {area < 50 && <div>• Small room - suitable for storage or small office</div>}
            {area >= 50 && area < 150 && <div>• Medium room - good for standard office or meeting room</div>}
            {area >= 150 && area < 300 && <div>• Large room - suitable for conference room or open office</div>}
            {area >= 300 && <div>• Very large room - suitable for lobby, auditorium, or large workspace</div>}
            
            <div>• Estimated capacity: {Math.floor(area / 25)} people (25 sq ft per person)</div>
            <div>• Device recommendation: {Math.max(1, Math.floor(area / 100))} devices (1 per 100 sq ft)</div>
          </div>
        </div>
      )}
    </div>
  );
}