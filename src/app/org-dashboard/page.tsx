"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Layers, Cpu, TrendingUp, Activity, Plus, FileText, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';
import Link from 'next/link';

interface OrgData {
  organization: any;
  departments: any[];
  floors: any[];
  devices: any[];
  statistics: {
    totalDepartments: number;
    totalFloors: number;
    totalRooms: number;
    totalDevices: number;
    totalArea: number;
  };
}

interface SystemHealth {
  deviceConnectivity: number;
  networkStatus: number;
  securityScore: number;
  storageUsage: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  metadata?: any;
}

export default function OrgDashboardPage() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    deviceConnectivity: 0,
    networkStatus: 0,
    securityScore: 0,
    storageUsage: 0,
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchOrgData(userData.organizationId);
      fetchSystemHealth(userData.organizationId);
      fetchActivities(userData.organizationId);
      fetchAlerts(userData.organizationId);
      
      // Set up auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(() => {
        fetchSystemHealth(userData.organizationId);
        fetchActivities(userData.organizationId);
        fetchAlerts(userData.organizationId);
      }, 30000);
      
      return () => clearInterval(interval);
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
        description: error.message || 'Failed to load organization data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemHealth = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/system-health?organizationId=${organizationId}`);
      const data = await response.json();

      if (response.ok && data.systemHealth) {
        setSystemHealth(data.systemHealth);
      }
    } catch (error: any) {
      console.error('Error fetching system health:', error);
      // Keep default 0 values on error
    }
  };

  const fetchActivities = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/activities?organizationId=${organizationId}&limit=4`);
      const data = await response.json();

      if (response.ok && data.activities) {
        setActivities(data.activities);
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchAlerts = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/alerts?organizationId=${organizationId}&status=active`);
      const data = await response.json();

      if (response.ok) {
        setAlertCount(data.activeCount || 0);
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getActivityColor = (type: string) => {
    const colors: { [key: string]: string } = {
      device: '#6B8E6F',
      security: '#d3b78f',
      floor: '#5B6B8F',
      department: '#C17A3A',
      alert: '#C17A3A',
      system: '#5B6B8F'
    };
    return colors[type] || '#5B6B8F';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getOnlineDevices = () => {
    if (!orgData) return 0;
    return orgData.devices.filter(d => d.status === 'online').length;
  };

  const getOnlinePercentage = () => {
    if (!orgData || orgData.statistics.totalDevices === 0) return 0;
    return Math.round((getOnlineDevices() / orgData.statistics.totalDevices) * 100);
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-200">Welcome back! Here's what's happening with your organization.</p>
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
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Departments</CardTitle>
                  <Building2 className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{orgData?.statistics.totalDepartments || 0}</div>
                  <p className="text-xs text-[#6B8E6F] flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Active departments
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Active Floors</CardTitle>
                  <Layers className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{orgData?.statistics.totalFloors || 0}</div>
                  <p className="text-xs text-[#5B6B8F] mt-1">
                    {orgData?.statistics.totalRooms || 0} total rooms
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Devices Online</CardTitle>
                  <Cpu className="h-5 w-5 text-[#6B8E6F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">
                    {getOnlineDevices()}/{orgData?.statistics.totalDevices || 0}
                  </div>
                  <p className="text-xs text-[#6B8E6F] mt-1">
                    {getOnlinePercentage()}% operational
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <Link href="/org-dashboard/alerts">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer">
                    <CardTitle className="text-sm font-medium text-[#5B6B8F]">Alerts</CardTitle>
                    <Activity className="h-5 w-5 text-[#C17A3A]" />
                  </CardHeader>
                  <CardContent className="cursor-pointer">
                    <div className="text-3xl font-bold text-[#242d53]">{alertCount}</div>
                    <p className="text-xs text-[#C17A3A] mt-1">
                      {alertCount > 0 ? 'Requires attention' : 'No active alerts'}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-[#242d53] to-[#2d3a5f] border-[#d3b78f]/20">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
                <CardDescription className="text-gray-300">Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/org-dashboard/devices">
                    <Button className="w-full h-20 flex flex-col gap-2 bg-[#1a2340] text-[#d3b78f] hover:bg-[#d3b78f] hover:text-[#242d53] border-2 border-[#d3b78f] transition-all" variant="outline">
                      <Plus className="w-5 h-5" />
                      <span className="text-sm font-medium">Add Device</span>
                    </Button>
                  </Link>
                  <Link href="/org-dashboard/departments">
                    <Button className="w-full h-20 flex flex-col gap-2 bg-white text-[#242d53] border-2 border-white hover:bg-[#d3b78f] hover:border-[#d3b78f] transition-all" variant="outline">
                      <Building2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Manage Departments</span>
                    </Button>
                  </Link>
                  <Link href="/org-dashboard/reports">
                    <Button className="w-full h-20 flex flex-col gap-2 bg-white text-[#242d53] border-2 border-white hover:bg-[#d3b78f] hover:border-[#d3b78f] transition-all" variant="outline">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">View Reports</span>
                    </Button>
                  </Link>
                  <Link href="/org-dashboard/settings">
                    <Button className="w-full h-20 flex flex-col gap-2 bg-white text-[#242d53] border-2 border-white hover:bg-[#d3b78f] hover:border-[#d3b78f] transition-all" variant="outline">
                      <SettingsIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Settings</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[#242d53] to-[#2d3a5f] border-[#d3b78f]/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-300">Latest events in your organization</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div 
                            className="w-2 h-2 rounded-full mt-2" 
                            style={{ backgroundColor: getActivityColor(activity.type) }}
                          ></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{activity.message}</p>
                            <p className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">No recent activities</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#242d53] to-[#2d3a5f] border-[#d3b78f]/20">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                  <CardDescription className="text-gray-300">Overall system performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-200">Device Connectivity</span>
                        <span className="font-medium text-white">{systemHealth.deviceConnectivity}%</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#6B8E6F] to-[#4a6b4e] h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${systemHealth.deviceConnectivity}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-200">Network Status</span>
                        <span className="font-medium text-white">{systemHealth.networkStatus}%</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#d3b78f] to-[#c9a876] h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${systemHealth.networkStatus}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-200">Security Score</span>
                        <span className="font-medium text-white">{systemHealth.securityScore}%</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#d3b78f] to-[#c9a876] h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${systemHealth.securityScore}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-200">Storage Usage</span>
                        <span className="font-medium text-white">{systemHealth.storageUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#5B6B8F] to-[#4a5670] h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${systemHealth.storageUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Organization Overview */}
            {orgData?.organization && (
              <Card className="bg-gradient-to-br from-[#242d53] to-[#2d3a5f] border-[#d3b78f]/20">
                <CardHeader>
                  <CardTitle className="text-white">Organization Overview</CardTitle>
                  <CardDescription className="text-gray-300">Your organization details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Organization Name</p>
                      <p className="font-semibold text-white">{orgData.organization.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Plan</p>
                      <p className="font-semibold text-white">{orgData.organization.plan?.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Max Devices</p>
                      <p className="font-semibold text-white">{orgData.organization.maxDevices}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Contact Person</p>
                      <p className="font-semibold text-white">{orgData.organization.contactPerson}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Email</p>
                      <p className="font-semibold text-white">{orgData.organization.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Phone</p>
                      <p className="font-semibold text-white">{orgData.organization.phoneNumber}</p>
                    </div>
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
