
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import type { Department, NewDepartmentData } from '@/lib/types';

const formSchema = z.object({
  departmentName: z.string().min(2, { message: 'Department Name is required.' }),
  location: z.string().min(2, { message: 'Location is required.' }),
  building: z.string().min(1, { message: 'Building is required.' }),
  floor: z.string().min(1, { message: 'Floor is required.' }),
  plan: z.enum(['Free', 'Pro', 'Enterprise']),
  devices: z.coerce.number().min(1, { message: 'Must have at least 1 device.' }),
});

type CreateDepartmentFormProps = {
  organization: Department; // We use a department to get org details
  onFinished: () => void;
};

export function CreateDepartmentForm({ organization, onFinished }: CreateDepartmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createDepartment } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentName: '',
      location: organization.location,
      building: organization.building,
      floor: '',
      plan: 'Free',
      devices: 10,
    },
    mode: 'onChange',
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const newDepartmentData: NewDepartmentData = {
        ...values,
        organizationName: organization.organizationName,
        email: organization.email, // The login email for the whole org
        organizationId: organization.organizationId,
      };
      await createDepartment(newDepartmentData);
      toast({
        title: 'Department Created',
        description: `Department "${values.departmentName}" has been successfully created for ${organization.organizationName}.`,
      });
      onFinished();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-6">
                <div className="space-y-4 rounded-md border p-4">
                    <FormField
                        control={form.control}
                        name="departmentName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Department Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Human Resources" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., New York" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="building"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Building</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Tower 1" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="floor"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Floor</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 14" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="plan"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Subscription Plan</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a plan" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Free">Free</SelectItem>
                                            <SelectItem value="Pro">Pro</SelectItem>
                                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="devices"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Device Quota</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 25" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            Create Department
          </Button>
        </div>
      </form>
    </Form>
  );
}
