"use client";

import { useCallback, useRef, useState } from "react";
import { donationAIExtractionService } from "../../../lib/voice/donation/aiExtractionService";
import { donationAutoFillService, type ConfirmOverwriteFn } from "../../../lib/voice/donation/donationAutoFillService";
import type { DonationFormVoiceState, DonationVoiceField, VoiceStatus } from "../../../lib/voice/donation/types";
import { DONATION_VOICE_FIELD_LABELS } from "../../../lib/voice/donation/types";
import { validateFieldExtraction } from "../../../lib/voice/donation/validationService";
import { speechRecognitionService } from "../../../lib/voice/speechRecognitionService";
import { textToSpeechService } from "../../../lib/voice/textToSpeechService";
import { MicIcon, SpeakerIcon } from "../VoiceIcons";

type VoiceFieldButtonProps = {
  field: DonationVoiceField;
  form: DonationFormVoiceState;
  speakText?: string;
  onFormUpdate: (form: DonationFormVoiceState) => void;
  onFieldHighlighted: (field: DonationVoiceField) => void;
  confirmOverwrite: ConfirmOverwriteFn;
  disabled?: boolean;
  onStatusChange?: (status: VoiceStatus) => void;
  onTranscriptionChange?: (text: string) => void;
  onError?: (message: string) => void;
};

export function VoiceFieldButton({
  field,
  form,
  speakText,
  onFormUpdate,
  onFieldHighlighted,
  confirmOverwrite,
  disabled = false,
  onStatusChange,
  onTranscriptionChange,
  onError
}: VoiceFieldButtonProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [speaking, setSpeaking] = useState(false);
  const finalTextRef = useRef("");

  const label = DONATION_VOICE_FIELD_LABELS[field];

  const setVoiceStatus = useCallback(
    (next: VoiceStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const processTranscription = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        onError?.("Aucune parole détectée.");
        setVoiceStatus("idle");
        return;
      }

      setVoiceStatus("analyzing");

      try {
        const response = await donationAIExtractionService.extractField(text, field, form);
        const validated = validateFieldExtraction(response.data);

        if (!validated.ok) {
          onError?.(validated.errors.join(" "));
          setVoiceStatus("idle");
          return;
        }

        const result = await donationAutoFillService.applyPatch(form, validated.patch, confirmOverwrite, {
          mergeAllergens: field === "allergens"
        });

        if (result.filledFields.length === 0) {
          onError?.(`Aucune donnée détectée pour « ${label} ».`);
        } else {
          onFormUpdate(result.form);
          onFieldHighlighted(field);
        }
        setVoiceStatus("idle");
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
        setVoiceStatus("idle");
      }
    },
    [confirmOverwrite, field, form, label, onError, onFieldHighlighted, onFormUpdate, setVoiceStatus]
  );

  const handleMicClick = useCallback(async () => {
    if (disabled || status === "listening" || status === "analyzing") return;

    if (!speechRecognitionService.isSupported()) {
      onError?.("Reconnaissance vocale non supportée (Chrome recommandé).");
      return;
    }

    if (!(await speechRecognitionService.requestPermission())) {
      onError?.("Accès au microphone refusé.");
      return;
    }

    finalTextRef.current = "";
    onTranscriptionChange?.("");
    setVoiceStatus("listening");

    speechRecognitionService.start({
      onInterim: (text) => onTranscriptionChange?.(text),
      onFinal: (text) => {
        finalTextRef.current = text;
        onTranscriptionChange?.(text);
      },
      onError: (message) => {
        onError?.(message);
        setVoiceStatus("idle");
      },
      onEnd: () => {
        if (finalTextRef.current) void processTranscription(finalTextRef.current);
        else {
          onError?.("Aucune parole détectée.");
          setVoiceStatus("idle");
        }
      }
    });
  }, [disabled, onError, onTranscriptionChange, processTranscription, setVoiceStatus, status]);

  const handleSpeakClick = useCallback(() => {
    if (!textToSpeechService.isSupported()) {
      onError?.("Synthèse vocale non disponible.");
      return;
    }
    if (speaking) {
      textToSpeechService.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    textToSpeechService.speak(
      speakText?.trim() ? `${label} : ${speakText}` : `${label} : non renseigné`,
      () => setSpeaking(false)
    );
  }, [label, onError, speakText, speaking]);

  const micClass =
    status === "listening" ? "text-red-500" : status === "analyzing" ? "text-ravively-orange" : "text-ravively-green hover:text-ravively-green-dark";

  return (
    <>
      <button
        type="button"
        onClick={() => void handleMicClick()}
        disabled={disabled || status === "listening" || status === "analyzing"}
        className={`px-2 py-2 disabled:opacity-40 ${micClass}`}
        aria-label={`Dicter ${label}`}
        title={status === "listening" ? "Écoute…" : status === "analyzing" ? "Analyse IA…" : `Dicter ${label}`}
      >
        <MicIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleSpeakClick}
        disabled={disabled}
        className={`px-2 py-2 disabled:opacity-40 ${speaking ? "text-ravively-green" : "text-gray-400 hover:text-gray-600"}`}
        aria-label={`Écouter ${label}`}
      >
        <SpeakerIcon className="h-4 w-4" />
      </button>
    </>
  );
}
