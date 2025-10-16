
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import { AdminUser } from '@/lib/types';

const formSchema = z.object({
  departmentName: z.string().min(2, { message: 'Department Name must be at least 2 characters.' }),
  organizationName: z.string().min(2, { message: 'Organization Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  building: z.string().min(1, { message: 'Building is required.' }),
  floor: z.string().min(1, { message: 'Floor is required.' }),
  location: z.string().min(2, { message: 'Location is required.' }),
});

type CreateAdminFormProps = {
  onFinished: () => void;
  initialValues: {
    organizationName: string;
    email?: string;
    organizationId?: string;
  };
};

export function CreateAdminForm({ onFinished, initialValues }: CreateAdminFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createAdmin } = useAuth();
  const { toast } = useToast();

  const isAddingDepartment = !!initialValues.organizationId;
  
  // Dynamically adjust validation schema based on whether we're adding a department or creating a new org
  const currentSchema = isAddingDepartment
    ? formSchema.omit({ password: true, email: true, organizationName: true })
    : formSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      departmentName: '',
      organizationName: initialValues.organizationName || '',
      email: initialValues.email || '',
      password: '',
      building: '',
      floor: '',
      location: '',
    },
  });

  // Reset form when initial values change
  useEffect(() => {
    form.reset({
      departmentName: '',
      organizationName: initialValues.organizationName || '',
      email: initialValues.email || '',
      password: '', // Always clear password for security
      building: '',
      floor: '',
      location: '',
    });
  }, [initialValues, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const finalValues = {
      ...values,
      password: values.password || '', // ensure password is not undefined
      organizationId: initialValues.organizationId,
      email: initialValues.email || values.email, // Use initial email if available
      organizationName: initialValues.organizationName || values.organizationName,
    };
    
    try {
      await createAdmin(finalValues);
      toast({
        title: isAddingDepartment ? 'Department Created' : 'Organization Created',
        description: `Department ${values.departmentName} has been created.`,
      });
      // Reset only department-specific fields after successful submission
      form.reset({
        ...form.getValues(),
        departmentName: '',
        building: '',
        floor: '',
        location: '',
        password: '',
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
        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., AuthStation Inc." {...field} disabled={isAddingDepartment}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="departmentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Security Operations" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isAddingDepartment && (
            <>
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Organization Email</FormLabel>
                    <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="Generate or enter a strong password" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </>
        )}
         <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New York Office" {...field} />
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
                <Input placeholder="e.g., Tower A" {...field} />
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
                <Input placeholder="e.g., 42nd" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {isAddingDepartment ? "Add Department" : "Create Organization"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    