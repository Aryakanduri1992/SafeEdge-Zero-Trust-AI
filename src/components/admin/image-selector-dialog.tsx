
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Organization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


type ImageSelectorDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    currentImageUrl?: string | null;
};

export function ImageSelectorDialog({ isOpen, onOpenChange, currentImageUrl }: ImageSelectorDialogProps) {
    const { user, updateOrganizationImage } = useAuth();
    const orgUser = user as Organization;
    const { toast } = useToast();
    const [selectedImage, setSelectedImage] = useState(currentImageUrl || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!orgUser || !selectedImage) return;

        setIsLoading(true);
        try {
            await updateOrganizationImage(orgUser.id, selectedImage);
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || "Could not update the profile image.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Change Organization Image</DialogTitle>
                    <DialogDescription>
                        Select a new image for your organization's profile.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
                        {PlaceHolderImages.map((image) => (
                            <div
                                key={image.id}
                                className="relative aspect-square cursor-pointer group rounded-lg overflow-hidden border-2 border-transparent transition-all"
                                onClick={() => setSelectedImage(image.imageUrl)}
                            >
                                <Image
                                    src={image.imageUrl}
                                    alt={image.description}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                    data-ai-hint={image.imageHint}
                                />
                                {selectedImage === image.imageUrl && (
                                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                                        <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs p-1.5 truncate">
                                    {image.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading || !selectedImage}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Image
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

