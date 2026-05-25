"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string | null;
}

export function ImageUpload({ onImageUploaded, currentImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      onImageUploaded(data.url);
      setPreviewUrl(data.url);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image");
      // Revert to previous image if upload fails
      if (currentImage) {
        setPreviewUrl(currentImage);
      } else {
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={previewUrl}
            alt="Recipe preview"
            className="w-full h-full object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <Camera className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">Upload Recipe Photo</span>
          <span className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</span>
        </button>
      )}
    </div>
  );
}
