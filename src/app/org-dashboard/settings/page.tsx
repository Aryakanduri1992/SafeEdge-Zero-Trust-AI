"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Loader2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';

export default function SettingsPage() {
  const [orgData, setOrgData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();

  // Fields that can only be edited by super admin
  const superAdminOnlyFields = [
    'name',
    'email',
    'plan',
    'maxDevices',
    'status'
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchOrgData(userData.organizationId);
    }
  }, []);

  const fetchOrgData = async (organizationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/org-data?organizationId=${organizationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setOrgData(data.organization);
      setFormData({
        email: data.organization?.email || '',
        contactPerson: data.organization?.contactPerson || '',
        phoneNumber: data.organization?.phoneNumber || '',
        address: data.organization?.address || '',
        city: data.organization?.city || '',
        state: data.organization?.state || '',
        zipCode: data.organization?.zipCode || ''
      });
      setIsEditing(false); // Reset editing mode after fetch
    } catch (error: any) {
      console.error('Error fetching org data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load organization data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const userData = JSON.parse(storedUser);
      
      const response = await fetch('/api/organizations/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: userData.organizationId,
          ...formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });

      // Refresh data
      fetchOrgData(userData.organizationId);
      setIsEditing(false); // Exit editing mode after save
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-200">Manage your organization settings and preferences</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Organization Profile */}
            <Card className="bg-white border-2 border-[#d3b78f]/30">
              <CardHeader className="bg-gradient-to-br from-[#f8f9fa] to-white">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-[#242d53]">Organization Profile</CardTitle>
                    <CardDescription className="text-gray-600">Update your organization information</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button 
                      className="bg-[#242d53] text-white hover:bg-[#1a2340] font-medium"
                      onClick={() => setIsEditing(true)}
                    >
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Read-only field - Super Admin Only */}
                  <div className="space-y-2">
                    <Label htmlFor="orgName" className="text-[#242d53] flex items-center gap-2 font-semibold">
                      Organization Name
                      <Lock className="w-3 h-3 text-gray-400" />
                    </Label>
                    <Input 
                      id="orgName" 
                      value={orgData?.name || ''} 
                      disabled
                      className="bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed font-medium"
                    />
                    <p className="text-xs text-gray-500 italic">Only super admin can edit this field</p>
                  </div>

                  {/* Email - Read-only field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#242d53] flex items-center gap-2 font-semibold">
                      Contact Email
                      <Lock className="w-3 h-3 text-gray-400" />
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed font-medium"
                    />
                    <p className="text-xs text-gray-500 italic">Only super admin can edit this field</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="text-[#242d53] font-semibold">Contact Person</Label>
                    <Input 
                      id="contactPerson" 
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing 
                        ? "bg-white border-2 border-[#d3b78f]/50 focus:border-[#d3b78f] text-[#242d53] font-medium" 
                        : "bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed font-medium"
                      }
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#242d53] font-semibold">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing 
                        ? "bg-white border-2 border-[#d3b78f]/50 focus:border-[#d3b78f] text-[#242d53] font-medium" 
                        : "bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed font-medium"
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[#242d53] font-semibold">Street Address</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className={isEditing 
                      ? "bg-white border-2 border-[#d3b78f]/50 focus:border-[#d3b78f] text-[#242d53] font-medium" 
                      : "bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed font-medium"
                    }
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-[#242d53] font-semibold">City</Label>
                    <Input 
                      id="city" 
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing 
                        ? "bg-white border-2 border-[#d3b78f]/50 focus:border-[#d3b78f] text-[#242d53] font-medium" 
                        : "bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed font-medium"
                      }
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-[#242d53] font-semibold">State</Label>
                    <Input 
                      id="state" 
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing 
                        ? "bg-white border-2 border-[#d3b78f]/50 focus:border-[#d3b78f] text-[#242d53] font-medium" 
                        : "bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed font-medium"
                      }
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-[#242d53] font-semibold">ZIP Code</Label>
                    <Input 
                      id="zipCode" 
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing 
                        ? "bg-white border-2 border-[#d3b78f]/50 focus:border-[#d3b78f] text-[#242d53] font-medium" 
                        : "bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed font-medium"
                      }
                      placeholder="10001"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      className="border-2 border-[#242d53] text-[#242d53] hover:bg-[#242d53] hover:text-white font-medium"
                      onClick={() => {
                        fetchOrgData(orgData.id);
                        setIsEditing(false);
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876] font-semibold px-6"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Information - Read Only */}
            <Card className="bg-white border-2 border-[#d3b78f]/30">
              <CardHeader className="bg-gradient-to-br from-[#f8f9fa] to-white">
                <CardTitle className="text-[#242d53] flex items-center gap-2">
                  Plan & Billing
                  <Lock className="w-4 h-4 text-gray-400" />
                </CardTitle>
                <CardDescription className="text-gray-600">Your current subscription plan (managed by super admin)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-br from-[#f8f9fa] to-white rounded-lg border-2 border-[#d3b78f]/30">
                    <div>
                      <h4 className="font-bold text-[#242d53] text-lg">{orgData?.plan?.toUpperCase()} Plan</h4>
                      <p className="text-sm text-gray-600 mt-1">Maximum {orgData?.maxDevices} devices allowed</p>
                      <p className="text-xs text-gray-500 mt-1">Contact super admin to upgrade your plan</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#d3b78f]">{orgData?.maxDevices}</div>
                      <div className="text-xs text-gray-600">Max Devices</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-white border-2 border-[#d3b78f]/30">
              <CardHeader className="bg-gradient-to-br from-[#f8f9fa] to-white">
                <CardTitle className="text-[#242d53]">Preferences</CardTitle>
                <CardDescription className="text-gray-600">Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#f8f9fa] to-white rounded-lg border-2 border-[#d3b78f]/30 hover:border-[#d3b78f] transition-all">
                    <div>
                      <h4 className="font-semibold text-[#242d53]">Email Notifications</h4>
                      <p className="text-sm text-gray-600 mt-1">Receive email alerts for important events</p>
                    </div>
                    <Button className="bg-[#242d53] text-white hover:bg-[#1a2340]">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#f8f9fa] to-white rounded-lg border-2 border-[#d3b78f]/30 hover:border-[#d3b78f] transition-all">
                    <div>
                      <h4 className="font-semibold text-[#242d53]">Security Alerts</h4>
                      <p className="text-sm text-gray-600 mt-1">Get notified about security events</p>
                    </div>
                    <Button className="bg-[#242d53] text-white hover:bg-[#1a2340]">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}
