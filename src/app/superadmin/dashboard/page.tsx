
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
import { PlusCircle, Users, Edit, Building, RadioTower, ShieldAlert, Power, CheckCircle, XCircle, MoreHorizontal, User, Server, Camera, HardDrive, Cpu, Radio, ShieldCheck, SignalHigh, Signal, SignalLow, Search, Filter, MapPin, UserPlus } from 'lucide-react';
import { useState, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminUser, Device, DeviceType, DeviceStatus, AdminStatus } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ActivateAdminDialog } from '@/components/superadmin/activate-admin-dialog';
import { Input } from '@/components/ui/input';


const getDeviceTypeIcon = (type: DeviceType): ReactNode => {
    switch (type) {
        case 'Sensor':
            return <Cpu className="h-4 w-4 text-muted-foreground" />;
        case 'Gateway':
            return <Server className="h-4 w-4 text-muted-foreground" />;
        case 'Actuator':
            return <Radio className="h-4 w-4 text-muted-foreground" />;
        case 'Camera':
            return <Camera className="h-4 w-4 text-muted-foreground" />;
        default:
            return <HardDrive className="h-4 w-4 text-muted-foreground" />;
    }
}

const getStatusInfo = (status: DeviceStatus) => {
  switch (status) {
    case "online":
      return {
        variant: "default",
        className: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: <SignalHigh className="h-3.5 w-3.5" />,
        label: "Online",
      };
    case "offline":
      return {
        variant: "secondary",
        className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icon: <Signal className="h-3.5 w-3.5" />,
        label: "Offline",
      };
    case "alerting":
      return {
        variant: "destructive",
        className: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <SignalLow className="h-3.5 w-3.5" />,
        label: "Alerting",
      };
    default:
      return {
        variant: "outline",
        icon: <Signal className="h-3.5 w-3.5" />,
        label: "Unknown",
      };
  }
};


