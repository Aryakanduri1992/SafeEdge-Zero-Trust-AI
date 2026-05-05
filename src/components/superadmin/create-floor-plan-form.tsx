"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Building2, 
  Plus, 
  Minus, 
  Home,
  AlertCircle
} from 'lucide-react';
import { floorPlanService } from '@/lib/floor-plan-service';
import { FloorPlanData, RoomSize } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Room schema
const roomSchema = z.object({
  name: z.string().min(1, { message: 'Room name is required' }).trim(),
  identifier: z.string().min(1, { message: 'Room identifier is required' }).trim(),
  size: z.object({
    width: z.coerce.number().positive().optional(),
    height: z.coerce.number().positive().optional(),
    area: z.coerce.number().positive().optional(),
    unit: z.enum(['sqft', 'sqm', 'custom']).default('sqft')
  }).optional()
});

// Floor schema
const floorSchema = z.object({
  floorNumber: z.coerce.number().min(1, { message: 'Floor number must be at least 1' }),
  totalRooms: z.coerce.number().min(1, { message: 'Must have at least 1 room' }),
  rooms: z.array(roomSchema).min(1, { message: 'At least one room is required' })
});

// Main form schema
const formSchema = z.object({
  organizationId: z.string().min(1, { message: 'Organization is required' }),
  totalFloors: z.coerce.number().min(1, { message: 'Must have at least 1 floor' }),
  floors: z.array(floorSchema).min(1, { message: 'At least one floor is required' })
}).refine((data) => data.floors.length === data.totalFloors, {
  message: 'Number of floors must match total floors',
  path: ['totalFloors']
}).refine((data) => {
  // Check floor number uniqueness
  const floorNumbers = data.floors.map(f => f.floorNumber);
  const uniqueNumbers = new Set(floorNumbers);
  return uniqueNumbers.size === floorNumbers.length;
}, {
  message: 'Floor numbers must be unique',
  path: ['floors']
}).refine((data) => {
  // Check room identifier uniqueness within each floor
  for (const floor of data.floors) {
    const roomIds = floor.rooms.map(r => r.identifier);
    const uniqueIds = new Set(roomIds);
    if (uniqueIds.size !== roomIds.length) {
      return false;
    }
  }
  return true;
}, {
  message: 'Room identifiers must be unique within each floor',
  path: ['floors']
}).refine((data) => {
  // Check that each floor has the correct number of rooms
  for (const floor of data.floors) {
    if (floor.rooms.length !== floor.totalRooms) {
      return false;
    }
  }
  return true;
}, {
  message: 'Number of rooms must match total rooms for each floor',
  path: ['floors']
});

type CreateFloorPlanFormProps = {
  onFinished: () => void;
};

