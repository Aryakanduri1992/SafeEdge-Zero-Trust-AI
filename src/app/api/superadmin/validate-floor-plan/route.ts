import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { floorSchema, roomSchema } from '@/lib/validations/organization-wizard';

const validateFloorPlanSchema = z.object({
  floors: z.array(floorSchema.extend({
    rooms: z.array(roomSchema),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { floors } = validateFloorPlanSchema.parse(body);

    const errors: Array<{ floorNumber: number; field: string; message: string }> = [];
    const warnings: Array<{ floorNumber: number; field: string; message: string }> = [];
    
    let totalRooms = 0;
    let totalArea = 0;
    const roomsByType: Record<string, number> = {};

    // Validate each floor
    for (const floor of floors) {
      totalRooms += floor.rooms.length;
      totalArea += floor.totalArea;

      // Check room area constraint
      const roomsArea = floor.rooms.reduce((sum, room) => sum + (room.width * room.height), 0);
      if (roomsArea > floor.totalArea) {
        errors.push({
          floorNumber: floor.floorNumber,
          field: 'rooms',
          message: `Total room area (${roomsArea} sq ft) exceeds floor area (${floor.totalArea} sq ft)`,
        });
      }

      // Check utilization rate
      const utilizationRate = (roomsArea / floor.totalArea) * 100;
      if (utilizationRate < 50) {
        warnings.push({
          floorNumber: floor.floorNumber,
          field: 'utilization',
          message: `Low space utilization (${utilizationRate.toFixed(1)}%). Consider adding more rooms or reducing floor area.`,
        });
      } else if (utilizationRate > 95) {
        warnings.push({
          floorNumber: floor.floorNumber,
          field: 'utilization',
          message: `Very high space utilization (${utilizationRate.toFixed(1)}%). Consider increasing floor area for circulation space.`,
        });
      }

      // Check unique room identifiers
      const identifiers = new Set<string>();
      for (const room of floor.rooms) {
        if (identifiers.has(room.identifier)) {
          errors.push({
            floorNumber: floor.floorNumber,
            field: 'identifier',
            message: `Duplicate room identifier: ${room.identifier}`,
          });
        }
        identifiers.add(room.identifier);

        // Count rooms by type
        roomsByType[room.type] = (roomsByType[room.type] || 0) + 1;
      }
    }

    // Check sequential floor numbering
    const floorNumbers = floors.map(f => f.floorNumber).sort((a, b) => a - b);
    for (let i = 0; i < floorNumbers.length; i++) {
      if (floorNumbers[i] !== i + 1) {
        errors.push({
          floorNumber: floorNumbers[i],
          field: 'floorNumber',
          message: 'Floor numbers must be sequential starting from 1',
        });
        break;
      }
    }

    const valid = errors.length === 0;

    return NextResponse.json({
      valid,
      errors,
      warnings,
      statistics: {
        totalFloors: floors.length,
        totalRooms,
        totalArea,
        utilizationRate: totalRooms > 0 ? (totalArea / floors.length) : 0,
        roomsByType,
      },
    });
  } catch (error) {
    console.error('Error validating floor plan:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid floor plan data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to validate floor plan' },
      { status: 500 }
    );
  }
}
