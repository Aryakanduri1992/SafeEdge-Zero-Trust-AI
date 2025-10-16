
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const departmentSchema = z.object({
  departmentName: z.string().min(2, { message: 'Department Name must be at least 2 characters.' }),
  location: z.string().min(2, { message: 'Location is required.' }),
  building: z.string().min(1, { message: 'Building is required.' }),
  floor: z.string().min(1, { message: 'Floor is required.' }),
});

const formSchema = z.object({
  organizationName: z.string().min(2, { message: 'Organization Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  numberOfDepartments: z.coerce.number().min(1, 'You must add at least one department.').max(10, 'You can add a maximum of 10 departments at once.'),
  departments: z.array(departmentSchema).nonempty('You must add at least one department.'),
});

type CreateAdminFormProps = {
  onFinished: () => void;
};

export function CreateAdminForm({ onFinished }: CreateAdminFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createAdmin } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      password: '',
      numberOfDepartments: 1,
      departments: [{ departmentName: '', location: '', building: '', floor: '' }],
    },
    mode: 'onChange',
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "departments"
  });

  const numberOfDepartments = form.watch('numberOfDepartments');

  const handleDepartmentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10) || 0;
    const clampedCount = Math.max(1, Math.min(10, count));
    form.setValue('numberOfDepartments', clampedCount);

    const currentCount = fields.length;
    if (clampedCount > currentCount) {
      for (let i = 0; i < clampedCount - currentCount; i++) {
        append({ departmentName: '', location: '', building: '', floor: '' });
      }
    } else if (clampedCount < currentCount) {
      for (let i = 0; i < currentCount - clampedCount; i++) {
        remove(currentCount - 1 - i);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      await createAdmin(values);
      toast({
        title: 'Organization Created',
        description: `Organization "${values.organizationName}" and its departments have been successfully created.`,
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
            <div className="space-y-4">
                <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., AuthStation Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Organization Login Email</FormLabel>
                    <FormControl>
                        <Input placeholder="contact@organization.com" {...field} />
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
                        <Input type="password" placeholder="Enter a strong password" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="numberOfDepartments"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Number of Departments</FormLabel>
                    <FormControl>
                        <Input type="number" min="1" max="10" {...field} onChange={handleDepartmentCountChange} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <hr className="my-4 border-dashed" />

                {fields.map((field, index) => (
                    <div key={field.id} className="space-y-4 rounded-md border p-4">
                        <h3 className="text-md font-medium">Department {index + 1}</h3>
                        <FormField
                        control={form.control}
                        name={`departments.${index}.departmentName`}
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
                        <FormField
                        control={form.control}
                        name={`departments.${index}.location`}
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
                        name={`departments.${index}.building`}
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
                        name={`departments.${index}.floor`}
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
                    </div>
                ))}
            </div>
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Create Organization
          </Button>
        </div>
      </form>
    </Form>
  );
}
