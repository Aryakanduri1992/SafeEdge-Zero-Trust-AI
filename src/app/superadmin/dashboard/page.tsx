
"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateAdminForm } from '@/components/superadmin/create-admin-form';
import { EditAdminForm } from '@/components/superadmin/edit-admin-form';
import { PlusCircle, Users, Edit, Building, RadioTower, ShieldAlert, Power } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminUser } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function SuperAdminDashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const { user, admins } = useAuth();

  const { totalOrgs, totalDevices, totalAlerts } = useMemo(() => {
    const orgs = new Set(admins.map(a => a.organization));
    const devices = admins.reduce((sum, admin) => sum + (admin.devices || 0), 0);
    // This is a placeholder until global alerts are fetched.
    const alerts = 0; 
    return { totalOrgs: orgs.size, totalDevices: devices, totalAlerts: alerts };
  }, [admins]);


  const planVariant = (plan: AdminUser['plan']) => {
    switch (plan) {
      case 'Pro':
        return 'default';
      case 'Enterprise':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleEditClick = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header is handled in layout */}
      
      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrgs}</div>
              <p className="text-xs text-muted-foreground">
                Registered startup organizations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.length}</div>
              <p className="text-xs text-muted-foreground">
                Across all organizations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <RadioTower className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDevices}</div>
              <p className="text-xs text-muted-foreground">
                Aggregate devices across all orgs
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
                Critical/high alerts platform-wide
              </p>
            </CardContent>
          </Card>
      </div>

      {/* Admin Management Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Admin Management</CardTitle>
              <CardDescription>
                Create and manage administrator accounts for all organizations.
              </CardDescription>
            </div>
             <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Admin</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new admin account. Credentials must be shared securely.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateAdminForm onFinished={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin Name</TableHead>
                <TableHead className="hidden md:table-cell">Organization</TableHead>
                <TableHead className="hidden lg:table-cell">Created At</TableHead>
                <TableHead className="text-center">Plan</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <div>{admin.name}</div>
                    <div className="text-muted-foreground md:hidden text-xs">{admin.organization}</div>
                    <div className="text-muted-foreground text-xs font-mono">{admin.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{admin.organization}</TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={planVariant(admin.plan)}>{admin.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(admin)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Plan/Quota</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Power className="mr-2 h-4 w-4" />
                          <span>Deactivate</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Admin: {selectedAdmin?.name}</DialogTitle>
                <DialogDescription>
                  Update the plan and device allocation for this administrator.
                </DialogDescription>
              </DialogHeader>
              {selectedAdmin && <EditAdminForm admin={selectedAdmin} onFinished={() => setIsEditDialogOpen(false)} />}
            </DialogContent>
          </Dialog>
    </div>
  );
}
