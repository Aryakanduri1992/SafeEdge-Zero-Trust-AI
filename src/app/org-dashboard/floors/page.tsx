"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Layers, LayoutGrid, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';

// Dynamic import for 3D component (Three.js requires client-side rendering)
const Simple3DFloorPlan = dynamic(
  () => import('@/components/admin/Simple3DFloorPlan').then(mod => ({ default: mod.Simple3DFloorPlan })),
  { 
    ssr: false,
    loading: () => (
      <Card className="border-[#242d53]/10">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#d3b78f]" />
            <p className="text-[#242d53]">Loading 3D Visualization...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
);

interface OrgData {
  organization: any;
  floors: any[];
  devices: any[];
  statistics: {
    totalFloors: number;
    totalRooms: number;
    totalArea: number;
    totalDevices: number;
  };
}

export default function FloorsPage() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchOrgData(userData.organizationId);
    }
  }, []);

  const fetchOrgData = async (organizationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/org-data?organizationId=${organizationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setOrgData(data);
    } catch (error: any) {
      console.error('Error fetching org data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load floor data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Floor Plans</h1>
          <p className="text-gray-200">3D visualization of your building layout</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Floors</CardTitle>
                  <Layers className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{orgData?.statistics.totalFloors || 0}</div>
                  <p className="text-xs text-[#5B6B8F] mt-1">Building levels</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Rooms</CardTitle>
                  <LayoutGrid className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{orgData?.statistics.totalRooms || 0}</div>
                  <p className="text-xs text-[#5B6B8F] mt-1">Across all floors</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Area</CardTitle>
                  <MapPin className="h-5 w-5 text-[#6B8E6F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">
                    {orgData?.statistics.totalArea.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-[#5B6B8F] mt-1">Square feet</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Devices Deployed</CardTitle>
                  <Layers className="h-5 w-5 text-[#C17A3A]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{orgData?.statistics.totalDevices || 0}</div>
                  <p className="text-xs text-[#5B6B8F] mt-1">IoT devices</p>
                </CardContent>
              </Card>
            </div>

            {/* 3D Floor Plan Visualization */}
            {orgData && orgData.floors.length > 0 ? (
              <Simple3DFloorPlan
                floors={orgData.floors}
                devices={orgData.devices}
                organizationName={orgData.organization.name}
              />
            ) : (
              <Card className="border-[#242d53]/10">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 text-[#d3b78f]" />
                    <p className="text-[#242d53] mb-2 font-semibold">No floor plans available</p>
                    <p className="text-sm text-[#5B6B8F]">Floor plans will appear here once configured</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Floor Details List */}
            {orgData && orgData.floors.length > 0 && (
              <Card className="bg-gradient-to-br from-[#242d53] to-[#2d3a5f] border-[#d3b78f]/20">
                <CardHeader>
                  <CardTitle className="text-white">Floor Details</CardTitle>
                  <CardDescription className="text-gray-300">Detailed information about each floor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orgData.floors.map((floor: any) => (
                      <div key={floor.id} className="p-5 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-[#d3b78f]/30">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#d3b78f] rounded-lg flex items-center justify-center">
                              <Layers className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xl text-[#242d53]">Floor {floor.floorNumber}: {floor.floorName}</h4>
                              <p className="text-sm text-gray-600 mt-1">{floor.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="text-center px-3 py-2 bg-[#f8f9fa] rounded-lg border border-gray-200">
                              <div className="text-[#242d53] font-bold text-lg">{floor.totalArea}</div>
                              <div className="text-gray-600 text-xs">sq ft</div>
                            </div>
                            <div className="text-center px-3 py-2 bg-[#f8f9fa] rounded-lg border border-gray-200">
                              <div className="text-[#242d53] font-bold text-lg">{floor.rooms?.length || 0}</div>
                              <div className="text-gray-600 text-xs">rooms</div>
                            </div>
                          </div>
                        </div>
                        {floor.rooms && floor.rooms.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">Rooms</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {floor.rooms.map((room: any) => (
                                <div key={room.id} className="p-3 bg-gradient-to-br from-[#f8f9fa] to-white rounded-lg border-2 border-[#d3b78f]/30 hover:border-[#d3b78f] hover:shadow-md transition-all">
                                  <div className="font-bold text-[#242d53] mb-1">{room.identifier}</div>
                                  <div className="text-sm text-gray-700 font-medium">{room.name}</div>
                                  <div className="text-xs text-gray-600 mt-1">{room.type}</div>
                                  <div className="text-xs text-[#d3b78f] font-semibold mt-1">{room.width}×{room.height} ft</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}
