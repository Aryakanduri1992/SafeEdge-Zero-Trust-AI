
"use client";

import { useMemo } from "react";
import { Line, LineChart, CartesianGrid, XAxis, Tooltip, YAxis, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useDeviceSensorData } from "@/hooks/use-device-sensor-data";
import { format } from "date-fns";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SensorReading } from "@/lib/types";

const chartConfig = {
  temperature: {
    label: "Temperature",
    color: "hsl(var(--primary))",
  },
  humidity: {
    label: "Humidity",
    color: "hsl(var(--chart-2))",
  },
   pressure: {
    label: "Pressure",
    color: "hsl(var(--chart-3))",
  },
  vibration: {
    label: "Vibration",
    color: "hsl(var(--chart-4))",
  },
  value: {
      label: 'Value',
      color: "hsl(var(--primary))",
  }
} as const;

type DeviceRealtimeChartProps = {
  deviceId: string;
};

export function DeviceRealtimeChart({ deviceId }: DeviceRealtimeChartProps) {
  const { data: sensorData, isLoading } = useDeviceSensorData(deviceId);

  const { chartData, activeMetrics } = useMemo(() => {
    if (!sensorData) return { chartData: [], activeMetrics: [] };
    
    const metrics = new Set<keyof typeof chartConfig>();
    const data = sensorData
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-50)
      .map(d => {
        metrics.add(d.metricType || 'value');
        return {
          ...d,
          timestamp: new Date(d.timestamp),
          formattedTimestamp: format(new Date(d.timestamp), "HH:mm:ss"),
        }
      });

    return { chartData: data, activeMetrics: Array.from(metrics) };
  }, [sensorData]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sensorData || sensorData.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Historical Sensor Data</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Waiting for incoming sensor readings to be stored in Firestore...
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-[400px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart 
            accessibilityLayer
            data={chartData} 
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="formattedTimestamp"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={
              <ChartTooltipContent
                labelFormatter={(label, payload) => {
                  return payload[0]?.payload.timestamp ? format(payload[0]?.payload.timestamp, "PPP HH:mm:ss") : label;
                }}
                formatter={(value, name) => (
                    <div className="flex flex-col">
                        <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                    </div>
                )}
              />
            }
          />
          <Legend content={<ChartLegendContent />} />
          {activeMetrics.map((metric) => (
             <Line
                key={metric}
                dataKey={(data: SensorReading) => data.metricType === metric ? data.value : (metric === 'value' && !data.metricType ? data.value : null)}
                type="monotone"
                stroke={chartConfig[metric as keyof typeof chartConfig].color}
                strokeWidth={2}
                dot={false}
                name={chartConfig[metric as keyof typeof chartConfig].label}
                connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
