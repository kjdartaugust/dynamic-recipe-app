"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Sparkles } from "lucide-react";

interface ScannedIngredient {
  name: string;
  amount: number;
  unit: string;
}

interface IngredientScannerProps {
  onIngredientsScanned: (ingredients: ScannedIngredient[]) => void;
}

export function IngredientScanner({ onIngredientsScanned }: IngredientScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ai/scan", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan image");
      }

      if (data.ingredients && data.ingredients.length > 0) {
        onIngredientsScanned(data.ingredients);
      } else {
        alert("No ingredients detected in the image. Try a clearer photo.");
      }
    } catch (error) {
      console.error("Scan error:", error);
      alert(error instanceof Error ? error.message : "Failed to scan image");
    } finally {
      setIsScanning(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
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

      <button
        type="button"
        onClick={handleClick}
        disabled={isScanning}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
      >
        {isScanning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Scanning with AI...</span>
          </>
        ) : (
          <>
            <Camera className="h-5 w-5" />
            <span>Scan Ingredients from Photo</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </>
        )}
      </button>

      {previewUrl && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={previewUrl}
            alt="Scanned ingredients"
            className="w-full h-full object-cover"
          />
          {isScanning && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Analyzing image...</p>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Take a photo of your ingredients and AI will identify them automatically
      </p>
    </div>
  );
}
