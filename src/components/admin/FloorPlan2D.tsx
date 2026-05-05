"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FloorPlan, Floor, Room, Device, Position2D } from '@/lib/types';

interface FloorPlan2DProps {
  floorPlan: FloorPlan;
  devices?: Device[];
  selectedFloor?: number;
  onRoomClick?: (room: Room) => void;
  onDeviceClick?: (device: Device) => void;
  className?: string;
}

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

interface LayoutConfig {
  roomPadding: number;
  roomMinWidth: number;
  roomMinHeight: number;
  floorSpacing: number;
  deviceSize: number;
  labelHeight: number;
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  roomPadding: 20,
  roomMinWidth: 120,
  roomMinHeight: 80,
  floorSpacing: 40,
  deviceSize: 8,
  labelHeight: 20
};

const DEVICE_COLORS = {
  online: '#4caf50',
  offline: '#f44336',
  alerting: '#ff9800'
};

const DEVICE_TYPE_SHAPES = {
  Sensor: 'circle',
  Gateway: 'square',
  Actuator: 'triangle',
  Camera: 'diamond',
  PIR: 'circle',
  LDR: 'circle',
  DHT22_Temp: 'circle',
  DHT22_Humidity: 'circle'
} as const;

export default function FloorPlan2D({
  floorPlan,
  devices = [],
  selectedFloor,
  onRoomClick,
  onDeviceClick,
  className = ''
}: FloorPlan2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    panX: 0,
    panY: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [hoveredDevice, setHoveredDevice] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Generate automatic layout for rooms if positions are not provided
  const generateRoomLayout = useCallback((floor: Floor): Room[] => {
    const config = DEFAULT_LAYOUT_CONFIG;
    const roomsPerRow = Math.ceil(Math.sqrt(floor.rooms.length));
    
    return floor.rooms.map((room, index) => {
      const row = Math.floor(index / roomsPerRow);
      const col = index % roomsPerRow;
      
      const width = room.size?.width || config.roomMinWidth;
      const height = room.size?.height || config.roomMinHeight;
      
      const x = col * (width + config.roomPadding);
      const y = row * (height + config.roomPadding);
      
      return {
        ...room,
        position: room.position || {
          x,
          y,
          width,
          height
        }
      };
    });
  }, []);

  // Get devices for a specific room
  const getDevicesForRoom = useCallback((roomId: string): Device[] => {
    return devices.filter(device => device.roomId === roomId);
  }, [devices]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const canvasX = (screenX - rect.left - viewState.panX) / viewState.zoom;
    const canvasY = (screenY - rect.top - viewState.panY) / viewState.zoom;
    
    return { x: canvasX, y: canvasY };
  }, [viewState]);

  // Find room at given coordinates
  const findRoomAt = useCallback((x: number, y: number, floor: Floor): Room | null => {
    const roomsWithLayout = generateRoomLayout(floor);
    
    for (const room of roomsWithLayout) {
      const pos = room.position;
      if (x >= pos.x && x <= pos.x + pos.width &&
          y >= pos.y && y <= pos.y + pos.height) {
        return room;
      }
    }
    return null;
  }, [generateRoomLayout]);

  // Find device at given coordinates
  const findDeviceAt = useCallback((x: number, y: number, floor: Floor): Device | null => {
    const roomsWithLayout = generateRoomLayout(floor);
    
    for (const room of roomsWithLayout) {
      const roomDevices = getDevicesForRoom(room.id);
      
      for (const device of roomDevices) {
        if (device.position) {
          const deviceX = room.position.x + device.position.x;
          const deviceY = room.position.y + device.position.y;
          const deviceSize = DEFAULT_LAYOUT_CONFIG.deviceSize;
          
          if (x >= deviceX - deviceSize && x <= deviceX + deviceSize &&
              y >= deviceY - deviceSize && y <= deviceY + deviceSize) {
            return device;
          }
        }
      }
    }
    return null;
  }, [generateRoomLayout, getDevicesForRoom]);

  // Draw a device on the canvas
  const drawDevice = useCallback((
    ctx: CanvasRenderingContext2D,
    device: Device,
    x: number,
    y: number,
    isHovered: boolean = false
  ) => {
    const size = DEFAULT_LAYOUT_CONFIG.deviceSize;
    const color = DEVICE_COLORS[device.status];
    const shape = DEVICE_TYPE_SHAPES[device.type] || 'circle';
    
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = isHovered ? '#333' : color;
    ctx.lineWidth = isHovered ? 2 : 1;
    
    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'square':
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
        ctx.strokeRect(x - size, y - size, size * 2, size * 2);
        break;
        
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
    
    // Draw device status indicator
    if (device.status === 'alerting') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#f44336';
      ctx.font = `${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', x, y);
    }
    
    ctx.restore();
  }, []);

  // Draw a room on the canvas
  const drawRoom = useCallback((
    ctx: CanvasRenderingContext2D,
    room: Room,
    isHovered: boolean = false
  ) => {
    const pos = room.position;
    const roomDevices = getDevicesForRoom(room.id);
    
    // Room background
    ctx.fillStyle = isHovered ? '#e3f2fd' : '#f5f5f5';
    ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
    
    // Room border
    ctx.strokeStyle = isHovered ? '#1976d2' : '#ccc';
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
    
    // Room label
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      room.name,
      pos.x + pos.width / 2,
      pos.y + 5
    );
    
    // Room identifier
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(
      room.identifier,
      pos.x + pos.width / 2,
      pos.y + 22
    );
    
    // Draw devices in room
    roomDevices.forEach((device, index) => {
      let deviceX, deviceY;
      
      if (device.position) {
        // Use device's specific position within room
        deviceX = pos.x + device.position.x;
        deviceY = pos.y + device.position.y;
      } else {
        // Auto-position devices in a grid within the room
        const devicesPerRow = Math.ceil(Math.sqrt(roomDevices.length));
        const row = Math.floor(index / devicesPerRow);
        const col = index % devicesPerRow;
        const deviceSpacing = 25;
        const startX = pos.x + 20;
        const startY = pos.y + 45;
        
        deviceX = startX + col * deviceSpacing;
        deviceY = startY + row * deviceSpacing;
      }
      
      const isDeviceHovered = hoveredDevice === device.id;
      drawDevice(ctx, device, deviceX, deviceY, isDeviceHovered);
    });
    
    // Device count indicator
    if (roomDevices.length > 0) {
      ctx.fillStyle = '#1976d2';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        `${roomDevices.length} device${roomDevices.length !== 1 ? 's' : ''}`,
        pos.x + pos.width - 5,
        pos.y + pos.height - 5
      );
    }
  }, [getDevicesForRoom, hoveredDevice, drawDevice]);

  // Draw a floor on the canvas
  const drawFloor = useCallback((
    ctx: CanvasRenderingContext2D,
    floor: Floor,
    offsetY: number = 0
  ) => {
    const roomsWithLayout = generateRoomLayout(floor);
    
    // Floor header
    ctx.fillStyle = '#1976d2';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Floor ${floor.floorNumber}`, 10, offsetY + 10);
    
    // Floor background
    const floorHeight = Math.max(
      ...roomsWithLayout.map(r => r.position.y + r.position.height)
    ) + DEFAULT_LAYOUT_CONFIG.floorSpacing;
    
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, offsetY + 35, canvasSize.width, floorHeight);
    
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, offsetY + 35, canvasSize.width, floorHeight);
    
    // Draw rooms
    roomsWithLayout.forEach(room => {
      const adjustedRoom = {
        ...room,
        position: {
          ...room.position,
          y: room.position.y + offsetY + 40
        }
      };
      
      const isRoomHovered = hoveredRoom === room.id;
      drawRoom(ctx, adjustedRoom, isRoomHovered);
    });
    
    return floorHeight + 40;
  }, [generateRoomLayout, drawRoom, hoveredRoom, canvasSize.width]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(viewState.panX, viewState.panY);
    ctx.scale(viewState.zoom, viewState.zoom);
    
    // Draw floors
    if (selectedFloor !== undefined) {
      // Draw only selected floor
      const floor = floorPlan.floors.find(f => f.floorNumber === selectedFloor);
      if (floor) {
        drawFloor(ctx, floor, 0);
      }
    } else {
      // Draw all floors
      let currentY = 0;
      floorPlan.floors.forEach(floor => {
        const floorHeight = drawFloor(ctx, floor, currentY);
        currentY += floorHeight + DEFAULT_LAYOUT_CONFIG.floorSpacing;
      });
    }
    
    ctx.restore();
  }, [floorPlan, selectedFloor, viewState, drawFloor]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setViewState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY
      }));
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      // Handle hover detection
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      
      // Find which floor we're hovering over
      let currentY = 0;
      let hoveredFloor: Floor | null = null;
      let adjustedY = canvasPos.y;
      
      if (selectedFloor !== undefined) {
        hoveredFloor = floorPlan.floors.find(f => f.floorNumber === selectedFloor) || null;
        adjustedY = canvasPos.y;
      } else {
        for (const floor of floorPlan.floors) {
          const floorHeight = Math.max(
            ...generateRoomLayout(floor).map(r => r.position.y + r.position.height)
          ) + DEFAULT_LAYOUT_CONFIG.floorSpacing + 40;
          
          if (canvasPos.y >= currentY && canvasPos.y <= currentY + floorHeight) {
            hoveredFloor = floor;
            adjustedY = canvasPos.y - currentY - 40;
            break;
          }
          currentY += floorHeight + DEFAULT_LAYOUT_CONFIG.floorSpacing;
        }
      }
      
      if (hoveredFloor) {
        // Check for device hover first
        const hoveredDev = findDeviceAt(canvasPos.x, adjustedY, hoveredFloor);
        if (hoveredDev) {
          setHoveredDevice(hoveredDev.id);
          setHoveredRoom(null);
        } else {
          // Check for room hover
          const hoveredRm = findRoomAt(canvasPos.x, adjustedY, hoveredFloor);
          setHoveredRoom(hoveredRm?.id || null);
          setHoveredDevice(null);
        }
      } else {
        setHoveredRoom(null);
        setHoveredDevice(null);
      }
    }
  }, [isDragging, lastMousePos, screenToCanvas, selectedFloor, floorPlan.floors, generateRoomLayout, findDeviceAt, findRoomAt]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    // Find which floor we're clicking on
    let currentY = 0;
    let clickedFloor: Floor | null = null;
    let adjustedY = canvasPos.y;
    
    if (selectedFloor !== undefined) {
      clickedFloor = floorPlan.floors.find(f => f.floorNumber === selectedFloor) || null;
      adjustedY = canvasPos.y;
    } else {
      for (const floor of floorPlan.floors) {
        const floorHeight = Math.max(
          ...generateRoomLayout(floor).map(r => r.position.y + r.position.height)
        ) + DEFAULT_LAYOUT_CONFIG.floorSpacing + 40;
        
        if (canvasPos.y >= currentY && canvasPos.y <= currentY + floorHeight) {
          clickedFloor = floor;
          adjustedY = canvasPos.y - currentY - 40;
          break;
        }
        currentY += floorHeight + DEFAULT_LAYOUT_CONFIG.floorSpacing;
      }
    }
    
    if (clickedFloor) {
      // Check for device click first
      const clickedDevice = findDeviceAt(canvasPos.x, adjustedY, clickedFloor);
      if (clickedDevice && onDeviceClick) {
        onDeviceClick(clickedDevice);
        return;
      }
      
      // Check for room click
      const clickedRoom = findRoomAt(canvasPos.x, adjustedY, clickedFloor);
      if (clickedRoom && onRoomClick) {
        onRoomClick(clickedRoom);
      }
    }
  }, [isDragging, screenToCanvas, selectedFloor, floorPlan.floors, generateRoomLayout, findDeviceAt, findRoomAt, onDeviceClick, onRoomClick]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, viewState.zoom * zoomFactor));
    
    setViewState(prev => ({
      ...prev,
      zoom: newZoom
    }));
  }, [viewState.zoom]);

  // Reset view
  const resetView = useCallback(() => {
    setViewState({
      zoom: 1,
      panX: 0,
      panY: 0
    });
  }, []);

  // Update canvas size when container resizes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height
        });
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Render when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  // Auto-update when data changes
  useEffect(() => {
    render();
  }, [floorPlan, devices, selectedFloor, viewState, hoveredRoom, hoveredDevice, canvasSize]);

  return (
    <div className={`relative w-full h-full bg-white ${className}`} ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      {/* Controls */}
      <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-2 space-y-2">
        <button
          onClick={resetView}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reset View
        </button>
        <div className="text-xs text-gray-600">
          Zoom: {Math.round(viewState.zoom * 100)}%
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg p-3">
        <h4 className="text-sm font-semibold mb-2">Device Status</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Alerting</span>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 text-xs text-gray-600 max-w-48">
        <div className="font-semibold mb-1">Controls:</div>
        <div>• Drag to pan</div>
        <div>• Scroll to zoom</div>
        <div>• Click rooms/devices for details</div>
      </div>
    </div>
  );
}