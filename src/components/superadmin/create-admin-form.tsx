
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
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
  departments: z.array(departmentSchema).nonempty('You must add at least one department.'),
});

type CreateOrgFormProps = {
  onFinished: () => void;
};

export function CreateAdminForm({ onFinished }: CreateOrgFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createOrganization } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      password: '',
      departments: [{ departmentName: '', location: '', building: '', floor: '' }],
    },
    mode: 'onChange',
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "departments"
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      await createOrganization(values);
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
                        <Input placeholder="e.g., Blackshield-X Inc." {...field} />
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

                <hr className="my-4 border-dashed" />

                {fields.map((field, index) => (
                    <div key={field.id} className="space-y-4 rounded-md border p-4 relative">
                        <div className="flex justify-between items-center">
                            <h3 className="text-md font-medium">Department {index + 1}</h3>
                            {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>Remove</Button>
                            )}
                        </div>
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

                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ departmentName: '', location: '', building: '', floor: '' })}
                    >
                    Add Department
                </Button>
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
