import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div>
        <Shield className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-5xl font-bold tracking-tight text-primary">
          SafeEdge Cyber System
        </h1>
        <p className="text-muted-foreground">Admin Portal</p>
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
      <Link href="/superadmin-login" className="text-sm text-muted-foreground transition-colors hover:text-primary">
        Are you a Super Admin?
      </Link>
    </div>
  );
}
