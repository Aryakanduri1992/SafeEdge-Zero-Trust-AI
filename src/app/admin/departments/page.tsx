
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Organization, Department } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-1/2" />
    <Skeleton className="h-8 w-3/4" />
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function DepartmentsPage() {
  const { user, departments, isLoading } = useAuth();
  const orgUser = user as Organization;

  if (isLoading || !orgUser) {
    return <LoadingSkeleton />;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground">
          Viewing all departments for {orgUser.organizationName}.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Department List</CardTitle>
          <CardDescription>
            A list of all registered departments within your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead className="text-center">Device Quota</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <div className="font-medium">{dept.departmentName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{dept.organizationName}</div>
                    </TableCell>
                    <TableCell>{dept.location}</TableCell>
                    <TableCell>{dept.building}</TableCell>
                    <TableCell>{dept.floor}</TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                           <HardDrive className="h-4 w-4 text-muted-foreground"/> 
                           <span>{dept.devices}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {dept.status === 'active' ? (
                        <Badge variant="outline" className="text-green-400 border-green-400/50"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
