
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, XCircle, HardDrive, Database } from "lucide-react";
import { Organization } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

const LoadingSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div>
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
      <Skeleton className="h-[108px] w-full" />
      <Skeleton className="h-[108px] w-full" />
    </div>
     <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
           <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
           </div>
        </CardContent>
      </Card>
  </div>
);


export default function AdminDashboardPage() {
  const { user, departments, devices, isLoading } = useAuth();
  const orgUser = user as Organization;

  if (isLoading || !orgUser) {
    return <LoadingSkeleton />;
  }

  const totalDepartments = departments.length;
  const totalDeviceQuota = departments.reduce((acc, dept) => acc + dept.devices, 0);
  const usedDevices = devices.length;
  const remainingDevices = Math.max(0, totalDeviceQuota - usedDevices);
  const usagePercentage = totalDeviceQuota > 0 ? Math.round((usedDevices / totalDeviceQuota) * 100) : 0;


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Organization Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {orgUser.organizationName}. Here is the real-time status of your protected assets.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-primary/20">
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
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Managed Departments</DialogTitle>
              <DialogDescription>
                A list of all departments registered under {orgUser.organizationName}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
                {departments.length > 0 ? (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="hidden sm:table-cell">Location</TableHead>
                        <TableHead className="hidden md:table-cell">Building/Floor</TableHead>
                        <TableHead className="text-center">Device Quota</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.map((dept) => (
                        <TableRow key={dept.id}>
                            <TableCell>
                            <div className="font-medium">{dept.departmentName}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{dept.location}</TableCell>
                            <TableCell className="hidden md:table-cell">{dept.building}, Fl {dept.floor}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                <HardDrive className="h-4 w-4 text-muted-foreground"/> 
                                <span>{dept.devices}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                            {dept.status === 'active' ? (
                                <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>
                            ) : (
                                <Badge variant="destructive" className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"><XCircle className="mr-1 h-3 w-3" />Inactive</Badge>
                            )}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-16">
                        <h3 className="mt-2 text-lg font-semibold">No Departments Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            This organization does not have any departments configured yet.
                        </p>
                    </div>
                )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Device License Quota</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeviceQuota}</div>
                <p className="text-xs text-muted-foreground">Total devices licensed</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
             <DialogHeader>
                <DialogTitle>Device License Status</DialogTitle>
                <DialogDescription>
                    Your organization's current device license usage.
                </DialogDescription>
             </DialogHeader>
             <div className="space-y-6 pt-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-muted-foreground">Used Licenses</span>
                        <span className="text-sm font-semibold">{usedDevices} / {totalDeviceQuota}</span>
                    </div>
                    <Progress value={usagePercentage} />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{totalDeviceQuota}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Used</p>
                        <p className="text-2xl font-bold text-primary">{usedDevices}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-2xl font-bold text-green-500">{remainingDevices}</p>
                    </div>
                </div>
             </div>
          </DialogContent>
        </Dialog>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Departments Overview</CardTitle>
          <CardDescription>
            A high-level overview of your departments.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {departments.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="hidden sm:table-cell">Location</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.slice(0, 5).map((dept) => (
                        <TableRow key={dept.id}>
                            <TableCell>
                                <div className="font-medium">{dept.departmentName}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{dept.location}</TableCell>
                            <TableCell className="text-center">
                            {dept.status === 'active' ? (
                                <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>
                            ) : (
                                <Badge variant="destructive" className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"><XCircle className="mr-1 h-3 w-3" />Inactive</Badge>
                            )}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-10 text-sm text-muted-foreground">
                    No departments available to display.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
