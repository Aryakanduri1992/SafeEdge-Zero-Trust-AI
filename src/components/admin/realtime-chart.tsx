
"use client";

import { useMemo } from "react";
import { Line, LineChart, CartesianGrid, XAxis, Tooltip, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useSensorData } from "@/hooks/use-sensor-data";
import { format } from "date-fns";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const chartConfig = {
  temperature: {
    label: "Temperature (°C)",
    color: "hsl(var(--chart-1))",
  },
  humidity: {
    label: "Humidity (%)",
    color: "hsl(var(--chart-2))",
  },
  pressure: {
    label: "Pressure (hPa)",
    color: "hsl(var(--chart-3))",
  },
  vibration: {
    label: "Vibration (m/s²)",
    color: "hsl(var(--chart-4))",
  },
};

export function RealtimeChart() {
  const { user } = useAuth();
  const { data: sensorData, isLoading } = useSensorData(user?.id);

  const chartData = useMemo(() => {
    if (!sensorData) return [];
    // Sort data and take the last 30 points for a clean view
    return sensorData
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-30)
      .map(d => ({
        ...d,
        timestamp: new Date(d.timestamp),
        formattedTimestamp: format(new Date(d.timestamp), "HH:mm:ss"),
      }));
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
        <h3 className="mt-4 text-lg font-semibold">No Sensor Data</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Waiting for incoming sensor readings...
        </p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
            tickFormatter={(value) => value.toFixed(1)}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={
              <ChartTooltipContent
                labelFormatter={(label, payload) => {
                  return payload[0]?.payload.timestamp ? format(payload[0]?.payload.timestamp, "PPP HH:mm:ss") : label;
                }}
                formatter={(value, name) => (
                    <div className="flex flex-col">
                        <span>{value.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">{chartConfig[name as keyof typeof chartConfig].label}</span>
                    </div>
                )}
              />
            }
          />
          {Object.keys(chartConfig).map((metric) => (
             <Line
                key={metric}
                dataKey={(data) => data.metricType === metric ? data.value : null}
                type="monotone"
                stroke={chartConfig[metric as keyof typeof chartConfig].color}
                strokeWidth={2}
                dot={false}
                name={metric}
                connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
