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
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function SuperAdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'super@blackshield-x.com',
      password: 'super-password',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await login(values, 'superadmin');
      toast({
        title: 'Login Successful',
        description: 'Welcome, Super Admin!',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Email</FormLabel>
              <FormControl>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="super@example.com" {...field} className="pl-10 bg-[#1a2340] border-[#3a4570] text-white placeholder:text-gray-400 focus:border-[#d3b78f] focus:ring-[#d3b78f]" />
                </div>
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
              <FormLabel className="sr-only">Password</FormLabel>
              <FormControl>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type="password" placeholder="••••••••" {...field} className="pl-10 bg-[#1a2340] border-[#3a4570] text-white placeholder:text-gray-400 focus:border-[#d3b78f] focus:ring-[#d3b78f]" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-[#3a4570] hover:bg-[#4a5580] text-white font-semibold shadow-lg border-2 border-[#d3b78f] focus-visible:ring-[#d3b78f] focus-visible:ring-offset-0" disabled={isLoading} variant="default">
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" /> Super Admin Login
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
