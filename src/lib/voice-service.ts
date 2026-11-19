/**
 * Voice Advisory & Two-Way Speech Recognition Service for Mitti Sentinel
 *
 * Provides:
 * 1. Text-to-Speech (TTS) audio advisories in English, Hindi (हिन्दी), and Marathi (मराठी).
 * 2. Speech-to-Text (STT) voice question recognition in English, Hindi, and Marathi using Web Speech API.
 */

// Global Speech Recognition reference
let activeRecognitionInstance: any = null;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export function startVoiceRecognition({
  language,
  onResult,
  onError,
  onEnd,
}: {
  language: "en" | "hi" | "mr";
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}): boolean {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError("Speech recognition is not supported in this browser.");
    return false;
  }

  // Stop any active instance first
  stopVoiceRecognition();

  const SpeechRecognitionConstructor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  try {
    const recognition = new SpeechRecognitionConstructor();
    activeRecognitionInstance = recognition;

    // Configure language
    if (language === "hi") {
      recognition.lang = "hi-IN";
    } else if (language === "mr") {
      recognition.lang = "mr-IN";
    } else {
      recognition.lang = "en-IN";
    }

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript.trim()) {
        onResult(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (onError) onError(event.error || "Voice recognition error");
    };

    recognition.onend = () => {
      activeRecognitionInstance = null;
      if (onEnd) onEnd();
    };

    recognition.start();
    return true;
  } catch (err) {
    console.error("Failed to start speech recognition:", err);
    if (onError) onError(err instanceof Error ? err.message : String(err));
    return false;
  }
}

export function stopVoiceRecognition(): void {
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.abort();
    } catch {
      // ignore
    }
    activeRecognitionInstance = null;
  }
}

export function speakAdvisory(
  text: string,
  language: "en" | "hi" | "mr",
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported on this browser.");
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Configure language locale
  if (language === "hi") {
    utterance.lang = "hi-IN";
    utterance.rate = 0.92; // Slightly measured rate for rural broadcast clarity
  } else if (language === "mr") {
    utterance.lang = "mr-IN";
    utterance.rate = 0.92;
  } else {
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
  }

  // Find preferred regional voice if installed
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find((v) =>
    v.lang.toLowerCase().startsWith(language === "mr" ? "mr" : language === "hi" ? "hi" : "en-in")
  );

  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopAdvisorySpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
