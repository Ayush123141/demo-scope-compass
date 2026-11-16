/**
 * Voice Advisory Service for Mitti Sentinel
 *
 * Provides real-time Text-to-Speech (TTS) audio advisories in
 * English, Hindi (हिन्दी), and Marathi (मराठी) using the native Web Speech API.
 */

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
