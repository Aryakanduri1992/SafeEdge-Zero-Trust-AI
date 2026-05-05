export interface RoomCapacityCalculation {
  maxOccupancy: number;
  comfortableOccupancy: number;
  recommendedDevices: number;
  airVolumeRequirement: number; // cubic feet
  lightingRequirement: number; // lumens
  hvacRequirement: number; // BTU/hour
}

export interface RoomArrangementSuggestion {
  layout: 'linear' | 'grid' | 'perimeter' | 'cluster' | 'mixed';
  description: string;
  efficiency: number; // 0-100%
  suitableFor: string[];
}

/**
 * Calculate room capacity based on size and type
 */
export function calculateRoomCapacity(
  width: number,
  height: number,
  roomType: string = 'Office',
  ceilingHeight: number = 9
): RoomCapacityCalculation {
  const area = width * height;
  const volume = area * ceilingHeight;
  
  // Base calculations per room type
  const typeFactors = {
    'Office': { occupancyFactor: 100, deviceFactor: 0.01, hvacFactor: 25 },
    'Conference Room': { occupancyFactor: 25, deviceFactor: 0.015, hvacFactor: 35 },
    'Storage': { occupancyFactor: 200, deviceFactor: 0.005, hvacFactor: 15 },
    'Kitchen': { occupancyFactor: 50, deviceFactor: 0.02, hvacFactor: 40 },
    'Lobby': { occupancyFactor: 15, deviceFactor: 0.008, hvacFactor: 30 },
    'Server Room': { occupancyFactor: 500, deviceFactor: 0.05, hvacFactor: 60 },
    'Restroom': { occupancyFactor: 50, deviceFactor: 0.01, hvacFactor: 35 },
    'Other': { occupancyFactor: 75, deviceFactor: 0.01, hvacFactor: 25 }
  };
  
  const factors = typeFactors[roomType as keyof typeof typeFactors] || typeFactors.Other;
  
  // Calculate occupancy (sq ft per person)
  const maxOccupancy = Math.floor(area / factors.occupancyFactor);
  const comfortableOccupancy = Math.floor(maxOccupancy * 0.75);
  
  // Calculate device requirements
  const recommendedDevices = Math.max(1, Math.floor(area * factors.deviceFactor));
  
  // Calculate environmental requirements
  const airVolumeRequirement = volume * 0.5; // 0.5 air changes per hour minimum
  const lightingRequirement = area * 50; // 50 lumens per sq ft
  const hvacRequirement = area * factors.hvacFactor; // BTU per sq ft
  
  return {
    maxOccupancy: Math.max(1, maxOccupancy),
    comfortableOccupancy: Math.max(1, comfortableOccupancy),
    recommendedDevices,
    airVolumeRequirement,
    lightingRequirement,
    hvacRequirement
  };
}

/**
 * Suggest optimal room arrangements for a floor
 */
export function suggestRoomArrangements(
  floorWidth: number,
  floorHeight: number,
  rooms: Array<{ width: number; height: number; type: string; name: string }>
): RoomArrangementSuggestion[] {
  const floorArea = floorWidth * floorHeight;
  const totalRoomArea = rooms.reduce((sum, room) => sum + (room.width * room.height), 0);
  const utilizationRatio = totalRoomArea / floorArea;
  
  const suggestions: RoomArrangementSuggestion[] = [];
  
  // Linear arrangement
  if (rooms.length <= 6 && utilizationRatio < 0.8) {
    suggestions.push({
      layout: 'linear',
      description: 'Arrange rooms in a single row along one wall, ideal for small offices',
      efficiency: Math.min(85, 60 + (rooms.length * 5)),
      suitableFor: ['Small offices', 'Medical suites', 'Retail spaces']
    });
  }
  
  // Grid arrangement
  if (rooms.length >= 4 && utilizationRatio > 0.6) {
    const gridEfficiency = Math.min(95, 70 + (utilizationRatio * 25));
    suggestions.push({
      layout: 'grid',
      description: 'Organize rooms in a grid pattern with central corridor access',
      efficiency: gridEfficiency,
      suitableFor: ['Office buildings', 'Schools', 'Hospitals']
    });
  }
  
  // Perimeter arrangement
  if (rooms.length >= 6 && floorArea > 1000) {
    suggestions.push({
      layout: 'perimeter',
      description: 'Place rooms around the perimeter with central common area',
      efficiency: Math.min(90, 65 + (rooms.length * 3)),
      suitableFor: ['Corporate offices', 'Co-working spaces', 'Educational facilities']
    });
  }
  
  // Cluster arrangement
  if (rooms.length >= 8) {
    const clusterEfficiency = Math.min(88, 55 + (rooms.length * 4));
    suggestions.push({
      layout: 'cluster',
      description: 'Group related rooms together in functional clusters',
      efficiency: clusterEfficiency,
      suitableFor: ['Mixed-use buildings', 'Research facilities', 'Healthcare centers']
    });
  }
  
  // Mixed arrangement
  if (rooms.length >= 10 && floorArea > 1500) {
    suggestions.push({
      layout: 'mixed',
      description: 'Combine multiple layout strategies for optimal space utilization',
      efficiency: Math.min(92, 75 + (utilizationRatio * 15)),
      suitableFor: ['Large corporate offices', 'Multi-tenant buildings', 'Complex facilities']
    });
  }
  
  // Sort by efficiency
  return suggestions.sort((a, b) => b.efficiency - a.efficiency);
}

/**
 * Calculate optimal room positioning to minimize wasted space
 */