export function CreateFloorPlanForm({ onFinished }: CreateFloorPlanFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { organizations } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: '',
      totalFloors: 1,
      floors: [
        {
          floorNumber: 1,
          totalRooms: 1,
          rooms: [
            {
              name: '',
              identifier: '',
              size: {
                unit: 'sqft'
              }
            }
          ]
        }
      ]
    },
    mode: 'onChange',
  });

  const { fields: floorFields, append: appendFloor, remove: removeFloor } = useFieldArray({
    control: form.control,
    name: 'floors'
  });

  const watchedTotalFloors = form.watch('totalFloors');
  const watchedFloors = form.watch('floors');

  // Auto-adjust floors when totalFloors changes
  const handleTotalFloorsChange = (value: number) => {
    const currentFloors = form.getValues('floors');
    
    if (value > currentFloors.length) {
      // Add new floors
      for (let i = currentFloors.length; i < value; i++) {
        appendFloor({
          floorNumber: i + 1,
          totalRooms: 1,
          rooms: [
            {
              name: '',
              identifier: '',
              size: { unit: 'sqft' }
            }
          ]
        });
      }
    } else if (value < currentFloors.length) {
      // Remove excess floors
      for (let i = currentFloors.length - 1; i >= value; i--) {
        removeFloor(i);
      }
    }
  };

  // Auto-adjust rooms when totalRooms changes for a floor
  const handleTotalRoomsChange = (floorIndex: number, value: number) => {
    const currentRooms = form.getValues(`floors.${floorIndex}.rooms`);
    
    if (value > currentRooms.length) {
      // Add new rooms
      const newRooms = [...currentRooms];
      for (let i = currentRooms.length; i < value; i++) {
        newRooms.push({
          name: '',
          identifier: '',
          size: { unit: 'sqft' }
        });
      }
      form.setValue(`floors.${floorIndex}.rooms`, newRooms);
    } else if (value < currentRooms.length) {
      // Remove excess rooms
      const newRooms = currentRooms.slice(0, value);
      form.setValue(`floors.${floorIndex}.rooms`, newRooms);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setValidationErrors([]);
    
    try {
      // Transform form data to match FloorPlanData interface
      const floorPlanData: FloorPlanData = {
        organizationId: values.organizationId,
        totalFloors: values.totalFloors,
        floors: values.floors.map(floor => ({
          floorNumber: floor.floorNumber,
          totalRooms: floor.totalRooms,
          rooms: floor.rooms.map(room => ({
            ...room,
            floorId: '', // Will be set by the service
            id: '', // Will be set by the service
            deviceIds: [], // Initialize empty
            position: {
              x: 0,
              y: 0,
              width: 100,
              height: 100
            }
          }))
        }))
      };

      await floorPlanService.createFloorPlan(floorPlanData);
      
      const orgName = organizations.find(org => org.id === values.organizationId)?.organizationName;
      toast({
        title: 'Floor Plan Created',
        description: `Floor plan for ${orgName} has been created successfully and is pending approval.`,
      });
      onFinished();
    } catch (error: any) {
      console.error('Floor plan creation error:', error);
      
      if (error.message.includes('Validation failed:')) {
        const errorMessage = error.message.replace('Validation failed: ', '');
        const errors = errorMessage.split(', ');
        setValidationErrors(errors);
      } else {
        toast({
          variant: 'destructive',
          title: 'Creation Failed',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[70vh] pr-6">
          <div className="space-y-6">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Organization Selection */}
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <h3 className="text-lg font-medium text-primary">Organization</h3>
                <p className="text-sm text-muted-foreground">Select the organization for this floor plan.</p>
              </div>
              
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an organization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.organizationName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Building Structure */}
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <h3 className="text-lg font-medium text-primary">Building Structure</h3>
                <p className="text-sm text-muted-foreground">Define the overall building layout.</p>
              </div>
              
              <FormField
                control={form.control}
                name="totalFloors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Floors</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="e.g., 3" 
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          field.onChange(value);
                          handleTotalFloorsChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Floor Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary">Floor Details</h3>
                <p className="text-sm text-muted-foreground">Configure each floor and its rooms.</p>
              </div>

              {floorFields.map((floorField, floorIndex) => (
                <Card key={floorField.id} className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Floor {watchedFloors[floorIndex]?.floorNumber || floorIndex + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`floors.${floorIndex}.floorNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor Number</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                placeholder="e.g., 1" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`floors.${floorIndex}.totalRooms`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Rooms</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                placeholder="e.g., 5" 
                                {...field}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  field.onChange(value);
                                  handleTotalRoomsChange(floorIndex, value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Rooms */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span className="font-medium">Rooms</span>
                        <Badge variant="secondary">
                          {watchedFloors[floorIndex]?.rooms?.length || 0} rooms
                        </Badge>
                      </div>
                      
                      <div className="grid gap-3">
                        {watchedFloors[floorIndex]?.rooms?.map((room, roomIndex) => (
                          <div key={roomIndex} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 border rounded-lg bg-muted/30">
                            <FormField
                              control={form.control}
                              name={`floors.${floorIndex}.rooms.${roomIndex}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Room Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g., Conference Room A" 
                                      {...field}
                                      className="h-8"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`floors.${floorIndex}.rooms.${roomIndex}.identifier`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Room ID</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g., CR-A1" 
                                      {...field}
                                      className="h-8"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`floors.${floorIndex}.rooms.${roomIndex}.size.area`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Area (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      placeholder="e.g., 150" 
                                      {...field}
                                      className="h-8"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`floors.${floorIndex}.rooms.${roomIndex}.size.unit`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Unit</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="sqft">sq ft</SelectItem>
                                      <SelectItem value="sqm">sq m</SelectItem>
                                      <SelectItem value="custom">custom</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="mr-2 h-4 w-4" />
            )}
            Create Floor Plan
          </Button>
        </div>
      </form>
    </Form>
  );
}