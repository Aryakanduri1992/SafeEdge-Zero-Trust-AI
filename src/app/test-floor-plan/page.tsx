"use client";

import React from 'react';
import FloorPlan2D from '@/components/admin/FloorPlan2D';
import { createTestDataset } from '@/lib/test-data';

export default function TestFloorPlanPage() {
  const testData = createTestDataset('test-org-id');

  return (
    <div className="h-screen w-full">
      <div className="p-4 bg-gray-100 border-b">
        <h1 className="text-2xl font-bold">2D Floor Plan Test</h1>
        <p className="text-gray-600">Testing the FloorPlan2D component with sample data</p>
      </div>
      
      <div className="h-[calc(100vh-100px)]">
        <FloorPlan2D
          floorPlan={testData.floorPlan}
          devices={testData.devices}
          onRoomClick={(room) => console.log('Room clicked:', room)}
          onDeviceClick={(device) => console.log('Device clicked:', device)}
        />
      </div>
    </div>
  );
}