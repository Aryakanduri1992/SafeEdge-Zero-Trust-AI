"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Shield, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { WizardProvider } from '@/contexts/wizard-context';
import WizardContainer from '@/components/wizard/wizard-container';

export default function SuperAdminDashboard() {
  const { user, organizations, departments, createOrganization } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'basic',
    maxDevices: 50
  });

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await createOrganization(formData);
      toast({
        title: 'Success',
        description: 'Organization created successfully!',
      });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        plan: 'basic',
        maxDevices: 50
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create organization',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleWizardComplete = (organizationId: string) => {
    setIsWizardOpen(false);
    toast({
      title: 'Success!',
      description: 'Organization created successfully with complete setup!',
    });
    // Refresh the page or update organizations list
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">
              Active organizations in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Departments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Departments across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              Manage all organizations in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No organizations yet. Create your first organization to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {organizations.slice(0, 5).map((org: any) => (
                    <div key={org.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.email}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {org.plan || 'Basic'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Organization (Basic)
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                      Add a new organization to the system. They will be able to login and manage their devices.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrganization} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., TechCorp Industries"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@techcorp.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan">Plan</Label>
                      <Select
                        value={formData.plan}
                        onValueChange={(value) => setFormData({ ...formData, plan: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic (50 devices)</SelectItem>
                          <SelectItem value="pro">Pro (150 devices)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (500 devices)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxDevices">Max Devices</Label>
                      <Input
                        id="maxDevices"
                        type="number"
                        value={formData.maxDevices}
                        onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create Organization'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* Advanced Wizard Button */}
              <Button 
                className="w-full mt-2" 
                onClick={() => setIsWizardOpen(true)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Create Organization (Advanced Wizard)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Organizations
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                View All Users
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Security Settings
              </Button>
              <Link href="/superadmin-login" className="block">
                <Button variant="outline" className="w-full justify-start text-red-600">
                  Logout
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Wizard */}
      <WizardProvider>
        <WizardContainer
          open={isWizardOpen}
          onOpenChange={setIsWizardOpen}
          onComplete={handleWizardComplete}
        />
      </WizardProvider>
    </div>
  );
}
