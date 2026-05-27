"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2, Plus, Trash2, Check, Scan, AlertTriangle } from "lucide-react";

interface ScannedIngredient {
  name: string;
  amount: number;
  unit: string;
  expiry_date: string;
}

interface FridgeScannerProps {
  onAddItems: (items: Array<{ name: string; amount: number | null; unit: string; expiry_date: string | null }>) => void;
  onClose: () => void;
}

const DEFAULT_UNITS = ["piece", "g", "kg", "ml", "l", "cup", "tbsp", "tsp", "oz", "lb", "bunch", "pack"];

function getDefaultExpiry(name: string): string {
  const lower = name.toLowerCase();
  const today = new Date();
  
  // Common perishables
  if (lower.includes("milk") || lower.includes("yogurt") || lower.includes("cream")) {
    today.setDate(today.getDate() + 7);
  } else if (lower.includes("cheese")) {
    today.setDate(today.getDate() + 14);
  } else if (lower.includes("egg")) {
    today.setDate(today.getDate() + 21);
  } else if (lower.includes("bread") || lower.includes("bun")) {
    today.setDate(today.getDate() + 5);
  } else if (lower.includes("lettuce") || lower.includes("spinach") || lower.includes("greens")) {
    today.setDate(today.getDate() + 5);
  } else if (lower.includes("tomato") || lower.includes("cucumber") || lower.includes("pepper")) {
    today.setDate(today.getDate() + 7);
  } else if (lower.includes("onion") || lower.includes("potato") || lower.includes("garlic")) {
    today.setDate(today.getDate() + 30);
  } else if (lower.includes("banana")) {
    today.setDate(today.getDate() + 5);
  } else if (lower.includes("apple") || lower.includes("orange") || lower.includes("fruit")) {
    today.setDate(today.getDate() + 14);
  } else if (lower.includes("chicken") || lower.includes("meat") || lower.includes("beef") || lower.includes("pork")) {
    today.setDate(today.getDate() + 3);
  } else if (lower.includes("fish") || lower.includes("salmon") || lower.includes("seafood")) {
    today.setDate(today.getDate() + 2);
  } else {
    today.setDate(today.getDate() + 14);
  }
  
  return today.toISOString().split("T")[0];
}

export function FridgeScanner({ onAddItems, onClose }: FridgeScannerProps) {
  const [step, setStep] = useState<"upload" | "scanning" | "review" | "saving">("upload");
  const [scannedItems, setScannedItems] = useState<ScannedIngredient[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep("scanning");
    setError("");

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

      const items: ScannedIngredient[] = (data.ingredients || []).map((ing: any) => ({
        name: ing.name,
        amount: ing.amount || 1,
        unit: ing.unit || "piece",
        expiry_date: getDefaultExpiry(ing.name),
      }));

      setScannedItems(items);
      setStep("review");
    } catch (err: any) {
      setError(err.message || "Failed to scan image. Try again.");
      setStep("upload");
    }
  }, []);

  const updateItem = (index: number, field: keyof ScannedIngredient, value: string | number) => {
    setScannedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    setScannedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setScannedItems((prev) => [
      ...prev,
      { name: "", amount: 1, unit: "piece", expiry_date: getDefaultExpiry("") },
    ]);
  };

  const handleSave = async () => {
    const validItems = scannedItems.filter((item) => item.name.trim());
    if (validItems.length === 0) return;

    setStep("saving");
    onAddItems(
      validItems.map((item) => ({
        name: item.name.trim(),
        amount: item.amount,
        unit: item.unit,
        expiry_date: item.expiry_date || null,
      }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-orange-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg text-white">
              <Scan className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-lg">Scan Your Fridge</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "upload" && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-orange-200 rounded-2xl p-8 text-center hover:border-orange-400 hover:bg-orange-50/50 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-orange-500" />
                </div>
                <p className="font-medium text-foreground mb-1">Take a photo or upload</p>
                <p className="text-sm text-muted-foreground">
                  Snap your fridge, pantry, or grocery receipt
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports JPG, PNG up to 5MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium mb-1">Tips for best results:</p>
                <ul className="text-xs text-blue-600 list-disc list-inside space-y-0.5">
                  <li>Good lighting — avoid shadows</li>
                  <li>Capture labels if possible</li>
                  <li>Include multiple items in one shot</li>
                </ul>
              </div>
            </div>
          )}

          {step === "scanning" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
              <p className="font-medium text-foreground">AI is analyzing your photo...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Identifying ingredients and estimating quantities
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review and edit what AI found. Add expiry dates to track freshness.
              </p>

              <div className="space-y-2">
                {scannedItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                        placeholder="Item name"
                        className="flex-1 px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateItem(index, "amount", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                        className="px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {DEFAULT_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => updateItem(index, "expiry_date", e.target.value)}
                        className="px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addItem}
                className="w-full py-2 border-2 border-dashed border-orange-200 rounded-xl text-orange-600 text-sm font-medium hover:bg-orange-50 hover:border-orange-300 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item Manually
              </button>
            </div>
          )}

          {step === "saving" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
              <p className="font-medium text-foreground">Adding to your kitchen...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "review" && (
          <div className="p-4 border-t border-orange-100 bg-white">
            <button
              onClick={handleSave}
              disabled={scannedItems.filter((i) => i.name.trim()).length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 btn-gradient text-white rounded-xl font-medium disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Add {scannedItems.filter((i) => i.name.trim()).length} Item
              {scannedItems.filter((i) => i.name.trim()).length !== 1 ? "s" : ""} to Kitchen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
