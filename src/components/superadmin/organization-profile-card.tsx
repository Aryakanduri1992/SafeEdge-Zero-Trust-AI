
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Globe, User, Building, Edit } from "lucide-react";
import { format } from "date-fns";
import type { Organization } from "@/lib/types";
import { Button } from '../ui/button';
import { ImageSelectorDialog } from './image-selector-dialog';

type OrganizationProfileCardProps = {
  organization: Organization;
};

export function OrganizationProfileCard({ organization }: OrganizationProfileCardProps) {
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <>
      <Card>
          <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                      <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
                          {organization.imageUrl ? (
                              <AvatarImage src={organization.imageUrl} alt={organization.organizationName} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                              {getInitials(organization.organizationName)}
                          </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsImageSelectorOpen(true)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Change Image</span>
                      </Button>
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
      <ImageSelectorDialog
        isOpen={isImageSelectorOpen}
        onOpenChange={setIsImageSelectorOpen}
      />
    </>
  );
}
