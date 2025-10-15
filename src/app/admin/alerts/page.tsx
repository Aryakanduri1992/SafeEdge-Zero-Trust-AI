"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, updateDoc, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Alert as AlertType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, ListFilter, Check, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';


const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive" className="bg-red-600/80 border-red-500/30 text-red-100">Critical</Badge>;
    case 'high':
      return <Badge variant="destructive" className="bg-orange-500/80 border-orange-400/30 text-orange-100">High</Badge>;
    case 'medium':
      return <Badge variant="secondary" className="bg-yellow-500/80 border-yellow-400/30 text-yellow-950">Medium</Badge>;
    default:
      return <Badge variant="outline">Low</Badge>;
  }
};

const LoadingState = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center p-10 sm:p-16">
        <ShieldAlert className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="font-semibold text-xl">All Systems Green</h3>
        <p className="text-muted-foreground text-sm mt-2">There are no active alerts to display at this time.</p>
    </div>
);

export default function AlertsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string[]>(['new']);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const alertsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    let q = query(collection(firestore, "alerts"), where("adminId", "==", user.id), orderBy("createdAt", "desc"));
    return q;
  }, [firestore, user?.id]);

  const { data: alerts, isLoading } = useCollection<AlertType>(alertsQuery);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter(alert => {
      const statusMatch = statusFilter.length === 0 || statusFilter.includes(alert.status);
      const severityMatch = severityFilter.length === 0 || severityFilter.includes(alert.severity);
      return statusMatch && severityMatch;
    });
  }, [alerts, statusFilter, severityFilter]);

  const handleAcknowledge = async (alertId: string) => {
    if (!firestore) return;
    setIsUpdating(alertId);
    try {
      const alertRef = doc(firestore, "alerts", alertId);
      await updateDoc(alertRef, { status: "acknowledged" });
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been marked as acknowledged.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not acknowledge the alert.",
      });
    } finally {
        setIsUpdating(null);
    }
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) => {
      setter(prev => 
          prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
        <p className="text-muted-foreground">
          View and manage real-time security and operational events.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <CardTitle>Live Alert Feed</CardTitle>
            <CardDescription>
                {isLoading ? 'Loading alerts...' : `${filteredAlerts.length} alerts matching your criteria.`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <div className="p-2 font-semibold">Status</div>
                <DropdownMenuCheckboxItem checked={statusFilter.includes('new')} onCheckedChange={() => handleFilterChange(setStatusFilter)('new')}>New</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter.includes('acknowledged')} onCheckedChange={() => handleFilterChange(setStatusFilter)('acknowledged')}>Acknowledged</DropdownMenuCheckboxItem>
                
                <div className="p-2 font-semibold mt-2">Severity</div>
                <DropdownMenuCheckboxItem checked={severityFilter.includes('critical')} onCheckedChange={() => handleFilterChange(setSeverityFilter)('critical')}>Critical</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={severityFilter.includes('high')} onCheckedChange={() => handleFilterChange(setSeverityFilter)('high')}>High</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : filteredAlerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="hidden md:table-cell">Event Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className={alert.status === 'new' ? 'bg-primary/5' : ''}>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>
                        <div className="font-medium">{alert.deviceName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{alert.deviceId}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{alert.type}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      {alert.status === 'new' ? (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={isUpdating === alert.id}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Acknowledge
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Acknowledged</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
