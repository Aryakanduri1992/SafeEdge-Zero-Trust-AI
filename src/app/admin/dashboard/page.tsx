
"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell } from "recharts";
import { Star, RadioTower, ShieldAlert, HeartPulse, Bell, AlertCircle, AlertTriangle, Info, WifiOff, ServerCrash, Users } from "lucide-react";
import { Organization, DeviceStatus, Device, AdminUser } from "@/lib/types";

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'Critical':
      return <Badge variant="destructive" className="bg-red-600">Critical</Badge>;
    case 'High':
      return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
    case 'Medium':
      return <Badge variant="secondary" className="bg-yellow-500 text-black">Medium</Badge>;
    default:
      return <Badge variant="outline">Low</Badge>;
  }
};

const LoadingSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div>
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-[108px] w-full" />
      <Skeleton className="h-[108px] w-full" />
      <Skeleton className="h-[108px] w-full" />
      <Skeleton className="h-[108px] w-full" />
    </div>
     <div className="grid gap-8 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-[300px]" />
        <Skeleton className="h-[300px]" />
     </div>
  </div>
);


export default function AdminDashboardPage() {
  const { user, departments } = useAuth();
  const orgUser = user as Organization;
  const firestore = useFirestore();

  const departmentIds = useMemo(() => departments.map(d => d.id), [departments]);

  const devicesQuery = useMemoFirebase(() => {
    if (!firestore || departmentIds.length === 0) return null;
    return query(collection(firestore, "devices"), where("adminId", "in", departmentIds));
  }, [firestore, departmentIds]);

  const { data: devices, isLoading: areDevicesLoading } = useCollection<Device>(devicesQuery);
  
  const isLoading = areDevicesLoading || departments.length === 0 && !areDevicesLoading;

  const {
    onlineDevices,
    offlineDevices,
    alertingDevices,
    deviceHealth,
    alerts,
    deviceStatusData
  } = useMemo(() => {
    if (!devices) {
      return {
        onlineDevices: 0,
        offlineDevices: 0,
        alertingDevices: 0,
        deviceHealth: 0,
        alerts: [],
        deviceStatusData: [],
      };
    }

    const online = devices.filter(d => d.status === 'online').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    const alerting = devices.filter(d => d.status === 'alerting').length;
    const total = devices.length;
    const health = total > 0 ? Math.round((online / total) * 100) : 100;

    const generatedAlerts = devices
        .filter(d => d.status === 'alerting' || d.status === 'offline')
        .map(d => ({
            time: new Date(d.lastSeen).toLocaleTimeString(),
            device: d.name,
            type: d.status === 'alerting' ? 'Anomalous Behaviour' : 'Device Offline',
            severity: d.status === 'alerting' ? 'Critical' : 'High',
        }))
        .sort((a,b) => (a.severity > b.severity) ? -1 : 1);


    const statusData = [
        { name: 'Online', value: online, fill: 'hsl(var(--chart-2))' },
        { name: 'Offline', value: offline, fill: 'hsl(var(--muted))' },
        { name: 'Alerting', value: alerting, fill: 'hsl(var(--chart-5))' },
    ];

    return {
      onlineDevices: online,
      offlineDevices: offline,
      alertingDevices: alerting,
      deviceHealth: health,
      alerts: generatedAlerts,
      deviceStatusData: statusData,
    };
  }, [devices]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (!orgUser) {
    return null;
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'Critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'High').length;
  const totalDevices = devices?.length ?? 0;
  const totalAlerts = alerts.length;
  const totalDepartments = departments.length;
  const totalDeviceQuota = departments.reduce((acc, dept) => acc + dept.devices, 0);


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Organization Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.organizationName}. Here is the real-time status of your protected assets.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
             <p className="text-xs text-muted-foreground">
              Managed under this organization
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">{criticalAlerts} Critical</span> / <span className="text-orange-500">{highAlerts} High</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Health</CardTitle>
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deviceHealth}%</div>
            <p className="text-xs text-muted-foreground">Aggregate system reliability</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Licenses</CardTitle>
            <RadioTower className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices} / {totalDeviceQuota}</div>
            <p className="text-xs text-muted-foreground">Total devices used across all plans</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
                <CardTitle>Live Alerts Feed</CardTitle>
                <CardDescription>Real-time security and operational events.</CardDescription>
            </CardHeader>
            <CardContent>
                {alerts.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Severity</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead className="hidden sm:table-cell">Event Type</TableHead>
                            <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alerts.map((alert, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{getSeverityBadge(alert.severity)}</TableCell>
                                <TableCell className="font-mono text-xs">{alert.device}</TableCell>
                                <TableCell className="text-muted-foreground hidden sm:table-cell">{alert.type}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{alert.time}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-10">
                        <ShieldAlert className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="font-semibold text-lg">All Systems Normal</h3>
                        <p className="text-muted-foreground text-sm">No active alerts to display.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
            <CardHeader>
                <CardTitle>Device Status Distribution</CardTitle>
                <CardDescription>Current operational state of all devices.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                {totalDevices > 0 ? (
                 <ChartContainer config={{}} className="h-[200px] w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={deviceStatusData} dataKey="value" nameKey="name" innerRadius={50} paddingAngle={5}>
                             {deviceStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-10">
                        <ServerCrash className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg">No Devices</h3>
                        <p className="text-muted-foreground text-sm">Add a device to see its status.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    