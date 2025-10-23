
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
import { CreateOrganizationForm } from '@/components/superadmin/create-organization-form';
import { EditDepartmentForm } from '@/components/superadmin/edit-department-form';
import { DeactivateDepartmentDialog } from '@/components/superadmin/deactivate-department-dialog';
import { PlusCircle, Users, Edit, Building, Power, CheckCircle, XCircle, MoreHorizontal, Search, Filter, ShieldCheck, UserPlus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Department } from '@/lib/types';
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
import { ActivateDepartmentDialog } from '@/components/superadmin/activate-department-dialog';
import { Input } from '@/components/ui/input';
import { CreateDepartmentForm } from '@/components/superadmin/create-department-form';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SuperAdminDashboardPage() {
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false);
  const [isCreateDeptDialogOpen, setIsCreateDeptDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const { user, departments, deactivateDepartment, activateDepartment } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");


  const { totalOrgs, totalDepartments, orgsWithDetails } = useMemo(() => {
    const orgMap = new Map<string, { orgName: string; orgEmail: string, departments: Department[] }>();

    departments.forEach(dept => {
        if (!dept.organizationId) return;
        if (!orgMap.has(dept.organizationId)) {
            orgMap.set(dept.organizationId, {
                orgName: dept.organizationName,
                orgEmail: dept.email,
                departments: []
            });
        }
        orgMap.get(dept.organizationId)!.departments.push(dept);
    });
    
    const orgDetails = Array.from(orgMap.entries()).map(([orgId, orgData]) => {
        const deptIdsInOrg = orgData.departments.map(d => d.id);
        return {
            id: orgId,
            name: orgData.orgName,
            email: orgData.orgEmail,
            departments: orgData.departments,
        };
    }).sort((a,b) => a.name.localeCompare(b.name));

    return { 
      totalOrgs: orgMap.size,
      totalDepartments: departments.length,
      orgsWithDetails: orgDetails
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
        const searchCorpus = `${dept.departmentName} ${dept.email} ${dept.building} ${dept.floor} ${dept.organizationName} ${dept.location}`.toLowerCase();
        const matchesSearch = searchCorpus.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, statusFilter]);


  const planVariant = (plan: Department['plan']) => {
    switch (plan) {
      case 'Pro':
        return 'default';
      case 'Enterprise':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  const handleAddOrganizationClick = () => {
    setIsCreateOrgDialogOpen(true);
  }
  
  const handleAddDepartmentClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsCreateDeptDialogOpen(true);
  };

  const handleEditClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditDialogOpen(true);
  };
  
  const handleDeactivateClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeactivateDialogOpen(true);
  };

  const handleActivateClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsActivateDialogOpen(true);
  };

  const handleDeactivateConfirm = () => {
    if (selectedDepartment) {
      deactivateDepartment(selectedDepartment.id);
    }
    setIsDeactivateDialogOpen(false);
    setSelectedDepartment(null);
  }

  const handleActivateConfirm = () => {
    if (selectedDepartment) {
      activateDepartment(selectedDepartment.id);
    }
    setIsActivateDialogOpen(false);
    setSelectedDepartment(null);
  }

  const handleCreateFinished = () => {
    setIsCreateOrgDialogOpen(false);
    setIsCreateDeptDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2">
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
            <ScrollArea className="max-h-[60vh]">
              <Accordion type="single" collapsible className="pr-4">
                {orgsWithDetails.map((org) => (
                  <AccordionItem value={org.name} key={org.name}>
                    <AccordionTrigger className="text-lg font-semibold">{org.name} ({org.departments.length} departments)</AccordionTrigger>
                    <AccordionContent>
                      {org.departments.length > 0 ? (
                        <div className="relative w-full overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Department</TableHead>
                                <TableHead className="hidden sm:table-cell">Location</TableHead>
                                <TableHead className="hidden md:table-cell">Building</TableHead>
                                <TableHead className="hidden md:table-cell">Floor</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {org.departments.map(dept => (
                                <TableRow key={dept.id}>
                                  <TableCell>
                                    <div className="font-medium">{dept.departmentName}</div>
                                    <div className="text-xs text-muted-foreground font-mono sm:hidden">{dept.location}</div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">{dept.location}</TableCell>
                                  <TableCell className="hidden md:table-cell">{dept.building}</TableCell>
                                  <TableCell className="hidden md:table-cell">{dept.floor}</TableCell>
                                  <TableCell className="text-center">
                                    {dept.status === 'active' ? (
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
            </ScrollArea>
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
            <ScrollArea className="max-h-[60vh]">
               <div className="relative w-full overflow-auto">
                 <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Organization</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="hidden sm:table-cell">Location</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {departments.map((dept) => (
                          <TableRow key={dept.id}>
                              <TableCell>
                                 <div className="font-medium">{dept.organizationName}</div>
                                 <div className="text-xs text-muted-foreground font-mono">{dept.email}</div>
                              </TableCell>
                               <TableCell>{dept.departmentName}</TableCell>
                              <TableCell className="hidden sm:table-cell">{dept.building}, Fl {dept.floor}</TableCell>
                              <TableCell className="text-center">
                                 {dept.status === 'active' ? (
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
            </ScrollArea>
          </DialogContent>
        </Dialog>
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
               <Dialog open={isCreateOrgDialogOpen} onOpenChange={setIsCreateOrgDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAddOrganizationClick}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Organization</DialogTitle>
                      <DialogDescription>
                         Enter the details for the new organization and its departments.
                      </DialogDescription>
                    </DialogHeader>
                    <CreateOrganizationForm 
                        onFinished={handleCreateFinished} 
                    />
                  </DialogContent>
                </Dialog>
          </div>
           <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by organization, department, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto shrink-0">
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
         <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Location</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Plan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div className="font-medium">{dept.organizationName}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{dept.departmentName}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{dept.departmentName}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono hidden lg:table-cell">{dept.email}</TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {dept.location}
                  </TableCell>
                   <TableCell className="text-center hidden lg:table-cell">
                    <Badge variant={planVariant(dept.plan)}>{dept.plan}</Badge>
                  </TableCell>
                   <TableCell className="text-center">
                    {dept.status === 'active' ? (
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
                        <DropdownMenuItem onClick={() => handleAddDepartmentClick(dept)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Add Department</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(dept)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Plan/Quota</span>
                        </DropdownMenuItem>
                         {dept.status === 'active' ? (
                            <DropdownMenuItem 
                                onClick={() => handleDeactivateClick(dept)} 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Power className="mr-2 h-4 w-4" />
                                <span>Deactivate</span>
                            </DropdownMenuItem>
                         ) : (
                            <DropdownMenuItem 
                                onClick={() => handleActivateClick(dept)} 
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
                 {filteredDepartments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                            No departments found matching your criteria.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateDeptDialogOpen} onOpenChange={setIsCreateDeptDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
                Create a new department for {selectedDepartment?.organizationName}.
            </DialogDescription>
          </DialogHeader>
          {selectedDepartment && <CreateDepartmentForm
              organization={selectedDepartment} 
              onFinished={handleCreateFinished} 
          />}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department: {selectedDepartment?.departmentName}</DialogTitle>
            <DialogDescription>
              Update the plan and device allocation for this department.
            </DialogDescription>
          </DialogHeader>
          {selectedDepartment && <EditDepartmentForm department={selectedDepartment} onFinished={() => setIsEditDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
      
      <DeactivateDepartmentDialog
        isOpen={isDeactivateDialogOpen}
        onOpenChange={setIsDeactivateDialogOpen}
        department={selectedDepartment}
        onConfirm={handleDeactivateConfirm}
      />
      <ActivateDepartmentDialog
        isOpen={isActivateDialogOpen}
        onOpenChange={setIsActivateDialogOpen}
        department={selectedDepartment}
        onConfirm={handleActivateConfirm}
      />
    </div>
  );
}
