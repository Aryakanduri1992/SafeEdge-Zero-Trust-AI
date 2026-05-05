"use client";

import React, { useState } from 'react';
import { useWizard } from '@/contexts/wizard-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Layers, LayoutGrid, Cpu, CheckCircle2 } from 'lucide-react';

interface ReviewConfirmationStepProps {
  onComplete: (organizationId: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

export default function ReviewConfirmationStep({
  onComplete,
  isSubmitting,
  setIsSubmitting,
}: ReviewConfirmationStepProps) {
  const { state, resetWizard } = useWizard();
  const { toast } = useToast();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const totalRooms = state.floors.reduce((sum, floor) => sum + floor.rooms.length, 0);
  const totalArea = state.floors.reduce((sum, floor) => sum + floor.totalArea, 0);

  // Debug: Log the state
  console.log('Review Step - Current State:', {
    organization: state.organizationData,
    departments: state.departments.length,
    floors: state.floors.length,
    devices: state.devices.length,
  });

  const handleSubmit = async () => {
    if (!termsAccepted) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please accept the terms and conditions',
      });
      return;
    }

    // Validate required fields before submission
    const missingFields: string[] = [];
    
    if (!state.organizationData.name) missingFields.push('Organization Name');
    if (!state.organizationData.email) missingFields.push('Email');
    if (!state.organizationData.password) missingFields.push('Password');
    if (!state.organizationData.contactPerson) missingFields.push('Contact Person');
    if (!state.organizationData.phoneNumber) missingFields.push('Phone Number');
    if (!state.organizationData.address) missingFields.push('Address');
    if (!state.organizationData.city) missingFields.push('City');
    if (!state.organizationData.state) missingFields.push('State');
    if (!state.organizationData.zipCode) missingFields.push('Zip Code');
    if (!state.organizationData.country) missingFields.push('Country');

    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: `Please go back to Step 1 and fill in: ${missingFields.join(', ')}`,
      });
      return;
    }

    if (state.departments.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Departments',
        description: 'Please go back to Step 2 and add at least one department',
      });
      return;
    }

    if (state.floors.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Floors',
        description: 'Please go back to Step 3 and add at least one floor',
      });
      return;
    }

    const totalRooms = state.floors.reduce((sum, f) => sum + f.rooms.length, 0);
    if (totalRooms === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Rooms',
        description: 'Please go back to Step 4 and add at least one room',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        organization: state.organizationData,
        departments: state.departments,
        floors: state.floors,
        devices: state.devices,
      };

      console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('/api/superadmin/organizations/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create organization');
      }

      toast({
        title: 'Success!',
        description: `Organization "${state.organizationData.name}" created successfully!`,
      });

      resetWizard();
      onComplete(data.organizationId);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      
      let errorMessage = 'Failed to create organization';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.organizationData.name}</div>
            <p className="text-xs text-muted-foreground">{state.organizationData.plan} Plan</p>
            <p className="text-xs text-muted-foreground">Max {state.organizationData.maxDevices} devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.departments.length}</div>
            <p className="text-xs text-muted-foreground">
              {state.departments.reduce((sum, d) => sum + d.maxDevices, 0)} devices allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Infrastructure</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.floors.length} Floors</div>
            <p className="text-xs text-muted-foreground">{totalRooms} rooms</p>
            <p className="text-xs text-muted-foreground">{totalArea.toLocaleString()} sq ft</p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span> {state.organizationData.name || <span className="text-red-500">Missing</span>}
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span> {state.organizationData.email || <span className="text-red-500">Missing</span>}
          </div>
          <div>
            <span className="text-muted-foreground">Contact:</span> {state.organizationData.contactPerson || <span className="text-red-500">Missing</span>}
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span> {state.organizationData.phoneNumber || <span className="text-red-500">Missing</span>}
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground">Address:</span> {state.organizationData.address ? `${state.organizationData.address}, ${state.organizationData.city}, ${state.organizationData.state} ${state.organizationData.zipCode}` : <span className="text-red-500">Missing</span>}
          </div>
        </CardContent>
      </Card>

      {/* Departments */}
      <Card>
        <CardHeader>
          <CardTitle>Departments ({state.departments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {state.departments.map(dept => (
              <div key={dept.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-medium">{dept.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {dept.headOfDepartment} • {dept.email}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {dept.maxDevices} devices
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Floors */}
      <Card>
        <CardHeader>
          <CardTitle>Floor Plans ({state.floors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.floors.map(floor => (
              <div key={floor.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">Floor {floor.floorNumber}: {floor.floorName}</div>
                    <div className="text-sm text-muted-foreground">
                      {floor.totalArea} sq ft • {floor.rooms.length} rooms
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {floor.rooms.map(room => (
                    <div key={room.id} className="text-xs p-2 bg-muted rounded">
                      {room.identifier} - {room.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Devices ({state.devices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {state.devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No devices configured</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {state.devices.map(device => (
                <div key={device.id} className="text-sm p-2 border rounded">
                  <div className="font-medium">{device.name}</div>
                  <div className="text-xs text-muted-foreground">{device.type}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms and Submit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I confirm that all information is correct and I accept the terms and conditions
            </Label>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!termsAccepted || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>Creating Organization...</>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Create Organization
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
