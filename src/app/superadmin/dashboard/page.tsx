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
import { PlusCircle, Users, Edit } from 'lucide-react';
import { useState } from 'react';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}. Manage your platform admins here.</p>
        </div>
         <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hidden sm:flex">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>
                  Enter the details for the new admin account. An email will not be sent; you must share the credentials securely.
                </DialogDescription>
              </DialogHeader>
              <CreateAdminForm onFinished={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently active administrators
              </p>
            </CardContent>
          </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
            <CardTitle>
              Admin Management
            </CardTitle>
            <CardDescription>
              Create and manage administrator accounts for SafeEdge.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="sm:hidden mb-4">
             <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Admin</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new admin account. An email will not be sent; you must share the credentials securely.
                  </DialogDescription>
                </DialogHeader>
                <CreateAdminForm onFinished={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Date Joined</TableHead>
                <TableHead className="text-center">Plan</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <div>{admin.name}</div>
                    <div className="text-muted-foreground md:hidden text-xs">{admin.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{admin.email}</TableCell>
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
                          <span>Edit</span>
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
