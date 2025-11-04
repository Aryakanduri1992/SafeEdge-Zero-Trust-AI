'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, ArrowLeft, RadioTower, Loader2, Wifi, WifiOff, AlertTriangle, Thermometer, Droplets } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useRtdbValue from '@/hooks/use-rtdb-value';
import { decryptData } from '@/lib/crypto-service';
import { Separator } from '@/components/ui/separator';

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.deviceId as string;
  const { devices, isLoading: isAuthLoading } = useAuth();

  const device = useMemo(() => {
    return devices.find(d => d.id === deviceId);
  }, [devices, deviceId]);

  const { data: liveData, loading: isRtdbLoading, error: rtdbError } = useRtdbValue(device?.dbPath || '', deviceId);

  const getStatusInfo = (): { text: string; className: string; icon: React.ReactNode } => {
    if (isRtdbLoading) {
      return { text: 'Connecting...', className: 'text-muted-foreground animate-pulse', icon: <Loader2 className="h-4 w-4 animate-spin" /> };
    }
    if (rtdbError) {
      return { text: 'Connection Error', className: 'text-destructive border-destructive/50 bg-destructive/10', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (liveData) {
      return { text: 'Live Feed', className: 'text-green-500 border-green-500/50 bg-green-500/10', icon: <Wifi className="h-4 w-4" /> };
    }
    if (!device?.dbPath) {
        return { text: 'No DB Path', className: 'text-amber-500 border-amber-500/50 bg-amber-500/10', icon: <WifiOff className="h-4 w-4" /> };
    }
    return { text: 'Awaiting Data', className: '', icon: <WifiOff className="h-4 w-4" /> };
  };

  const { text: statusText, className: statusClassName, icon: statusIcon } = getStatusInfo();

  if (isAuthLoading) {
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

  const formatTimestamp = (timestamp: string): string => {
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "Invalid date";
        const utcString = date.toISOString();
        const formattedDate = utcString.slice(0, 10);
        const formattedTime = utcString.slice(11, 19);
        return `${formattedDate} ${formattedTime} UTC`;
    } catch (e) {
        return "Invalid date format";
    }
  };

  const renderContent = () => {
    if (isRtdbLoading) {
      return (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Connecting to Realtime DB...</span>
        </div>
      );
    }
    if (rtdbError) {
       return (
           <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <span className="font-semibold text-destructive">Connection Error</span>
              <span className="text-sm text-muted-foreground">{rtdbError}</span>
           </div>
        );
    }

    // Handle DHT22 sensor (separate temp/humidity)
    if ((device.type === "DHT22_Temp" || device.type === "DHT22_Humidity") && liveData?.encrypted_temperature && liveData?.encrypted_humidity) {
        const temp = decryptData(liveData.encrypted_temperature);
        const humidity = decryptData(liveData.encrypted_humidity);
        return (
            <div className="flex items-center justify-center w-full">
                <div className="flex flex-col items-center px-8">
                    <Thermometer className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-4xl lg:text-6xl font-bold tracking-tighter">
                        {parseFloat(temp).toFixed(1)}°C
                    </p>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                </div>
                <Separator orientation="vertical" className="h-24" />
                <div className="flex flex-col items-center px-8">
                    <Droplets className="h-8 w-8 text-blue-500 mb-2" />
                    <p className="text-4xl lg:text-6xl font-bold tracking-tighter">
                        {parseFloat(humidity).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Humidity</p>
                </div>
            </div>
        );
    }

    // Handle PIR sensor and other single-value sensors
    if (liveData?.encrypted_value && liveData.timestamp) {
      const decryptedValue = decryptData(liveData.encrypted_value);
      
      if (device.type === "PIR") {
        const numericValue = parseInt(decryptedValue, 10);
        const displayValue = numericValue === 1 ? "Motion Detected" : "No Motion";
        return (
          <div>
            <p className="text-4xl lg:text-6xl font-bold tracking-tighter">{displayValue}</p>
          </div>
        );
      }
      
      // Default handler for other single-value sensor types
      return (
        <div>
          <p className="text-6xl font-bold tracking-tighter">{parseFloat(decryptedValue).toFixed(2)}</p>
        </div>
      );
    }
    
     return (
       <div className="flex flex-col items-center gap-2">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Waiting for first data point...</span>
       </div>
    );
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="shrink-0">
          <Link href="/admin/devices">
            <ArrowLeft className="mr-2 h-4 w-4" />
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
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <RadioTower className="h-5 w-5 text-primary" />
                Live Data Feed
            </CardTitle>
            <CardDescription>
                Real-time data stream from: {device.dbPath || "Not configured"}. Data is end-to-end encrypted.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[12rem] py-6">
          {renderContent()}
        </CardContent>
         <div className="p-4 border-t flex items-center justify-between">
             <span className="text-sm text-muted-foreground">Last Update: {liveData?.timestamp ? formatTimestamp(liveData.timestamp) : 'N/A'}</span>
            <Badge variant="outline" className={statusClassName}>
              {statusIcon}
              {statusText}
            </Badge>
        </div>
      </Card>

    </div>
  );
}
