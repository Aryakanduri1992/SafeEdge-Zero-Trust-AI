"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ArrowLeft, ArrowRight, Building2, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrganizationWizardData } from '@/hooks/use-organization-wizard';

const formSchema = z.object({
  totalFloors: z.coerce.number().min(1, { message: 'Must have at least 1 floor.' }).max(50, { message: 'Maximum 50 floors allowed.' }),
  buildingName: z.string().optional(),
  buildingAddress: z.string().optional(),
});

interface BuildingStructureSetupProps {
  data: Partial<OrganizationWizardData>;
  onUpdate: (data: Partial<OrganizationWizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed?: boolean;
}

export function BuildingStructureSetup({ data, onUpdate, onNext, onPrev, canProceed = true }: BuildingStructureSetupProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalFloors: data.totalFloors || 1,
      buildingName: data.buildingName || '',
      buildingAddress: data.buildingAddress || '',
    },
  });

  const totalFloors = form.watch('totalFloors');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Initialize floors array based on total floors
    const floors = Array.from({ length: values.totalFloors }, (_, index) => ({
      floorNumber: index + 1,
      floorName: `Floor ${index + 1}`,
      rooms: [],
    }));

    onUpdate({
      ...values,
      floors,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Building Structure</h3>
          <p className="text-sm text-muted-foreground">
            Define the basic structure of your building
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="totalFloors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Number of Floors *</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="1"
                    max="50"
                    placeholder="e.g., 3" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  How many floors does your building have? (1-50)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="buildingName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Building Name (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Main Office Building" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  A name to identify this building
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="buildingAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Building Address (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 123 Business Ave, City, State" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Physical address of the building
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Floor Preview */}
          {totalFloors > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Floor Structure Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your building will have {totalFloors} floor{totalFloors !== 1 ? 's' : ''}:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {Array.from({ length: Math.min(totalFloors, 12) }, (_, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">Floor {index + 1}</span>
                      </div>
                    ))}
                    {totalFloors > 12 && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <span className="text-sm text-muted-foreground">
                          ... and {totalFloors - 12} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button type="submit">
              Next: Configure Rooms
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}