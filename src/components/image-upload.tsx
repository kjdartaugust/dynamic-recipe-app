"use client";

import { Camera } from "lucide-react";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string | null;
}

export function ImageUpload({ currentImage }: ImageUploadProps) {
  if (currentImage) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={currentImage}
          alt="Recipe preview"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 border-2 border-dashed border-orange-200 rounded-xl bg-orange-50/50 text-center">
      <Camera className="h-8 w-8 text-orange-400" />
      <div>
        <p className="text-sm font-medium text-orange-700">Photo Upload</p>
        <p className="text-xs text-orange-600 mt-1">Coming soon — stay tuned!</p>
      </div>
    </div>
  );
}
