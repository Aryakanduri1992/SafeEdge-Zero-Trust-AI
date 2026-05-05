import { useState, useEffect } from 'react';
import { OrganizationSQLite, DepartmentSQLite, FloorPlan } from '@/lib/types';

interface SuperAdminData {
  organizations: OrganizationSQLite[];
  departments: DepartmentSQLite[];
  floorPlans: FloorPlan[];
}

export function useSuperAdminData() {
  const [data, setData] = useState<SuperAdminData>({
    organizations: [],
    departments: [],
    floorPlans: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuperAdminData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [orgsResponse, deptsResponse, floorPlansResponse] = await Promise.all([
          fetch('/api/superadmin/organizations'),
          fetch('/api/superadmin/departments'),
          fetch('/api/superadmin/floor-plans')
        ]);

        if (!orgsResponse.ok || !deptsResponse.ok || !floorPlansResponse.ok) {
          throw new Error('Failed to fetch SuperAdmin data');
        }

        const [orgsResult, deptsResult, floorPlansResult] = await Promise.all([
          orgsResponse.json(),
          deptsResponse.json(),
          floorPlansResponse.json()
        ]);

        setData({
          organizations: orgsResult.success ? orgsResult.data : [],
          departments: deptsResult.success ? deptsResult.data : [],
          floorPlans: floorPlansResult.success ? floorPlansResult.data : []
        });
      } catch (err) {
        console.error('Error fetching SuperAdmin data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchSuperAdminData();
  }, []);

  const refetch = () => {
    const fetchData = async () => {
      try {
        const [orgsResponse, deptsResponse, floorPlansResponse] = await Promise.all([
          fetch('/api/superadmin/organizations'),
          fetch('/api/superadmin/departments'),
          fetch('/api/superadmin/floor-plans')
        ]);

        if (orgsResponse.ok && deptsResponse.ok && floorPlansResponse.ok) {
          const [orgsResult, deptsResult, floorPlansResult] = await Promise.all([
            orgsResponse.json(),
            deptsResponse.json(),
            floorPlansResponse.json()
          ]);

          setData({
            organizations: orgsResult.success ? orgsResult.data : [],
            departments: deptsResult.success ? deptsResult.data : [],
            floorPlans: floorPlansResult.success ? floorPlansResult.data : []
          });
        }
      } catch (err) {
        console.error('Error refetching data:', err);
      }
    };

    fetchData();
  };

  return {
    ...data,
    loading,
    error,
    refetch
  };
}