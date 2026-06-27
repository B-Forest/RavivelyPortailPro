"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { speechRecognitionService } from "../../lib/voice/speechRecognitionService";

type VoiceState = "idle" | "listening" | "processing";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Called with the raw transcription; should return a promise resolving when done */
  onVoiceSubmit: (transcription: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  voiceFilled?: boolean;
  disabled?: boolean;
  className?: string;
};

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-4 w-4" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Waveform() {
  return (
    <div className="flex items-center gap-[3px]" aria-hidden>
      {[...Array(8)].map((_, i) => (
        <span key={i} className="vbar" />
      ))}
    </div>
  );
}

const baseClass =
  "w-full rounded-lg border bg-white px-4 pb-10 pt-3 text-lg focus:border-ravively-green focus:outline-none transition-colors resize-none";

export function VoiceTextField({
  id,
  value,
  onChange,
  onVoiceSubmit,
  placeholder = "",
  multiline = false,
  rows = 3,
  voiceFilled = false,
  disabled = false,
  className = "",
}: Props) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const finalRef = useRef("");

  const borderClass = voiceFilled
    ? "border-ravively-green/60 ring-2 ring-ravively-green/20"
    : "border-gray-300";

  const startListening = useCallback(async () => {
    setError("");
    if (!speechRecognitionService.isSupported()) {
      setError("Reconnaissance vocale non supportée (Chrome recommandé).");
      return;
    }
    if (!(await speechRecognitionService.requestPermission())) {
      setError("Accès au microphone refusé.");
      return;
    }
    finalRef.current = "";
    setInterim("");
    setVoiceState("listening");

    speechRecognitionService.start({
      onInterim: (t) => {
        // Keep finalRef in sync with the running transcript (continuous mode)
        finalRef.current = t;
        setInterim(t);
      },
      onFinal: (t) => {
        finalRef.current = t;
        setInterim(t);
      },
      onError: (msg) => {
        setError(msg);
        setInterim("");
        finalRef.current = "";
        setVoiceState("idle");
      },
      onEnd: () => {
        // With continuous=true this only fires after stop() — handled in confirm/cancel
      },
    });
  }, [interim]);

  const cancel = useCallback(() => {
    speechRecognitionService.stop();
    setInterim("");
    finalRef.current = "";
    setVoiceState("idle");
  }, []);

  const confirm = useCallback(async () => {
    const text = finalRef.current || interim;
    if (!text.trim()) {
      cancel();
      return;
    }
    speechRecognitionService.stop();
    setVoiceState("processing");
    try {
      await onVoiceSubmit(text.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
    } finally {
      setInterim("");
      finalRef.current = "";
      setVoiceState("idle");
    }
  }, [cancel, interim, onVoiceSubmit]);

  const isListening = voiceState === "listening";
  const isProcessing = voiceState === "processing";
  const hasText = !!(finalRef.current || interim);

  const inputProps = {
    id,
    value: isListening ? interim : value,
    disabled: disabled || isListening || isProcessing,
    placeholder: isListening ? "À l'écoute…" : isProcessing ? "Analyse IA en cours…" : placeholder,
    className: `${baseClass} ${borderClass} ${className}`,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    rows,
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        {multiline ? (
          <textarea {...inputProps} />
        ) : (
          <input {...{ ...inputProps, rows: undefined }} />
        )}

        {/* Bottom-right controls */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
          {isListening && (
            <>
              <Waveform />
              <button
                type="button"
                onClick={cancel}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                aria-label="Annuler"
              >
                <XIcon />
              </button>
              <button
                type="button"
                onClick={() => void confirm()}
                disabled={!hasText}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ravively-green text-white hover:bg-ravively-green-dark disabled:opacity-40"
                aria-label="Confirmer"
              >
                <CheckIcon />
              </button>
            </>
          )}

          {isProcessing && (
            <span className="text-xs text-gray-400">…</span>
          )}

          {voiceState === "idle" && (
            <button
              type="button"
              onClick={() => void startListening()}
              disabled={disabled}
              className="text-gray-400 hover:text-ravively-green disabled:opacity-40 transition-colors"
              aria-label="Dicter"
            >
              <MicIcon />
            </button>
          )}
        </div>
      </div>

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
