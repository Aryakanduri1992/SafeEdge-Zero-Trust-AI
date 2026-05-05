import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { FloorPlan, Device } from '@/lib/types';
import { deviceService } from '@/lib/device-service';

const { firestore } = initializeFirebase();

interface FloorPlanUpdateHookResult {
  floorPlan: FloorPlan | null;
  devices: Device[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useFloorPlanUpdates(
  organizationId: string,
  floorPlanId?: string
): FloorPlanUpdateHookResult {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refresh devices data
  const refreshDevices = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const organizationDevices = await deviceService.getDevicesByOrganization(organizationId);
      setDevices(organizationDevices);
    } catch (err) {
      console.error('Failed to refresh devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    }
  }, [organizationId]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await refreshDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [refreshDevices]);

  // Set up real-time floor plan listener
  useEffect(() => {
    if (!organizationId || !floorPlanId) {
      setFloorPlan(null);
      return;
    }

    setLoading(true);
    setError(null);

    const floorPlanRef = doc(
      firestore,
      'organizations',
      organizationId,
      'floorPlans',
      floorPlanId
    );

    const unsubscribe = onSnapshot(
      floorPlanRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as FloorPlan;
          setFloorPlan(data);
          
          // Refresh devices when floor plan updates
          refreshDevices();
        } else {
          setFloorPlan(null);
          setError('Floor plan not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Floor plan listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId, floorPlanId, refreshDevices]);

  // Set up device updates listener
  useEffect(() => {
    if (!organizationId) return;

    // Initial load
    refreshDevices();

    // Set up periodic refresh for device status updates
    const interval = setInterval(refreshDevices, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [organizationId, refreshDevices]);

  return {
    floorPlan,
    devices,
    loading,
    error,
    refreshData
  };
}