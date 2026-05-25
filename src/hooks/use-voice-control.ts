"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceControlOptions {
  onNext?: () => void;
  onBack?: () => void;
  onRepeat?: () => void;
  onTranscript?: (transcript: string) => void;
  language?: string;
}

export function useVoiceControl(options: UseVoiceControlOptions = {}) {
  const {
    onNext,
    onBack,
    onRepeat,
    onTranscript,
    language = "en-US",
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support once on mount
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognitionAPI);
  }, []);

  // Process voice commands
  const processCommand = useCallback(
    (transcript: string) => {
      const normalizedTranscript = transcript.toLowerCase().trim();

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

      onTranscript?.(transcript);
    },
    [onNext, onBack, onRepeat, onTranscript]
  );

  // Stop listening helper
  const doStop = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // May already be stopped
      }
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Stop any existing first
    doStop();

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        processCommand(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      // Don't show 'no-speech' as an error - it's normal
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Microphone error: ${event.error}`);
      }
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      // Auto-restart after a short delay if the user hasn't manually stopped
      restartTimeoutRef.current = setTimeout(() => {
        if (!isListeningRef.current) {
          // User might have clicked stop - check if we should restart
          // Only restart if still "wanting" to listen (checked by state)
          // Actually, simpler: don't auto-restart. Let user click again.
        }
      }, 500);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start microphone. Please check permissions.");
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [language, processCommand, doStop]);

  // Stop listening
  const stopListening = useCallback(() => {
    doStop();
  }, [doStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      doStop();
    };
  }, [doStop]);

  return {
    isListening,
    transcript,
    error,
    supported,
    startListening,
    stopListening,
  };
}

// Text-to-Speech hook
export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Prefer English voices
      const englishVoices = availableVoices.filter(
        (v) => v.lang.startsWith("en") && !v.localService
      );
      const localEnglishVoices = availableVoices.filter(
        (v) => v.lang.startsWith("en") && v.localService
      );

      // Prefer female voice, then first available
      const preferred =
        englishVoices.find((v) => v.name.toLowerCase().includes("female")) ||
        englishVoices[0] ||
        localEnglishVoices.find((v) => v.name.toLowerCase().includes("female")) ||
        localEnglishVoices[0] ||
        availableVoices[0];

      if (preferred) {
        setSelectedVoice(preferred);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.lang = "en-US";
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [selectedVoice]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const changeVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    speak,
    stop,
    speaking,
    voices,
    selectedVoice,
    changeVoice,
    supported: typeof window !== "undefined" && "speechSynthesis" in window,
  };
}
