"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Building, Users, Home, Package, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { OrganizationWizardData } from '@/hooks/use-organization-wizard';

interface OrganizationReviewProps {
  data: Partial<OrganizationWizardData>;
  onComplete: () => void;
  onPrev: () => void;
  isLoading: boolean;
  canProceed?: boolean;
}

export function OrganizationReview({ data, onComplete, onPrev, isLoading, canProceed = true }: OrganizationReviewProps) {
  const getTotalRooms = () => {
    return data.floors?.reduce((total, floor) => total + floor.rooms.length, 0) || 0;
  };

  const getTotalArea = () => {
    return data.floors?.reduce((total, floor) => 
      total + floor.rooms.reduce((floorTotal, room) => 
        floorTotal + (room.width * room.height), 0
      ), 0
    ) || 0;
  };

  const getRoomsByType = () => {
    const roomTypes: { [key: string]: number } = {};
    data.floors?.forEach(floor => {
      floor.rooms.forEach(room => {
        const type = room.type || 'Other';
        roomTypes[type] = (roomTypes[type] || 0) + 1;
      });
    });
    return roomTypes;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Check className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Review & Create Organization</h3>
          <p className="text-sm text-muted-foreground">
            Please review all details before creating the organization
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                <p className="font-semibold">{data.organizationName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Admin Email</label>
                <p className="font-mono text-sm">{data.email}</p>
              </div>
            </div>
            {data.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{data.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Building Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Building Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{data.totalFloors}</div>
                <div className="text-sm text-muted-foreground">Floors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{getTotalRooms()}</div>
                <div className="text-sm text-muted-foreground">Total Rooms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{getTotalArea()}</div>
                <div className="text-sm text-muted-foreground">Total Area (sq ft)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Object.keys(getRoomsByType()).length}
                </div>
                <div className="text-sm text-muted-foreground">Room Types</div>
              </div>
            </div>

            {data.buildingName && (
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground">Building Name</label>
                <p>{data.buildingName}</p>
              </div>
            )}

            {/* Floor Summary */}
            <div className="space-y-3">
              <h4 className="font-medium">Floor Summary</h4>
              <div className="grid gap-2">
                {data.floors?.map((floor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Floor {floor.floorNumber}</Badge>
                      <span className="text-sm">{floor.floorName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{floor.rooms.length} rooms</span>
                      <span>
                        {floor.rooms.reduce((total, room) => total + (room.width * room.height), 0)} sq ft
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Types Summary */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Room Types</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(getRoomsByType()).map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Initial Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department Name</label>
                <p className="font-semibold">{data.departmentName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p>{data.location}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Subscription Plan</label>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <Badge variant={data.plan === 'Enterprise' ? 'default' : data.plan === 'Pro' ? 'secondary' : 'outline'}>
                    {data.plan}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Device Quota</label>
                <p className="font-semibold">{data.devices} devices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Will Be Created */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">What will be created?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Organization account with admin login credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Complete floor plan with {data.totalFloors} floors and {getTotalRooms()} rooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Initial department "{data.departmentName}" with {data.devices} device quota</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Automatic floor plan approval for immediate use</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Ready-to-use system for device registration and management</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrev} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={onComplete} disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Organization...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Create Organization
            </>
          )}
        </Button>
      </div>
    </div>
  );
}