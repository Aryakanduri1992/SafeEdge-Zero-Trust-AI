
"use client";

import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Globe, User, Building } from "lucide-react";
import { format } from "date-fns";
import type { Organization } from "@/lib/types";

type OrganizationProfileCardProps = {
  organization: Organization;
};

export function OrganizationProfileCard({ organization }: OrganizationProfileCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  }

  return (
    <Card>
        <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                    {organization.imageUrl ? (
                        <Image src={organization.imageUrl} alt={organization.organizationName} fill className="object-cover" />
                    ) : (
                    <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                        {getInitials(organization.organizationName)}
                    </AvatarFallback>
                    )}
                </Avatar>
            </div>
            <div className="text-center">
                <p className="text-xl font-semibold">{organization.organizationName}</p>
                <p className="text-sm text-muted-foreground">{organization.email}</p>
            </div>
            </div>
            <Separator />
            <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                    <p className="font-medium">Account Created</p>
                    <p className="text-muted-foreground">
                    {format(new Date(organization.createdAt), "MMMM d, yyyy")}
                    </p>
                </div>
                </div>
                <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                    <p className="font-medium">User Role</p>
                    <p className="text-muted-foreground capitalize">{organization.role}</p>
                </div>
                </div>
                 <div className="flex items-start gap-3">
                <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                    <p className="font-medium">Organization ID</p>
                    <p className="text-muted-foreground font-mono text-xs">{organization.id}</p>
                </div>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
