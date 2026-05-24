"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface VoiceControlState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  supported: boolean;
}

interface UseVoiceControlOptions {
  onNext?: () => void;
  onBack?: () => void;
  onRepeat?: () => void;
  onTranscript?: (transcript: string) => void;
  language?: string;
  continuous?: boolean;
}

export function useVoiceControl(options: UseVoiceControlOptions = {}) {
  const {
    onNext,
    onBack,
    onRepeat,
    onTranscript,
    language = "en-US",
    continuous = true,
  } = options;

  const [state, setState] = useState<VoiceControlState>({
    isListening: false,
    transcript: "",
    error: null,
    supported: false,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setState((prev) => ({ ...prev, supported: true }));
    }
  }, []);

  // Process voice commands
  const processCommand = useCallback(
    (transcript: string) => {
      const normalizedTranscript = transcript.toLowerCase().trim();

      // Handle navigation commands
      if (
        normalizedTranscript.includes("next") ||
        normalizedTranscript.includes("forward") ||
        normalizedTranscript.includes("continue")
      ) {
        onNext?.();
        return;
      }

      if (
        normalizedTranscript.includes("back") ||
        normalizedTranscript.includes("previous") ||
        normalizedTranscript.includes("before")
      ) {
        onBack?.();
        return;
      }

      if (
        normalizedTranscript.includes("repeat") ||
        normalizedTranscript.includes("again") ||
        normalizedTranscript.includes("say that again")
      ) {
        onRepeat?.();
        return;
      }

      // Pass through for custom handling
      onTranscript?.(transcript);
    },
    [onNext, onBack, onRepeat, onTranscript]
  );

  // Start listening
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setState((prev) => ({
        ...prev,
        error: "Speech recognition is not supported in this browser",
      }));
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
        transcript: "",
      }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setState((prev) => ({ ...prev, transcript: finalTranscript }));
        processCommand(finalTranscript);
      } else if (interimTranscript) {
        setState((prev) => ({ ...prev, transcript: interimTranscript }));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setState((prev) => ({
        ...prev,
        error: event.error,
        isListening: false,
      }));
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setState((prev) => ({ ...prev, isListening: false }));

      // Restart if continuous mode and not manually stopped
      if (continuous && state.isListening) {
        setTimeout(() => {
          if (isListeningRef.current === false) {
            startListening();
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to start speech recognition",
        isListening: false,
      }));
    }
  }, [continuous, language, processCommand, state.isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setState((prev) => ({ ...prev, isListening: false }));
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
  };
}
