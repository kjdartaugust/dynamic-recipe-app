"use client";

import { useState, useEffect, useCallback } from "react";
import { Printer, ChefHat, ChevronRight, ChevronLeft, X, CheckCircle2, ListOrdered } from "lucide-react";

interface Props {
  instructions: string;
}

export function RecipeInstructions({ instructions }: Props) {
  const [mode, setMode] = useState<"list" | "cooking">("list");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());

  const steps = instructions
    ? instructions
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5)
    : [];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (mode !== "cooking") return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setStep((s) => Math.min(steps.length - 1, s + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      } else if (e.key === "Escape") {
        setMode("list");
      }
    },
    [mode, steps.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (steps.length === 0)
    return <p className="text-muted-foreground">No instructions.</p>;

  if (mode === "cooking") {
    const pct = ((step + 1) / steps.length) * 100;
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="h-2 bg-orange-100">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between p-4 border-b border-orange-100">
          <span className="text-sm font-medium text-muted-foreground">
            Step {step + 1} of {steps.length}
          </span>
          <button
            onClick={() => setMode("list")}
            className="p-2 hover:bg-orange-50 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full text-center">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-2xl font-bold mb-8">
              {step + 1}
            </span>
            <p className="text-xl md:text-2xl leading-relaxed font-medium">
              {steps[step].replace(/^\d+\.\s*/, "")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-orange-100">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="p-3 rounded-xl hover:bg-orange-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={step === steps.length - 1}
            className="p-3 rounded-xl hover:bg-orange-50 disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground pb-4">
          Use arrow keys or space to navigate. Press Esc to exit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">Instructions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={() => setMode("cooking")}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm btn-gradient text-white rounded-lg"
          >
            <ChefHat className="h-4 w-4" />
            Cook Mode
          </button>
        </div>
      </div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li
            key={i}
            onClick={() => {
              setDone((prev) => {
                const n = new Set(prev);
                n.has(i) ? n.delete(i) : n.add(i);
                return n;
              });
            }}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
              done.has(i)
                ? "bg-green-50 border-green-200 opacity-60"
                : "bg-white border-orange-100 hover:border-orange-300"
            }`}
          >
            <span
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                done.has(i)
                  ? "bg-green-500 text-white"
                  : "bg-gradient-to-br from-orange-500 to-red-500 text-white"
              }`}
            >
              {done.has(i) ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                i + 1
              )}
            </span>
            <p className="text-foreground leading-relaxed pt-1">{s.replace(/^\d+\.\s*/, "")}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
