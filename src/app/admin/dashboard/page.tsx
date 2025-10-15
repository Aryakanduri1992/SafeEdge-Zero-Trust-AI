"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { User, Calendar, Smartphone, Star, RadioTower, ShieldAlert, HeartPulse, Bell, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { AdminUser, DeviceStatus } from "@/lib/types";

// Mock Data
const devices = [
  { id: 'DEV001', name: 'Mainframe-A', status: 'online', lastSeen: '2024-07-31T10:00:00Z' },
  { id: 'DEV002', name: 'Sensor-B2', status: 'offline', lastSeen: '2024-07-30T14:30:00Z' },
  { id: 'DEV003', name: 'Gateway-C', status: 'alerting', lastSeen: '2024-07-31T10:05:00Z' },
  { id: 'DEV004', name: 'AccessPoint-D1', status: 'online', lastSeen: '2024-07-31T09:58:00Z' },
  { id: 'DEV005', name: 'Server-E', status: 'online', lastSeen: '2024-07-31T10:02:00Z' },
];

const alerts = [
  { time: '10:05:15', device: 'Gateway-C', type: 'Anomalous Traffic', severity: 'Critical' },
  { time: '09:45:30', device: 'Sensor-B2', type: 'Device Offline', severity: 'High' },
  { time: '09:10:02', device: 'Mainframe-A', type: 'High CPU Usage', severity: 'Medium' },
  { time: '08:55:12', device: 'AccessPoint-D1', type: 'Failed Login', severity: 'Medium' },
];


const getStatusIndicator = (status: DeviceStatus) => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'offline':
      return 'bg-gray-500';
    case 'alerting':
      return 'bg-red-500';
    default:
      return 'bg-yellow-500';
  }
};

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

const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'High':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'Medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const adminUser = user as AdminUser;

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const alertingDevices = devices.filter(d => d.status === 'alerting').length;

  const criticalAlerts = alerts.filter(a => a.severity === 'Critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'High').length;
  const mediumAlerts = alerts.filter(a => a.severity === 'Medium').length;

  const deviceHealth = Math.round((onlineDevices / devices.length) * 100);

  const deviceStatusData = [
    { name: 'Online', value: onlineDevices, fill: 'hsl(var(--chart-2))' },
    { name: 'Offline', value: offlineDevices, fill: 'hsl(var(--muted))' },
    { name: 'Alerting', value: alertingDevices, fill: 'hsl(var(--chart-5))' },
  ];

  if (!adminUser) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}. Here is the real-time status of your protected assets.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Status</CardTitle>
            <RadioTower className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length} Total</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-400">{onlineDevices} Online</span> / <span className="text-gray-400">{offlineDevices} Offline</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
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
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUser.plan} Plan</div>
            <p className="text-xs text-muted-foreground">{adminUser.devices} device licenses used</p>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Severity</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead>Event Type</TableHead>
                            <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alerts.map((alert, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{getSeverityBadge(alert.severity)}</TableCell>
                                <TableCell className="font-mono text-xs">{alert.device}</TableCell>
                                <TableCell className="text-muted-foreground">{alert.type}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{alert.time}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
            <CardHeader>
                <CardTitle>Device Status Distribution</CardTitle>
                <CardDescription>Current operational state of all devices.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                 <ChartContainer config={{}} className="h-[200px] w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={deviceStatusData} dataKey="value" nameKey="name" innerRadius={50}>
                             {deviceStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
