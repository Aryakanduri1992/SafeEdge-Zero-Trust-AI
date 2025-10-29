
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, ArrowLeft, RadioTower, Loader2, PlayCircle, XCircle, PowerOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRtdbValue } from '@/hooks/use-rtdb-value';
import { formatDistanceToNow } from 'date-fns';

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.deviceId as string;
  const { devices, isLoading: isAuthLoading } = useAuth();

  const device = useMemo(() => {
    return devices.find(d => d.id === deviceId);
  }, [devices, deviceId]);

  const { data: liveData, connectionStatus, connect, disconnect } = useRtdbValue(device);

  const isLoading = isAuthLoading || !device;

  const getStatusBadge = (): { text: string; className: string } => {
    switch (connectionStatus) {
      case 'connecting':
        return { text: `Connecting...`, className: 'text-muted-foreground' };
      case 'connected':
        return { text: 'Online', className: 'text-green-500 border-green-500/50 bg-green-500/10' };
      case 'offline':
        return { text: 'Offline', className: 'text-destructive border-destructive/50 bg-destructive/10' };
      case 'disconnected':
      default:
        return { text: 'Disconnected', className: '' };
    }
  };

  const { text: statusText, className: statusClassName } = getStatusBadge();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <HardDrive className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-bold">Device Not Found</h2>
        <p className="mt-2 text-muted-foreground">The device you are looking for does not exist or you do not have permission to view it.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/admin/devices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Devices
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="shrink-0">
          <Link href="/admin/devices">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Devices</span>
          </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{device.name}</h1>
            <p className="text-muted-foreground">
                Displaying live sensor data for device ID: {device.id}
            </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <RadioTower className="h-5 w-5 text-primary" />
                    Live Data Feed
                </CardTitle>
                <CardDescription>
                    Real-time data stream from: {device.dbPath}.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={connect} disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}>
                    <PlayCircle />
                    Connect
                </Button>
                 <Button variant="destructive" size="sm" onClick={disconnect} disabled={connectionStatus === 'disconnected'}>
                    <XCircle />
                    Disconnect
                </Button>
            </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center text-center h-48">
          {connectionStatus === 'connecting' ? (
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Connecting...</span>
             </div>
          ) : connectionStatus === 'connected' && liveData ? (
              <div>
                <p className="text-6xl font-bold tracking-tighter">
                  {typeof liveData.value === 'number' ? liveData.value.toFixed(2) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {liveData.timestamp ? `${formatDistanceToNow(new Date(liveData.timestamp), { addSuffix: true })}` : 'N/A'}
                </p>
              </div>
          ) : connectionStatus === 'offline' ? (
             <div className="flex flex-col items-center gap-2">
                <PowerOff className="h-8 w-8 text-destructive" />
                <span className="font-semibold text-destructive">Device is offline</span>
                <span className="text-sm text-muted-foreground">No data is being received at this path.</span>
             </div>
          ) : (
             <div className="flex flex-col items-center gap-2">
                <HardDrive className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Press "Connect" to start the live feed.</span>
             </div>
          )}
        </CardContent>
         <div className="p-4 border-t flex items-center justify-end">
            <Badge variant="outline" className={statusClassName}>
              {statusText}
            </Badge>
        </div>
      </Card>
    </div>
  );
}
