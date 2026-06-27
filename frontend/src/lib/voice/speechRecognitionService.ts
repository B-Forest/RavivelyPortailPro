type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = { error: string };
type SpeechRecognitionResultList = { length: number; [index: number]: SpeechRecognitionResult };
type SpeechRecognitionResult = { isFinal: boolean; [index: number]: { transcript: string } };

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export type SpeechRecognitionCallbacks = {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
};

export class SpeechRecognitionService {
  private recognition: SpeechRecognitionInstance | null = null;
  private active = false;

  isSupported(): boolean {
    return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  async requestPermission(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return this.isSupported();
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  start(callbacks: SpeechRecognitionCallbacks): void {
    if (!this.isSupported()) {
      callbacks.onError?.("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    this.recognition = new SpeechRecognitionCtor();
    this.recognition.lang = "fr-FR";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      // Build full accumulated text across all results (continuous mode)
      let fullText = "";
      let lastIsFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        fullText += event.results[i][0].transcript;
        if (i < event.results.length - 1) fullText += " ";
        if (i === event.results.length - 1) lastIsFinal = event.results[i].isFinal;
      }
      const trimmed = fullText.trim();
      callbacks.onInterim?.(trimmed);
      if (lastIsFinal) callbacks.onFinal?.(trimmed);
    };

    this.recognition.onerror = (event) => {
      this.active = false;
      callbacks.onError?.(this.mapError(event.error));
    };

    this.recognition.onend = () => {
      this.active = false;
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
      this.active = true;
    } catch {
      this.active = false;
      callbacks.onError?.("Impossible de démarrer la reconnaissance vocale.");
    }
  }

  stop(): void {
    if (this.recognition && this.active) this.recognition.stop();
    this.active = false;
  }

  private mapError(code: string): string {
    switch (code) {
      case "not-allowed":
      case "service-not-allowed":
        return "Accès au microphone refusé.";
      case "no-speech":
        return "Aucune parole détectée.";
      case "audio-capture":
        return "Microphone inaccessible.";
      default:
        return "Erreur de reconnaissance vocale.";
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
