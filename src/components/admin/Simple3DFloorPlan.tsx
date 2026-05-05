"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Eye, EyeOff, Zap, ZapOff, RotateCcw, ZoomIn, ZoomOut, Move3D, Cable } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  identifier: string;
  width: number;
  height: number;
  type: string;
  position: { x: number; y: number; width: number; height: number };
  deviceIds: string[];
}

interface Floor {
  id: string;
  floorNumber: number;
  rooms: Room[];
}

interface Device {
  id: string;
  name: string;
  type: string;
  roomId: string;
  status: 'online' | 'offline';
  position?: { x: number; y: number };
}

interface Simple3DFloorPlanProps {
  floors: Floor[];
  devices?: Device[];
  organizationName: string;
}

export function Simple3DFloorPlan({ floors, devices = [], organizationName }: Simple3DFloorPlanProps) {
  // Debug: Log props on mount
  useEffect(() => {
    console.log('=== 3D Floor Plan Props ===');
    console.log('Organization:', organizationName);
    console.log('Floors:', floors.length, floors);
    console.log('Devices:', devices.length, devices);
    console.log('========================');
  }, []);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const [currentFloor, setCurrentFloor] = useState(0);
  const [showDevices, setShowDevices] = useState(true);
  const [showCables, setShowCables] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraDistance, setCameraDistance] = useState(60);
  const [cameraAngle, setCameraAngle] = useState(0);
  const [focusMode, setFocusMode] = useState(false); // New: focus on single floor
  const [targetCameraY, setTargetCameraY] = useState(10); // New: target Y position for camera
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });

  useEffect(() => {
    if (!mountRef.current || floors.length === 0) {
      console.log('3D Floor Plan: No mount ref or no floors', { mountRef: !!mountRef.current, floorsLength: floors.length });
      setIsLoading(false);
      return;
    }

    let mounted = true;
    let animationId: number;

    const initializeScene = () => {
      try {
        console.log('3D Floor Plan: Initializing scene...', { floors: floors.length, devices: devices.length });
        
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          60,
          mountRef.current!.clientWidth / mountRef.current!.clientHeight,
          0.1,
          1000
        );
        camera.position.set(cameraDistance, cameraDistance * 0.8, cameraDistance);
        camera.lookAt(0, 10, 0);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        const width = mountRef.current!.clientWidth || 800;
        const height = mountRef.current!.clientHeight || 600;
        console.log('3D Floor Plan: Setting renderer size', { width, height });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
        
        if (mountRef.current && mounted) {
          // Clear any existing canvas
          while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
          }
          mountRef.current.appendChild(renderer.domElement);
          console.log('3D Floor Plan: Canvas appended to DOM');
        }

        // Enhanced Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(50, 80, 50);
        directionalLight1.castShadow = true;
        directionalLight1.shadow.mapSize.width = 2048;
        directionalLight1.shadow.mapSize.height = 2048;
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-50, 50, -50);
        scene.add(directionalLight2);

        // Add grid helper for reference
        const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
        scene.add(gridHelper);

        // Build 3D structure - use setTimeout to ensure scene is fully initialized
        console.log('3D Floor Plan: Scheduling 3D structure build...');
        setTimeout(() => {
          if (mounted && sceneRef.current) {
            build3DStructure();
            console.log('3D Floor Plan: 3D structure built, scene has', sceneRef.current.children.length, 'children');
          }
        }, 50);

        // Mouse controls
        const handleMouseDown = (e: MouseEvent) => {
          mouseRef.current.isDown = true;
          mouseRef.current.x = e.clientX;
          mouseRef.current.y = e.clientY;
          setAutoRotate(false);
        };

        const handleMouseMove = (e: MouseEvent) => {
          if (!mouseRef.current.isDown) return;
          
          const deltaX = e.clientX - mouseRef.current.x;
          const deltaY = e.clientY - mouseRef.current.y;
          
          setCameraAngle(prev => prev + deltaX * 0.01);
          
          mouseRef.current.x = e.clientX;
          mouseRef.current.y = e.clientY;
        };

        const handleMouseUp = () => {
          mouseRef.current.isDown = false;
        };

        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          setCameraDistance(prev => Math.max(20, Math.min(150, prev + e.deltaY * 0.1)));
        };

        if (mountRef.current) {
          mountRef.current.addEventListener('mousedown', handleMouseDown);
          mountRef.current.addEventListener('mousemove', handleMouseMove);
          mountRef.current.addEventListener('mouseup', handleMouseUp);
          mountRef.current.addEventListener('wheel', handleWheel);
        }

        // Animation loop
        const animate = () => {
          if (!mounted) return;
          
          animationId = requestAnimationFrame(animate);
          
          // Smooth camera transitions
          const currentY = camera.position.y;
          const targetY = focusMode ? targetCameraY : cameraDistance * 0.6;
          camera.position.y = THREE.MathUtils.lerp(currentY, targetY, 0.05);
          
          // Update camera position
          if (autoRotate && !focusMode) {
            const time = Date.now() * 0.0003;
            camera.position.x = Math.cos(time) * cameraDistance;
            camera.position.z = Math.sin(time) * cameraDistance;
          } else {
            camera.position.x = Math.cos(cameraAngle) * cameraDistance;
            camera.position.z = Math.sin(cameraAngle) * cameraDistance;
          }
          
          // Look at target (focused floor or center)
          const lookAtY = focusMode ? targetCameraY - 5 : 10;
          camera.lookAt(0, lookAtY, 0);
          
          renderer.render(scene, camera);
        };
        animate();

        if (mounted) {
          setIsLoading(false);
          console.log('3D Floor Plan: Initialization complete');
        }

      } catch (error) {
        console.error('Error initializing 3D scene:', error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeScene, 100);

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timer);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (mountRef.current && rendererRef.current?.domElement) {
        try {
          const canvas = rendererRef.current.domElement;
          canvas.removeEventListener('mousedown', () => {});
          canvas.removeEventListener('mousemove', () => {});
          canvas.removeEventListener('mouseup', () => {});
          canvas.removeEventListener('wheel', () => {});
          mountRef.current.removeChild(canvas);
        } catch (e) {
          // Element might already be removed
        }
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [floors, devices, showDevices, showCables, currentFloor, autoRotate, cameraDistance, cameraAngle, focusMode, targetCameraY]);

  const build3DStructure = () => {
    if (!sceneRef.current) return;

    // Clear existing objects (keep lights and grid)
    const objectsToRemove = sceneRef.current.children.filter(child => 
      !(child instanceof THREE.AmbientLight) && 
      !(child instanceof THREE.DirectionalLight) && 
      !(child instanceof THREE.GridHelper)
    );
    objectsToRemove.forEach(obj => sceneRef.current!.remove(obj));

    const floorHeight = 12;
    const floorSpacing = 15;

    // Store positions for cable connections
    const ethernetBoxPositions: { floorIndex: number; position: THREE.Vector3 }[] = [];
    const devicePositions: { floorIndex: number; position: THREE.Vector3 }[] = [];

    // SafeEdge position (on second floor)
    const safeEdgeFloorIndex = Math.min(1, floors.length - 1);
    const safeEdgeYPosition = safeEdgeFloorIndex * floorSpacing + 6;
    const safeEdgePosition = new THREE.Vector3(-38, safeEdgeYPosition, 0);

    floors.forEach((floor, floorIndex) => {
      const yPosition = floorIndex * floorSpacing;
      const isSelectedFloor = floorIndex === currentFloor;
      
      // In focus mode, only show selected floor prominently
      const floorOpacity = focusMode ? (isSelectedFloor ? 1.0 : 0.2) : 0.8;
      const roomOpacity = focusMode ? (isSelectedFloor ? 0.9 : 0.1) : 0.8;
      const deviceOpacity = focusMode ? (isSelectedFloor ? 1.0 : 0.1) : 0.9;

      // Floor base - larger and more visible
      const floorGeometry = new THREE.BoxGeometry(80, 1, 80);
      const floorMaterial = new THREE.MeshLambertMaterial({ 
        color: isSelectedFloor ? 0x4CAF50 : 0x666666,
        transparent: true,
        opacity: floorOpacity
      });
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.position.set(0, yPosition, 0);
      floorMesh.receiveShadow = true;
      sceneRef.current.add(floorMesh);

      // Floor outline
      const outlineGeometry = new THREE.EdgesGeometry(floorGeometry);
      const outlineMaterial = new THREE.LineBasicMaterial({ 
        color: isSelectedFloor ? 0x4CAF50 : 0x333333, 
        linewidth: isSelectedFloor ? 3 : 2,
        transparent: true,
        opacity: floorOpacity
      });
      const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
      outline.position.copy(floorMesh.position);
      sceneRef.current.add(outline);

      // Floor label - larger and more visible
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 512;
      canvas.height = 128;
      context.fillStyle = isSelectedFloor ? '#4CAF50' : '#ffffff';
      context.fillRect(0, 0, 512, 128);
      context.fillStyle = isSelectedFloor ? '#ffffff' : '#000000';
      context.font = isSelectedFloor ? 'bold 52px Arial' : 'bold 48px Arial';
      context.textAlign = 'center';
      context.fillText(`Floor ${floor.floorNumber}`, 256, 80);
      if (isSelectedFloor && focusMode) {
        context.font = '24px Arial';
        context.fillText(`${floor.rooms.length} rooms`, 256, 110);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: floorOpacity
      });
      const labelGeometry = new THREE.PlaneGeometry(16, 4);
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(0, yPosition + 8, 42);
      labelMesh.lookAt(0, yPosition + 8, 100);
      sceneRef.current.add(labelMesh);

      // === ETHERNET BOX for each floor ===
      const ethernetBoxPos = new THREE.Vector3(38, yPosition + 4, 0);
      ethernetBoxPositions.push({ floorIndex, position: ethernetBoxPos.clone() });

      const ethernetBoxGroup = new THREE.Group();
      
      // Main box body
      const boxGeometry = new THREE.BoxGeometry(4, 2.5, 3);
      const boxMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x1565C0,
        transparent: true,
        opacity: floorOpacity
      });
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      ethernetBoxGroup.add(boxMesh);

      // LED indicators
      for (let i = 0; i < 4; i++) {
        const ledGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const ledMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00FF00,
          transparent: true,
          opacity: floorOpacity
        });
        const led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.position.set(-1.2 + i * 0.8, 0.8, 1.51);
        ethernetBoxGroup.add(led);
      }

      // Box outline
      const boxOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(boxGeometry),
        new THREE.LineBasicMaterial({ color: 0x42A5F5, transparent: true, opacity: floorOpacity })
      );
      ethernetBoxGroup.add(boxOutline);

      ethernetBoxGroup.position.copy(ethernetBoxPos);
      sceneRef.current.add(ethernetBoxGroup);

      // Ethernet Box Label
      const ethCanvas = document.createElement('canvas');
      const ethContext = ethCanvas.getContext('2d')!;
      ethCanvas.width = 256;
      ethCanvas.height = 64;
      ethContext.fillStyle = '#1565C0';
      ethContext.fillRect(0, 0, 256, 64);
      ethContext.fillStyle = '#ffffff';
      ethContext.font = 'bold 18px Arial';
      ethContext.textAlign = 'center';
      ethContext.fillText(`Ethernet Box F${floor.floorNumber}`, 128, 40);

      const ethTexture = new THREE.CanvasTexture(ethCanvas);
      const ethLabelMaterial = new THREE.MeshBasicMaterial({ 
        map: ethTexture,
        transparent: true,
        opacity: floorOpacity
      });
      const ethLabelGeometry = new THREE.PlaneGeometry(5, 1.25);
      const ethLabelMesh = new THREE.Mesh(ethLabelGeometry, ethLabelMaterial);
      ethLabelMesh.position.set(38, yPosition + 7, 0);
      ethLabelMesh.lookAt(38, yPosition + 7, 100);
      sceneRef.current.add(ethLabelMesh);

      // Rooms - better positioned and sized
      floor.rooms.forEach((room, roomIndex) => {
        const roomWidth = Math.max(8, Math.min(room.width * 1.2, 20));
        const roomDepth = Math.max(6, Math.min(room.height * 1.2, 20));
        const roomHeight = floorHeight - 2;

        // Better grid positioning
        const cols = Math.ceil(Math.sqrt(floor.rooms.length));
        const rows = Math.ceil(floor.rooms.length / cols);
        const row = Math.floor(roomIndex / cols);
        const col = roomIndex % cols;
        
        const spacingX = 18;
        const spacingZ = 16;
        const offsetX = (col - (cols - 1) / 2) * spacingX;
        const offsetZ = (row - (rows - 1) / 2) * spacingZ;

        // Room group
        const roomGroup = new THREE.Group();

        // Room color based on type
        const getRoomColor = (type: string) => {
          switch (type.toLowerCase()) {
            case 'office': return 0x2196F3;
            case 'conference room': return 0x9C27B0;
            case 'lobby': return 0xFF9800;
            case 'storage': return 0x795548;
            case 'server room': return 0xF44336;
            case 'kitchen': return 0x4CAF50;
            default: return 0x607D8B;
          }
        };

        const roomColor = getRoomColor(room.type);

        // Room floor
        const roomFloorGeometry = new THREE.BoxGeometry(roomWidth, 0.5, roomDepth);
        const roomFloorMaterial = new THREE.MeshLambertMaterial({ 
          color: roomColor,
          transparent: true,
          opacity: roomOpacity
        });
        const roomFloorMesh = new THREE.Mesh(roomFloorGeometry, roomFloorMaterial);
        roomFloorMesh.position.set(0, 0.25, 0);
        roomFloorMesh.castShadow = true;
        roomFloorMesh.receiveShadow = true;
        roomGroup.add(roomFloorMesh);

        // Room walls
        const wallMaterial = new THREE.MeshLambertMaterial({ 
          color: roomColor,
          transparent: true,
          opacity: roomOpacity * 0.5
        });

        // Create 4 walls
        const wallThickness = 0.3;
        
        // Front wall
        const frontWall = new THREE.Mesh(
          new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness),
          wallMaterial
        );
        frontWall.position.set(0, roomHeight / 2, roomDepth / 2);
        roomGroup.add(frontWall);

        // Back wall
        const backWall = new THREE.Mesh(
          new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness),
          wallMaterial
        );
        backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
        roomGroup.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(
          new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
          wallMaterial
        );
        leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
        roomGroup.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(
          new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
          wallMaterial
        );
        rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
        roomGroup.add(rightWall);

        // Room label - improved
        const roomCanvas = document.createElement('canvas');
        const roomContext = roomCanvas.getContext('2d')!;
        roomCanvas.width = 512;
        roomCanvas.height = 256;
        roomContext.fillStyle = '#ffffff';
        roomContext.fillRect(0, 0, 512, 256);
        roomContext.fillStyle = '#000000';
        roomContext.font = 'bold 32px Arial';
        roomContext.textAlign = 'center';
        roomContext.fillText(room.identifier, 256, 60);
        roomContext.font = '24px Arial';
        roomContext.fillText(room.name, 256, 100);
        roomContext.font = '20px Arial';
        roomContext.fillText(`${room.width}x${room.height} ft`, 256, 140);
        roomContext.fillText(room.type, 256, 180);

        const roomTexture = new THREE.CanvasTexture(roomCanvas);
        const roomLabelMaterial = new THREE.MeshBasicMaterial({ 
          map: roomTexture,
          transparent: true,
          opacity: roomOpacity
        });
        const roomLabelGeometry = new THREE.PlaneGeometry(8, 4);
        const roomLabelMesh = new THREE.Mesh(roomLabelGeometry, roomLabelMaterial);
        roomLabelMesh.position.set(0, roomHeight + 2, 0);
        roomLabelMesh.lookAt(0, roomHeight + 2, 100);
        roomGroup.add(roomLabelMesh);

        // Devices in room - larger and more visible
        if (showDevices) {
          const roomDevices = devices.filter(device => device.roomId === room.id);
          roomDevices.forEach((device, deviceIndex) => {
            const deviceGeometry = new THREE.SphereGeometry(1, 12, 8);
            const deviceMaterial = new THREE.MeshLambertMaterial({ 
              color: device.status === 'online' ? 0x00FF00 : 0xFF0000,
              emissive: device.status === 'online' ? 0x004400 : 0x440000,
              transparent: true,
              opacity: deviceOpacity
            });
            const deviceMesh = new THREE.Mesh(deviceGeometry, deviceMaterial);
            
            // Position devices around the room
            const angle = (deviceIndex / roomDevices.length) * Math.PI * 2;
            const radius = Math.min(roomWidth, roomDepth) * 0.25;
            const deviceLocalX = Math.cos(angle) * radius;
            const deviceLocalZ = Math.sin(angle) * radius;
            deviceMesh.position.set(deviceLocalX, 3, deviceLocalZ);
            deviceMesh.castShadow = true;
            roomGroup.add(deviceMesh);

            // Store device world position for cable connections
            devicePositions.push({ 
              floorIndex, 
              position: new THREE.Vector3(offsetX + deviceLocalX, yPosition + 4, offsetZ + deviceLocalZ)
            });

            // Device label
            const deviceCanvas = document.createElement('canvas');
            const deviceContext = deviceCanvas.getContext('2d')!;
            deviceCanvas.width = 256;
            deviceCanvas.height = 64;
            deviceContext.fillStyle = device.status === 'online' ? '#00ff00' : '#ff0000';
            deviceContext.fillRect(0, 0, 256, 64);
            deviceContext.fillStyle = '#ffffff';
            deviceContext.font = 'bold 16px Arial';
            deviceContext.textAlign = 'center';
            deviceContext.fillText(device.name, 128, 40);

            const deviceTexture = new THREE.CanvasTexture(deviceCanvas);
            const deviceLabelMaterial = new THREE.MeshBasicMaterial({ 
              map: deviceTexture,
              transparent: true,
              opacity: deviceOpacity
            });
            const deviceLabelGeometry = new THREE.PlaneGeometry(3, 0.75);
            const deviceLabelMesh = new THREE.Mesh(deviceLabelGeometry, deviceLabelMaterial);
            deviceLabelMesh.position.set(deviceLocalX, 5, deviceLocalZ);
            deviceLabelMesh.lookAt(0, 5, 100);
            roomGroup.add(deviceLabelMesh);
          });
        }

        roomGroup.position.set(offsetX, yPosition + 1, offsetZ);
        sceneRef.current.add(roomGroup);
      });
    });

    // === SAFEEDGE DEVICE ===
    const safeEdgeGroup = new THREE.Group();
    
    // SafeEdge main body
    const safeEdgeBodyGeometry = new THREE.BoxGeometry(5, 8, 4);
    const safeEdgeBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x0D47A1, transparent: true, opacity: 0.9 });
    const safeEdgeBody = new THREE.Mesh(safeEdgeBodyGeometry, safeEdgeBodyMaterial);
    safeEdgeGroup.add(safeEdgeBody);

    // SafeEdge top accent
    const safeEdgeTopGeometry = new THREE.BoxGeometry(5.2, 0.5, 4.2);
    const safeEdgeTopMaterial = new THREE.MeshLambertMaterial({ color: 0x1976D2 });
    const safeEdgeTop = new THREE.Mesh(safeEdgeTopGeometry, safeEdgeTopMaterial);
    safeEdgeTop.position.y = 4.25;
    safeEdgeGroup.add(safeEdgeTop);

    // SafeEdge LED panel
    const ledPanelGeometry = new THREE.BoxGeometry(3, 1.5, 0.1);
    const ledPanelMaterial = new THREE.MeshBasicMaterial({ color: 0x00E676 });
    const ledPanel = new THREE.Mesh(ledPanelGeometry, ledPanelMaterial);
    ledPanel.position.set(0, 2, 2.01);
    safeEdgeGroup.add(ledPanel);

    // SafeEdge status LEDs
    for (let i = 0; i < 3; i++) {
      const statusLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: i === 0 ? 0x00FF00 : 0x2196F3 })
      );
      statusLed.position.set(-1 + i, 0, 2.01);
      safeEdgeGroup.add(statusLed);
    }

    // SafeEdge outline
    const safeEdgeOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(safeEdgeBodyGeometry),
      new THREE.LineBasicMaterial({ color: 0x42A5F5 })
    );
    safeEdgeGroup.add(safeEdgeOutline);

    safeEdgeGroup.position.copy(safeEdgePosition);
    sceneRef.current.add(safeEdgeGroup);

    // SafeEdge Label
    const seCanvas = document.createElement('canvas');
    const seContext = seCanvas.getContext('2d')!;
    seCanvas.width = 256;
    seCanvas.height = 128;
    seContext.fillStyle = '#0D47A1';
    seContext.fillRect(0, 0, 256, 128);
    seContext.fillStyle = '#ffffff';
    seContext.font = 'bold 24px Arial';
    seContext.textAlign = 'center';
    seContext.fillText('SafeEdge', 128, 50);
    seContext.font = '16px Arial';
    seContext.fillText('Security Hub', 128, 80);
    seContext.font = '14px Arial';
    seContext.fillStyle = '#00E676';
    seContext.fillText('● ONLINE', 128, 105);

    const seTexture = new THREE.CanvasTexture(seCanvas);
    const seLabelMaterial = new THREE.MeshBasicMaterial({ map: seTexture, transparent: true });
    const seLabelGeometry = new THREE.PlaneGeometry(6, 3);
    const seLabelMesh = new THREE.Mesh(seLabelGeometry, seLabelMaterial);
    seLabelMesh.position.set(safeEdgePosition.x, safeEdgePosition.y + 7, safeEdgePosition.z);
    seLabelMesh.lookAt(safeEdgePosition.x, safeEdgePosition.y + 7, 100);
    sceneRef.current.add(seLabelMesh);

    // === CABLES ===
    if (showCables) {
      // Helper function to create curved cable
      const createCable = (start: THREE.Vector3, end: THREE.Vector3, color: number, opacity: number = 0.8) => {
        const midY = Math.max(start.y, end.y) + 2;
        const midPoint = new THREE.Vector3((start.x + end.x) / 2, midY, (start.z + end.z) / 2);
        const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
        return new THREE.Line(geometry, material);
      };

      // Cables from SafeEdge to each Ethernet Box (cyan)
      ethernetBoxPositions.forEach((ethBox) => {
        const cableOpacity = focusMode ? (ethBox.floorIndex === currentFloor ? 0.9 : 0.3) : 0.8;
        const safeEdgeOut = new THREE.Vector3(safeEdgePosition.x + 2.5, safeEdgePosition.y, safeEdgePosition.z);
        
        const cable = createCable(safeEdgeOut, ethBox.position, 0x00BCD4, cableOpacity);
        sceneRef.current!.add(cable);

        // Tube effect for main cables
        const tubeGeometry = new THREE.TubeGeometry(
          new THREE.QuadraticBezierCurve3(
            safeEdgeOut,
            new THREE.Vector3((safeEdgeOut.x + ethBox.position.x) / 2, Math.max(safeEdgeOut.y, ethBox.position.y) + 2, (safeEdgeOut.z + ethBox.position.z) / 2),
            ethBox.position
          ),
          20, 0.12, 8, false
        );
        const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00BCD4, transparent: true, opacity: cableOpacity * 0.4 });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        sceneRef.current!.add(tube);
      });

      // Cables from Ethernet Boxes to Devices (green)
      devicePositions.forEach((devicePos) => {
        const ethBox = ethernetBoxPositions.find(e => e.floorIndex === devicePos.floorIndex);
        if (ethBox) {
          const cableOpacity = focusMode ? (devicePos.floorIndex === currentFloor ? 0.6 : 0.1) : 0.5;
          const cable = createCable(ethBox.position, devicePos.position, 0x4CAF50, cableOpacity);
          sceneRef.current!.add(cable);
        }
      });

      // Vertical trunk cable connecting Ethernet boxes (orange)
      if (ethernetBoxPositions.length > 1) {
        for (let i = 0; i < ethernetBoxPositions.length - 1; i++) {
          const start = ethernetBoxPositions[i].position.clone();
          const end = ethernetBoxPositions[i + 1].position.clone();
          start.x += 2;
          end.x += 2;
          
          const points = [start, end];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({ color: 0xFF9800, transparent: true, opacity: 0.7 });
          const vertCable = new THREE.Line(geometry, material);
          sceneRef.current!.add(vertCable);

          // Tube for vertical cable
          const vertTubeGeometry = new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 10, 0.1, 8, false);
          const vertTubeMaterial = new THREE.MeshBasicMaterial({ color: 0xFF9800, transparent: true, opacity: 0.3 });
          const vertTube = new THREE.Mesh(vertTubeGeometry, vertTubeMaterial);
          sceneRef.current!.add(vertTube);
        }
      }
    }
  };

  const handleFloorChange = (floorIndex: number) => {
    setCurrentFloor(floorIndex);
    
    // Enable focus mode and set camera target
    setFocusMode(true);
    const floorSpacing = 15;
    const targetY = floorIndex * floorSpacing + 10; // Focus on the selected floor
    setTargetCameraY(targetY);
    
    // Adjust camera distance for better view of single floor
    setCameraDistance(45);
    setAutoRotate(false); // Stop auto rotation when focusing
    
    build3DStructure();
  };

  const showAllFloors = () => {
    setFocusMode(false);
    setTargetCameraY(10);
    setCameraDistance(60);
    setAutoRotate(true);
    build3DStructure();
  };

  const toggleDevices = () => {
    setShowDevices(!showDevices);
    build3DStructure();
  };

  const toggleCables = () => {
    setShowCables(!showCables);
    build3DStructure();
  };

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
  };

  const zoomIn = () => {
    setCameraDistance(prev => Math.max(20, prev - 10));
  };

  const zoomOut = () => {
    setCameraDistance(prev => Math.min(150, prev + 10));
  };

  const resetCamera = () => {
    setCameraDistance(60);
    setCameraAngle(0);
    setAutoRotate(true);
  };

  const getTotalRooms = () => floors.reduce((total, floor) => total + floor.rooms.length, 0);
  const getTotalDevices = () => devices.length;
  const getOnlineDevices = () => devices.filter(d => d.status === 'online').length;

  if (isLoading) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Building className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <p>Loading 3D Floor Plan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError || floors.length === 0) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">
              {hasError ? '3D visualization unavailable' : 'No floor plan data available'}
            </p>
            <p className="text-sm text-gray-500">
              {hasError ? 'Please check browser compatibility' : 'Please configure floor plans first'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="border-[#242d53]/10">
        <CardHeader className="bg-gradient-to-r from-[#242d53]/5 to-[#d3b78f]/5">
          <CardTitle className="flex items-center gap-2 text-[#242d53]">
            <Building className="w-5 h-5 text-[#d3b78f]" />
            {organizationName} - 3D Floor Plan
            {focusMode && (
              <Badge variant="outline" className="ml-2 bg-[#6B8E6F]/20 text-[#6B8E6F] border-[#6B8E6F]">
                Focused: Floor {floors[currentFloor]?.floorNumber}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Floor Selection */}
            <div className="flex gap-2">
              <Button
                variant={!focusMode ? "default" : "outline"}
                size="sm"
                onClick={showAllFloors}
                className={!focusMode ? "mr-2 bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90" : "mr-2 border-[#242d53] text-[#242d53] hover:bg-[#242d53] hover:text-white"}
              >
                <Building className="w-4 h-4 mr-1" />
                All Floors
              </Button>
              {floors.map((floor, index) => (
                <Button
                  key={floor.id}
                  variant={currentFloor === index && focusMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFloorChange(index)}
                  className={
                    focusMode && currentFloor === index 
                      ? "ring-2 ring-[#6B8E6F] bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90" 
                      : "border-[#242d53] text-[#242d53] hover:bg-[#242d53] hover:text-white"
                  }
                >
                  Floor {floor.floorNumber}
                  <Badge variant="secondary" className="ml-2 bg-[#d3b78f]/20 text-[#242d53]">
                    {floor.rooms.length}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Device Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDevices}
              className="flex items-center gap-2 border-[#242d53] text-[#242d53] hover:bg-[#242d53] hover:text-white"
            >
              {showDevices ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showDevices ? 'Hide' : 'Show'} Devices
            </Button>

            {/* Cables Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCables}
              className="flex items-center gap-2 border-[#242d53] text-[#242d53] hover:bg-[#242d53] hover:text-white"
            >
              <Cable className="w-4 h-4" />
              {showCables ? 'Hide' : 'Show'} Cables
            </Button>

            {/* Camera Controls */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                title="Zoom In"
                className="border-[#d3b78f] text-[#d3b78f] hover:bg-[#d3b78f] hover:text-[#242d53]"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                title="Zoom Out"
                className="border-[#d3b78f] text-[#d3b78f] hover:bg-[#d3b78f] hover:text-[#242d53]"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoRotate}
                title={autoRotate ? "Stop Rotation" : "Auto Rotate"}
                className="border-[#d3b78f] text-[#d3b78f] hover:bg-[#d3b78f] hover:text-[#242d53]"
              >
                <Move3D className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetCamera}
                title="Reset Camera"
                className="border-[#d3b78f] text-[#d3b78f] hover:bg-[#d3b78f] hover:text-[#242d53]"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-[#5B6B8F] mb-4 p-2 bg-[#d3b78f]/10 rounded border border-[#d3b78f]/20">
            <strong className="text-[#242d53]">Controls:</strong> Click floor buttons to focus on specific floors • Click "All Floors" to see overview • Click and drag to rotate • Scroll to zoom • Use buttons for precise control
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-[#242d53]/5 rounded-lg border border-[#242d53]/10">
              <div className="text-2xl font-bold text-[#242d53]">{floors.length}</div>
              <div className="text-sm text-[#5B6B8F]">Floors</div>
            </div>
            <div className="text-center p-3 bg-[#242d53]/5 rounded-lg border border-[#242d53]/10">
              <div className="text-2xl font-bold text-[#242d53]">
                {focusMode ? floors[currentFloor]?.rooms.length || 0 : getTotalRooms()}
              </div>
              <div className="text-sm text-[#5B6B8F]">
                {focusMode ? `Floor ${floors[currentFloor]?.floorNumber} Rooms` : 'Total Rooms'}
              </div>
            </div>
            <div className="text-center p-3 bg-[#6B8E6F]/10 rounded-lg border border-[#6B8E6F]/20">
              <div className="text-2xl font-bold text-[#6B8E6F]">
                {focusMode ? 
                  devices.filter(d => d.status === 'online' && floors[currentFloor]?.rooms.some(r => r.id === d.roomId)).length :
                  getOnlineDevices()
                }
              </div>
              <div className="text-sm text-[#5B6B8F]">
                {focusMode ? 'Floor Online Devices' : 'Online Devices'}
              </div>
            </div>
            <div className="text-center p-3 bg-[#8B2635]/10 rounded-lg border border-[#8B2635]/20">
              <div className="text-2xl font-bold text-[#8B2635]">
                {focusMode ? 
                  devices.filter(d => d.status === 'offline' && floors[currentFloor]?.rooms.some(r => r.id === d.roomId)).length :
                  getTotalDevices() - getOnlineDevices()
                }
              </div>
              <div className="text-sm text-[#5B6B8F]">
                {focusMode ? 'Floor Offline Devices' : 'Offline Devices'}
              </div>
            </div>
          </div>

          {/* Floor-specific information when focused */}
          {focusMode && floors[currentFloor] && (
            <div className="mb-4 p-4 bg-[#6B8E6F]/10 border border-[#6B8E6F]/20 rounded-lg">
              <h4 className="font-semibold text-[#242d53] mb-2">
                Floor {floors[currentFloor].floorNumber} Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {floors[currentFloor].rooms.map((room) => {
                  const roomDevices = devices.filter(d => d.roomId === room.id);
                  const onlineCount = roomDevices.filter(d => d.status === 'online').length;
                  return (
                    <div key={room.id} className="bg-white p-2 rounded border border-[#242d53]/10">
                      <div className="font-medium text-[#242d53]">{room.identifier}</div>
                      <div className="text-xs text-[#5B6B8F]">{room.name}</div>
                      <div className="text-xs text-[#5B6B8F]">{room.type}</div>
                      <div className="text-xs">
                        <span className="text-[#6B8E6F]">{onlineCount}</span>/
                        <span className="text-[#5B6B8F]">{roomDevices.length}</span> devices
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3D Viewer */}
      <Card className="border-[#242d53]/10">
        <CardContent className="p-0">
          <div 
            ref={mountRef} 
            className="w-full bg-gray-900 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ height: '600px', minHeight: '600px', position: 'relative' }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-[#242d53]/10">
        <CardHeader>
          <CardTitle className="text-[#242d53]">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-[#242d53]">Office</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-[#242d53]">Conference Room</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-[#242d53]">Lobby</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-brown-500 rounded"></div>
              <span className="text-sm text-[#242d53]">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-[#242d53]">Server Room</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-[#242d53]">Kitchen</span>
            </div>
            {showDevices && (
              <>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#6B8E6F]" />
                  <span className="text-sm text-[#242d53]">Online Device</span>
                </div>
                <div className="flex items-center gap-2">
                  <ZapOff className="w-4 h-4 text-[#8B2635]" />
                  <span className="text-sm text-[#242d53]">Offline Device</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#242d53] rounded"></div>
              <span className="text-sm text-[#242d53]">SafeEdge Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-700 rounded"></div>
              <span className="text-sm text-[#242d53]">Ethernet Box</span>
            </div>
            {showCables && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-cyan-500 rounded"></div>
                  <span className="text-sm text-[#242d53]">SafeEdge → Ethernet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-[#6B8E6F] rounded"></div>
                  <span className="text-sm text-[#242d53]">Ethernet → Device</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-[#C17A3A] rounded"></div>
                  <span className="text-sm text-[#242d53]">Vertical Trunk</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}