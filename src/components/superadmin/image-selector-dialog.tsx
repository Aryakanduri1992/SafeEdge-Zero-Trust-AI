
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle2, Upload } from 'lucide-react';
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
import { Organization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';

type ImageSelectorDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    organization: Organization;
};

export function ImageSelectorDialog({ isOpen, onOpenChange, organization }: ImageSelectorDialogProps) {
    const { updateOrganizationImage } = useAuth();
    const { toast } = useToast();
    
    // State for the image URL to be displayed in the preview and potentially saved (if from gallery)
    const [previewUrl, setPreviewUrl] = useState('');
    // State to specifically hold the base64 data of a newly uploaded file
    const [uploadedImageDataUri, setUploadedImageDataUri] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when the dialog opens or the organization changes
    useEffect(() => {
        if (isOpen) {
            setPreviewUrl(organization.imageUrl || '');
            setUploadedImageDataUri(null);
        }
    }, [isOpen, organization]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // An image was uploaded, store its data URI and update the preview
                setUploadedImageDataUri(result);
                setPreviewUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = (imageUrl: string) => {
        // A gallery image was selected, clear any uploaded file data
        setUploadedImageDataUri(null);
        setPreviewUrl(imageUrl);
    };

    const handleSave = async () => {
        if (!organization) return;
        
        // Determine which image URL to save. Prioritize the newly uploaded image.
        const finalImageUrl = uploadedImageDataUri || previewUrl;

        if (!finalImageUrl) {
            toast({
                variant: 'destructive',
                title: 'No Image Selected',
                description: 'Please select an image from the gallery or upload one.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await updateOrganizationImage(organization.id, finalImageUrl);
            toast({
                title: "Image Updated",
                description: `The logo for ${organization.organizationName} has been changed.`,
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || "Could not update the profile image. Check permissions.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Change Logo for {organization.organizationName}</DialogTitle>
                    <DialogDescription>
                        Select an image from the gallery or upload your own.
                    </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="gallery">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gallery">Gallery</TabsTrigger>
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="gallery">
                         <ScrollArea className="h-[55vh] -mx-6 px-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
                                {PlaceHolderImages.map((image) => (
                                    <div
                                        key={image.id}
                                        className="relative aspect-square cursor-pointer group rounded-lg overflow-hidden border-2 border-transparent transition-all"
                                        onClick={() => handleGallerySelect(image.imageUrl)}
                                    >
                                        <Image
                                            src={image.imageUrl}
                                            alt={image.description}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                            className="object-cover transition-transform group-hover:scale-105"
                                            data-ai-hint={image.imageHint}
                                        />
                                        {previewUrl === image.imageUrl && !uploadedImageDataUri && (
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
                    </TabsContent>
                    <TabsContent value="upload">
                        <div className="h-[55vh] flex flex-col items-center justify-center gap-6 py-4">
                           {previewUrl && uploadedImageDataUri ? (
                                <div className="w-48 h-48 relative">
                                    <Image src={previewUrl} alt="Logo preview" layout="fill" className="rounded-full object-cover border-4 border-primary" />
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
                    </TabsContent>
                </Tabs>
               
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading || !previewUrl}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Image
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
