"use client";

import { useState, useCallback, useEffect } from "react";
import { useVoiceControl, useTextToSpeech } from "@/hooks/use-voice-control";
import { Mic, MicOff, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface VoiceCookingAssistantProps {
  instructions: string;
}

export function VoiceCookingAssistant({ instructions }: VoiceCookingAssistantProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [readAloudEnabled, setReadAloudEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = instructions
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const { speak, speaking, stop: stopSpeaking, supported: ttsSupported } = useTextToSpeech();

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, steps.length - 1);
      return next;
    });
  }, [steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleRepeat = useCallback(() => {
    // Just trigger TTS re-read via useEffect
    setCurrentStep((prev) => prev);
  }, []);

  const handleGoToStep = useCallback((index: number) => {
    setCurrentStep(index);
  }, []);

  const { isListening, supported: voiceSupported, error: voiceError, startListening, stopListening } = useVoiceControl({
    onNext: handleNext,
    onBack: handleBack,
    onRepeat: handleRepeat,
  });

  // Text-to-speech: read step aloud when it changes
  useEffect(() => {
    if (readAloudEnabled && ttsSupported && steps[currentStep]) {
      stopSpeaking();
      speak(`Step ${currentStep + 1}: ${steps[currentStep]}`);
    }
  }, [currentStep, readAloudEnabled, ttsSupported, steps, speak, stopSpeaking]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleReadAloud = () => {
    if (readAloudEnabled) {
      setReadAloudEnabled(false);
      stopSpeaking();
    } else {
      setReadAloudEnabled(true);
      if (steps[currentStep]) {
        speak(`Step ${currentStep + 1}: ${steps[currentStep]}`);
      }
    }
  };

  if (steps.length === 0) return null;

  // Only show TTS button after client mount to avoid hydration mismatch
  const showReadAloud = mounted && ttsSupported;

  return (
    <div className="space-y-4">
      {/* Voice Control Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 border border-border rounded-lg bg-card">
        {/* Voice Recognition Button */}
        <button
          onClick={toggleListening}
          disabled={!voiceSupported}
          title={!voiceSupported ? "Voice control requires Chrome or Edge" : undefined}
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

        {/* Read Aloud Button */}
        {showReadAloud && (
          <button
            onClick={toggleReadAloud}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              readAloudEnabled
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "border border-border hover:bg-accent"
            }`}
          >
            {readAloudEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                Reading Aloud
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                Read Aloud
              </>
            )}
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
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

      {/* Browser Support Warning */}
      {!voiceSupported && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          <strong>Voice commands not available.</strong> Please use Chrome or Edge browser for hands-free voice control.
        </div>
      )}

      {/* Voice Error */}
      {voiceError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <strong>Microphone error:</strong> {voiceError}
        </div>
      )}

      {/* Current Step Display */}
      <div className="p-6 border-2 border-primary rounded-lg bg-primary/5 relative">
        {speaking && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-orange-600 animate-pulse">
            <Volume2 className="h-3 w-3" />
            Speaking...
          </div>
        )}
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
              className={`p-3 rounded-lg transition-colors cursor-pointer ${
                index === currentStep
                  ? "bg-primary/10 border border-primary"
                  : "border border-border hover:bg-accent/50"
              }`}
              onClick={() => handleGoToStep(index)}
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