export function optimizeRoomPositions(
  floorWidth: number,
  floorHeight: number,
  rooms: Array<{ id: string; width: number; height: number; type: string }>
): Array<{ id: string; x: number; y: number; rotation: 0 | 90 }> {
  const positions: Array<{ id: string; x: number; y: number; rotation: 0 | 90 }> = [];
  
  // Sort rooms by area (largest first) for better packing
  const sortedRooms = [...rooms].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;
  
  for (const room of sortedRooms) {
    let roomWidth = room.width;
    let roomHeight = room.height;
    let rotation: 0 | 90 = 0;
    
    // Try rotating if it fits better
    if (currentX + roomWidth > floorWidth && currentX + roomHeight <= floorWidth) {
      roomWidth = room.height;
      roomHeight = room.width;
      rotation = 90;
    }
    
    // Move to next row if current room doesn't fit
    if (currentX + roomWidth > floorWidth) {
      currentX = 0;
      currentY += rowHeight;
      rowHeight = 0;
      
      // Reset dimensions for new row
      roomWidth = room.width;
      roomHeight = room.height;
      rotation = 0;
      
      // Try rotation again for new row
      if (currentX + roomWidth > floorWidth && currentX + roomHeight <= floorWidth) {
        roomWidth = room.height;
        roomHeight = room.width;
        rotation = 90;
      }
    }
    
    // Skip if room still doesn't fit (shouldn't happen with proper validation)
    if (currentX + roomWidth > floorWidth || currentY + roomHeight > floorHeight) {
      continue;
    }
    
    positions.push({
      id: room.id,
      x: currentX,
      y: currentY,
      rotation
    });
    
    currentX += roomWidth;
    rowHeight = Math.max(rowHeight, roomHeight);
  }
  
  return positions;
}

/**
 * Calculate space utilization metrics
 */
export function calculateSpaceUtilization(
  floorWidth: number,
  floorHeight: number,
  rooms: Array<{ width: number; height: number }>
): {
  totalFloorArea: number;
  usedArea: number;
  wastedArea: number;
  utilizationPercentage: number;
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
} {
  const totalFloorArea = floorWidth * floorHeight;
  const usedArea = rooms.reduce((sum, room) => sum + (room.width * room.height), 0);
  const wastedArea = totalFloorArea - usedArea;
  const utilizationPercentage = (usedArea / totalFloorArea) * 100;
  
  let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  if (utilizationPercentage >= 85) efficiency = 'excellent';
  else if (utilizationPercentage >= 70) efficiency = 'good';
  else if (utilizationPercentage >= 55) efficiency = 'fair';
  else efficiency = 'poor';
  
  return {
    totalFloorArea,
    usedArea,
    wastedArea,
    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
    efficiency
  };
}

/**
 * Generate room naming suggestions based on type and floor
 */
export function generateRoomNameSuggestions(
  roomType: string,
  floorNumber: number,
  existingNames: string[] = []
): string[] {
  const suggestions: string[] = [];
  
  const typeBasedNames = {
    'Office': ['Office', 'Workspace', 'Private Office', 'Executive Office'],
    'Conference Room': ['Conference Room', 'Meeting Room', 'Boardroom', 'Discussion Room'],
    'Storage': ['Storage', 'Supply Room', 'Archive', 'Inventory'],
    'Kitchen': ['Kitchen', 'Break Room', 'Cafeteria', 'Pantry'],
    'Lobby': ['Lobby', 'Reception', 'Entrance Hall', 'Foyer'],
    'Server Room': ['Server Room', 'Data Center', 'IT Room', 'Network Room'],
    'Restroom': ['Restroom', 'Bathroom', 'Washroom', 'Facilities'],
    'Other': ['Room', 'Space', 'Area', 'Zone']
  };
  
  const baseNames = typeBasedNames[roomType as keyof typeof typeBasedNames] || typeBasedNames.Other;
  
  // Generate numbered suggestions
  for (const baseName of baseNames) {
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${baseName} ${floorNumber}${i.toString().padStart(2, '0')}`;
      if (!existingNames.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }
  }
  
  return suggestions.slice(0, 8); // Return top 8 suggestions
}

/**
 * Generate room identifier suggestions
 */
export function generateRoomIdentifierSuggestions(
  roomType: string,
  floorNumber: number,
  roomIndex: number,
  existingIdentifiers: string[] = []
): string[] {
  const suggestions: string[] = [];
  
  const typeAbbreviations = {
    'Office': ['O', 'OF', 'OFC'],
    'Conference Room': ['C', 'CR', 'CONF'],
    'Storage': ['S', 'ST', 'STOR'],
    'Kitchen': ['K', 'KT', 'KITCH'],
    'Lobby': ['L', 'LB', 'LOBBY'],
    'Server Room': ['SR', 'SRV', 'DATA'],
    'Restroom': ['R', 'RR', 'WC'],
    'Other': ['R', 'RM', 'ROOM']
  };
  
  const abbreviations = typeAbbreviations[roomType as keyof typeof typeAbbreviations] || typeAbbreviations.Other;
  
  // Generate different formats
  for (const abbr of abbreviations) {
    // Format: R101, O201, etc.
    suggestions.push(`${abbr}${floorNumber}${roomIndex.toString().padStart(2, '0')}`);
    
    // Format: F1-R01, F2-O01, etc.
    suggestions.push(`F${floorNumber}-${abbr}${roomIndex.toString().padStart(2, '0')}`);
    
    // Format: 1.01, 2.01, etc. (floor.room)
    if (abbr === 'R') {
      suggestions.push(`${floorNumber}.${roomIndex.toString().padStart(2, '0')}`);
    }
  }
  
  // Filter out existing identifiers
  return suggestions.filter(id => !existingIdentifiers.includes(id)).slice(0, 6);
}