"use client";

import { useState, useCallback } from "react";
import { useVoiceControl } from "@/hooks/use-voice-control";
import { Mic, MicOff, SkipForward, SkipBack, RotateCcw } from "lucide-react";

interface VoiceCookingAssistantProps {
  instructions: string;
}

export function VoiceCookingAssistant({ instructions }: VoiceCookingAssistantProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Split instructions into steps (by newlines or numbers)
  const steps = instructions
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleRepeat = useCallback(() => {
    // Re-read current step (triggered by state update)
    setCurrentStep((prev) => prev);
  }, []);

  const { isListening, supported, startListening, stopListening } = useVoiceControl({
    onNext: handleNext,
    onBack: handleBack,
    onRepeat: handleRepeat,
  });

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (steps.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Voice Control Bar */}
      <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
        <button
          onClick={toggleListening}
          disabled={!supported}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isListening
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Voice Control
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="p-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <span className="text-sm font-medium px-3">
            Step {currentStep + 1} of {steps.length}
          </span>

          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            className="p-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            onClick={handleRepeat}
            className="p-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Current Step Display */}
      <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
        <p className="text-sm text-muted-foreground mb-2">
          Current Step ({currentStep + 1}/{steps.length})
        </p>
        <p className="text-lg font-medium leading-relaxed">
          {steps[currentStep]}
        </p>
      </div>

      {/* All Steps */}
      <div className="space-y-2">
        <h3 className="font-semibold">All Steps</h3>
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li
              key={index}
              className={`p-3 rounded-lg transition-colors ${
                index === currentStep
                  ? "bg-primary/10 border border-primary"
                  : "border border-border hover:bg-accent/50"
              }`}
              onClick={() => setCurrentStep(index)}
            >
              <span className="text-sm text-muted-foreground mr-2">
                {index + 1}.
              </span>
              <span className={index === currentStep ? "font-medium" : ""}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Voice Commands Help */}
      {isListening && (
        <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Voice Commands:</p>
          <p>Say &quot;Next&quot;, &quot;Forward&quot;, or &quot;Continue&quot; to go to the next step</p>
          <p>Say &quot;Back&quot;, &quot;Previous&quot;, or &quot;Before&quot; to go back</p>
          <p>Say &quot;Repeat&quot;, &quot;Again&quot;, or &quot;Say that again&quot; to repeat</p>
        </div>
      )}
    </div>
  );
}
