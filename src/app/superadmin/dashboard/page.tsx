
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
import { DeactivateAdminDialog } from '@/components/superadmin/deactivate-admin-dialog';
import { PlusCircle, Users, Edit, Building, RadioTower, ShieldAlert, Power, CheckCircle, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminUser, Device } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function SuperAdminDashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const { user, admins, allDevices, deactivateAdmin } = useAuth();

  const { totalOrgs, totalDevices, totalAlerts, orgsWithDetails } = useMemo(() => {
    const validOrgs = admins
      .map(a => a.organization)
      .filter((org): org is string => !!org && org.trim() !== '');
    const orgSet = new Set(validOrgs);
    
    const devices = allDevices.length;
    // This is a placeholder until global alerts are fetched.
    const alerts = 0; 
    
    const orgDetails = Array.from(orgSet).sort().map(orgName => {
        const adminsInOrg = admins.filter(a => a.organization === orgName);
        const adminIdsInOrg = adminsInOrg.map(a => a.id);
        const devicesInOrg = allDevices.filter(d => adminIdsInOrg.includes(d.adminId));
        return {
            name: orgName,
            admins: adminsInOrg,
            devices: devicesInOrg,
        };
    });

    return { 
      totalOrgs: orgSet.size, 
      totalDevices: devices, 
      totalAlerts: alerts,
      orgsWithDetails: orgDetails
    };
  }, [admins, allDevices]);


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
  
  const handleDeactivateClick = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = () => {
    if (selectedAdmin) {
      deactivateAdmin(selectedAdmin.id);
    }
    setIsDeactivateDialogOpen(false);
    setSelectedAdmin(null);
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
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
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registered Organizations & Devices</DialogTitle>
              <DialogDescription>
                Click an organization to see its registered devices.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto pr-4">
              <Accordion type="single" collapsible>
                {orgsWithDetails.map((org) => (
                  <AccordionItem value={org.name} key={org.name}>
                    <AccordionTrigger>{org.name} ({org.devices.length} devices)</AccordionTrigger>
                    <AccordionContent>
                      {org.devices.length > 0 ? (
                        <div className="space-y-2 pl-4">
                          {org.devices.map(device => (
                            <div key={device.id} className="text-sm p-2 rounded-md border border-border/50">
                              <p className="font-medium">{device.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{device.id} - {device.type}</p>
                              <p className="text-xs text-muted-foreground">
                                Admin: {admins.find(a => a.id === device.adminId)?.name || 'N/A'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No devices registered for this organization.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </DialogContent>
        </Dialog>
          
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
                <TableHead className="text-center hidden sm:table-cell">Status</TableHead>
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
                   <TableCell className="text-center hidden sm:table-cell">
                    {admin.status === 'active' ? (
                      <Badge variant="outline" className="text-green-400 border-green-400/50"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>
                    ) : (
                       <Badge variant="destructive" className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"><XCircle className="mr-1 h-3 w-3"/>Inactive</Badge>
                    )}
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
                        <DropdownMenuItem onClick={() => handleEditClick(admin)} disabled={admin.status === 'inactive'}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Plan/Quota</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem 
                            onClick={() => handleDeactivateClick(admin)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            disabled={admin.status === 'inactive'}
                          >
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
      
      <DeactivateAdminDialog
        isOpen={isDeactivateDialogOpen}
        onOpenChange={setIsDeactivateDialogOpen}
        admin={selectedAdmin}
        onConfirm={handleDeactivateConfirm}
      />
    </div>
  );
}
