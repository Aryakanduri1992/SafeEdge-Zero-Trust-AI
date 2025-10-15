import { SuperAdminLoginForm } from '@/components/auth/super-admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminLoginPage() {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div>
        <Shield className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">
          SafeEdge Cyber System
        </h1>
        <p className="text-muted-foreground">Super Admin Portal</p>
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Super Admin Login</CardTitle>
          <CardDescription>
            Elevated access. Please enter your credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuperAdminLoginForm />
        </CardContent>
      </Card>
       <Link href="/admin-login" className="text-sm text-muted-foreground transition-colors hover:text-primary">
        Are you an Admin?
      </Link>
    </div>
  );
}