export default function SuperAdminDashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const { user, admins, allDevices, deactivateAdmin, activateAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  const [createFormInitialValues, setCreateFormInitialValues] = useState<{
    organizationName: string;
    email?: string;
    organizationId?: string;
  }>({ organizationName: '' });


  const { totalOrgs, totalDepartments, totalDevices, totalAlerts, orgsWithDetails } = useMemo(() => {
    const orgMap = new Map<string, { orgName: string; orgEmail: string, departments: AdminUser[] }>();

    admins.forEach(admin => {
        if (!admin.organizationId) return;
        if (!orgMap.has(admin.organizationId)) {
            orgMap.set(admin.organizationId, {
                orgName: admin.organizationName,
                orgEmail: admin.email,
                departments: []
            });
        }
        orgMap.get(admin.organizationId)!.departments.push(admin);
    });

    const devices = allDevices.length;
    const alerts = allDevices.filter(d => d.status === 'alerting').length;
    
    const orgDetails = Array.from(orgMap.entries()).map(([orgId, orgData]) => {
        const adminIdsInOrg = orgData.departments.map(a => a.id);
        const devicesInOrg = allDevices.filter(d => adminIdsInOrg.includes(d.adminId));
        return {
            id: orgId,
            name: orgData.orgName,
            email: orgData.orgEmail,
            admins: orgData.departments,
            devices: devicesInOrg,
        };
    }).sort((a,b) => a.name.localeCompare(b.name));

    return { 
      totalOrgs: orgMap.size,
      totalDepartments: admins.length,
      totalDevices: devices, 
      totalAlerts: alerts,
      orgsWithDetails: orgDetails
    };
  }, [admins, allDevices]);

  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
        const searchCorpus = `${admin.departmentName} ${admin.email} ${admin.building} ${admin.floor} ${admin.organizationName} ${admin.location}`.toLowerCase();
        const matchesSearch = searchCorpus.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [admins, searchTerm, statusFilter]);


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
  
  const handleAddOrganizationClick = () => {
    setCreateFormInitialValues({ organizationName: '' });
    setIsCreateDialogOpen(true);
  }

  const handleAddDepartmentClick = (org: {id: string, name: string, email: string}) => {
    setCreateFormInitialValues({ 
      organizationName: org.name,
      email: org.email,
      organizationId: org.id
    });
    setIsCreateDialogOpen(true);
  };
  
  const handleDeactivateClick = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsDeactivateDialogOpen(true);
  };

  const handleActivateClick = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsActivateDialogOpen(true);
  };

  const handleDeactivateConfirm = () => {
    if (selectedAdmin) {
      deactivateAdmin(selectedAdmin.id);
    }
    setIsDeactivateDialogOpen(false);
    setSelectedAdmin(null);
  }

  const handleActivateConfirm = () => {
    if (selectedAdmin) {
      activateAdmin(selectedAdmin.id);
    }
    setIsActivateDialogOpen(false);
    setSelectedAdmin(null);
  }

  const handleCreateFinished = () => {
    setIsCreateDialogOpen(false);
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
                  Managed organizations
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Registered Organizations</DialogTitle>
              <DialogDescription>
                Click an organization to see its registered departments.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-4">
              <Accordion type="single" collapsible>
                {orgsWithDetails.map((org) => (
                  <AccordionItem value={org.name} key={org.name}>
                    <AccordionTrigger className="text-lg font-semibold">{org.name} ({org.admins.length} departments)</AccordionTrigger>
                    <AccordionContent>
                      {org.admins.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Department</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Building</TableHead>
                              <TableHead>Floor</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {org.admins.map(admin => (
                              <TableRow key={admin.id}>
                                <TableCell>
                                  <div className="font-medium">{admin.departmentName}</div>
                                  <div className="text-xs text-muted-foreground font-mono">{admin.organizationName}</div>
                                </TableCell>
                                <TableCell>{admin.location}</TableCell>
                                <TableCell>{admin.building}</TableCell>
                                <TableCell>{admin.floor}</TableCell>
                                <TableCell className="text-center">
                                  {admin.status === 'active' ? (
                                    <Badge variant="outline" className="text-green-400 border-green-400/50"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"><XCircle className="mr-1 h-3 w-3"/>Inactive</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            <Users className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                                No departments registered for this organization.
                            </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </DialogContent>
        </Dialog>
          
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDepartments}</div>
                <p className="text-xs text-muted-foreground">
                  Across all organizations
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
             <DialogHeader>
              <DialogTitle>All Departments</DialogTitle>
              <DialogDescription>
                A complete list of all department accounts across all organizations.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto pr-4">
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {admins.map((admin) => (
                        <TableRow key={admin.id}>
                            <TableCell>
                               <div className="font-medium">{admin.organizationName}</div>
                               <div className="text-xs text-muted-foreground font-mono">{admin.email}</div>
                            </TableCell>
                             <TableCell>{admin.departmentName}</TableCell>
                            <TableCell>{admin.building}, Fl {admin.floor}</TableCell>
                            <TableCell className="text-center">
                               {admin.status === 'active' ? (
                                <Badge variant="outline" className="text-green-400 border-green-400/50"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>
                                ) : (
                                <Badge variant="destructive" className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"><XCircle className="mr-1 h-3 w-3"/>Inactive</Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
               </Table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <RadioTower className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDevices}</div>
                <p className="text-xs text-muted-foreground">
                  Aggregate devices across all organizations
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>All Registered Devices</DialogTitle>
              <DialogDescription>
                A complete list of all IoT devices across all organizations.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto pr-4">
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allDevices.map((device) => {
                       const admin = admins.find(a => a.id === device.adminId);
                       const statusInfo = getStatusInfo(device.status);
                       return (
                        <TableRow key={device.id}>
                            <TableCell>
                                <div className="font-medium">{device.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{device.id}</div>
                            </TableCell>
                            <TableCell>{admin?.departmentName || 'N/A'}</TableCell>
                            <TableCell>{admin?.organizationName || 'N/A'}</TableCell>
                            <TableCell className="text-center">
                                <Badge
                                  variant={statusInfo.variant as any}
                                  className={statusInfo.className}
                                >
                                  {statusInfo.icon}
                                  <span className="ml-1.5">{statusInfo.label}</span>
                                </Badge>
                            </TableCell>
                        </TableRow>
                       )
                    })}
                </TableBody>
               </Table>
            </div>
          </DialogContent>
        </Dialog>

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
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Organization Management</CardTitle>
                <CardDescription>
                  Create and manage department accounts for all organizations.
                </CardDescription>
              </div>
               <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAddOrganizationClick}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{createFormInitialValues.organizationId ? `Add Department to ${createFormInitialValues.organizationName}` : 'Create New Organization'}</DialogTitle>
                      <DialogDescription>
                         {createFormInitialValues.organizationId 
                            ? "Enter the details for the new department. It will be created under the existing organization."
                            : "Enter the details for the new organization and its first department."
                          }
                      </DialogDescription>
                    </DialogHeader>
                    <CreateAdminForm 
                        onFinished={handleCreateFinished} 
                        initialValues={createFormInitialValues}
                    />
                  </DialogContent>
                </Dialog>
          </div>
           <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by organization, department, location, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inactive">Inactive</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Organization Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Building/Floor</TableHead>
                <TableHead className="text-center">Subscription Plan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.organizationName}</TableCell>
                  <TableCell>{admin.departmentName}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{admin.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin.location}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin.building}, Fl {admin.floor}
                  </TableCell>
                   <TableCell className="text-center">
                    <Badge variant={planVariant(admin.plan)}>{admin.plan}</Badge>
                  </TableCell>
                   <TableCell className="text-center">
                    {admin.status === 'active' ? (
                      <Badge variant="outline" className="text-green-400 border-green-400/50"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>
                    ) : (
                       <Badge variant="destructive" className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"><XCircle className="mr-1 h-3 w-3"/>Inactive</Badge>
                    )}
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
                        <DropdownMenuItem onClick={() => handleAddDepartmentClick({id: admin.organizationId, name: admin.organizationName, email: admin.email })}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Add Department</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(admin)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Plan/Quota</span>
                        </DropdownMenuItem>
                         {admin.status === 'active' ? (
                            <DropdownMenuItem 
                                onClick={() => handleDeactivateClick(admin)} 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Power className="mr-2 h-4 w-4" />
                                <span>Deactivate</span>
                            </DropdownMenuItem>
                         ) : (
                            <DropdownMenuItem 
                                onClick={() => handleActivateClick(admin)} 
                                className="text-green-400 focus:text-green-400 focus:bg-green-400/10"
                            >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                <span>Activate</span>
                            </DropdownMenuItem>
                         )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
                 {filteredAdmins.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                            No departments found matching your criteria.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Department: {selectedAdmin?.departmentName}</DialogTitle>
            <DialogDescription>
              Update the plan and device allocation for this department.
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
      <ActivateAdminDialog
        isOpen={isActivateDialogOpen}
        onOpenChange={setIsActivateDialogOpen}
        admin={selectedAdmin}
        onConfirm={handleActivateConfirm}
      />
    </div>
  );
}

    