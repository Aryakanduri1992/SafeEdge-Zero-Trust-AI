"use client";

import React, { useState } from 'react';
import { useWizard } from '@/contexts/wizard-context';
import { Department } from '@/lib/validations/organization-wizard';
import { generateId, validateDeviceAllocation } from '@/lib/wizard-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DepartmentManagementStep() {
  const { state, setDepartments, completeStep, nextStep } = useWizard();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    description: '',
    headOfDepartment: '',
    email: '',
    phoneNumber: '',
    budget: 0,
    maxDevices: 0,
  });

  const orgMaxDevices = state.organizationData.maxDevices || 50;
  const validation = validateDeviceAllocation(state.departments, orgMaxDevices);

  const handleAddDepartment = () => {
    if (!formData.name || !formData.headOfDepartment || !formData.email || !formData.phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    const newDept: Department = {
      id: editingDept?.id || generateId(),
      name: formData.name!,
      description: formData.description || '',
      headOfDepartment: formData.headOfDepartment!,
      email: formData.email!,
      phoneNumber: formData.phoneNumber!,
      budget: formData.budget || 0,
      maxDevices: formData.maxDevices || 0,
    };

    if (editingDept) {
      setDepartments(state.departments.map(d => d.id === editingDept.id ? newDept : d));
    } else {
      setDepartments([...state.departments, newDept]);
    }

    setFormData({
      name: '',
      description: '',
      headOfDepartment: '',
      email: '',
      phoneNumber: '',
      budget: 0,
      maxDevices: 0,
    });
    setEditingDept(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData(dept);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      setDepartments(state.departments.filter(d => d.id !== id));
    }
  };

  const handleContinue = () => {
    if (state.departments.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one department',
      });
      return;
    }

    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: validation.message,
      });
      return;
    }

    completeStep(2);
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Device Allocation Summary</CardTitle>
          <CardDescription>Track device allocation across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{validation.totalAllocated}</p>
              <p className="text-sm text-muted-foreground">Allocated</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{orgMaxDevices}</p>
              <p className="text-sm text-muted-foreground">Total Limit</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${validation.remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {validation.remaining}
              </p>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
          </div>
          {!validation.valid && (
            <p className="text-sm text-red-500 mt-4 text-center">{validation.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Departments List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Departments ({state.departments.length})</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingDept(null); setFormData({}); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Department Name *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Department description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Head of Department *</Label>
                  <Input
                    value={formData.headOfDepartment || ''}
                    onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phoneNumber || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Input
                    type="number"
                    value={formData.budget || 0}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Devices</Label>
                  <Input
                    type="number"
                    value={formData.maxDevices || 0}
                    onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <Button onClick={handleAddDepartment} className="w-full">
                  {editingDept ? 'Update Department' : 'Add Department'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {state.departments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No departments added yet. Click "Add Department" to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {state.departments.map((dept) => (
              <Card key={dept.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{dept.name}</h4>
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Head:</span> {dept.headOfDepartment}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span> {dept.email}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span> {dept.phoneNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max Devices:</span> {dept.maxDevices}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(dept)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(dept.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!validation.valid || state.departments.length === 0}>
          Continue to Floor Plans
        </Button>
      </div>
    </div>
  );
}
