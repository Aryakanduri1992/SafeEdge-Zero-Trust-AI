import { useState, useEffect } from 'react';
import type { Device, FloorPlan, ConnectivityHealth } from '@/lib/types';

interface DashboardStats {
  totalDevices: number;
  activeDevices: number;
  connectedDevices: number;
  totalFloorPlans: number;
  connectivityHealth: ConnectivityHealth;
  devices: Device[];
  floorPlans: FloorPlan[];
}

export function useDashboardData(organizationId: string | null) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/dashboard/stats?organizationId=${organizationId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [organizationId]);

  return { data, loading, error, refetch: () => {
    if (organizationId) {
      setLoading(true);
      // Re-trigger the effect
      setData(null);
    }
  }};
}