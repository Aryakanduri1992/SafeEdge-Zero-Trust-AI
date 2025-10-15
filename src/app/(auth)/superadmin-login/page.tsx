import { SuperAdminLoginForm } from '@/components/auth/super-admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
       <div className="flex flex-col items-center gap-2">
        <Shield className="h-12 w-12 text-primary" />
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          SafeEdge Cyber System
        </h1>
        <p className="text-muted-foreground">Super Admin Portal</p>
      </div>
      <Card className="w-full max-w-sm border-primary/20 bg-card/60 shadow-xl backdrop-blur-sm">
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
       <Link href="/admin-login" className="text-sm text-primary transition-colors hover:text-primary/80">
        Are you an Admin?
      </Link>
    </div>
  );
}
