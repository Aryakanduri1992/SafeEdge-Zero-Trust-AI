
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { SuperAdminUser } from '@/lib/types';

type SuperAdminImageDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export function SuperAdminImageDialog({ isOpen, onOpenChange }: SuperAdminImageDialogProps) {
    const { user, updateSuperAdminImage } = useAuth();
    const superAdmin = user as SuperAdminUser;
    const { toast } = useToast();
    
    const [selectedImageUrl, setSelectedImageUrl] = useState(superAdmin?.imageUrl || '');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedImageUrl(superAdmin?.imageUrl || '');
        }
    }, [isOpen, superAdmin?.imageUrl]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setSelectedImageUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!superAdmin) return;
        
        if (!selectedImageUrl) {
            toast({
                variant: 'destructive',
                title: 'No Image Selected',
                description: 'Please upload an image.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await updateSuperAdminImage(superAdmin.id, selectedImageUrl);
            toast({
                title: "Profile Picture Updated",
                description: `Your profile picture has been successfully changed.`,
            });
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Profile Picture</DialogTitle>
                    <DialogDescription>
                        Upload a new image for your Super Admin profile.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col items-center justify-center gap-6 py-4">
                   {selectedImageUrl ? (
                        <div className="w-48 h-48 relative">
                            <Image src={selectedImageUrl} alt="Uploaded preview" layout="fill" className="rounded-full object-cover border-4 border-primary" />
                        </div>
                    ) : (
                        <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center">
                            <Upload className="h-16 w-16 text-muted-foreground" />
                        </div>
                    )}

                    <Input 
                        type="file" 
                        className="hidden"
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/gif"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Browse Computer
                    </Button>
                     <p className="text-xs text-muted-foreground">Recommended: Square image, PNG or JPG format.</p>
                </div>
               
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading || !selectedImageUrl}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Image
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
