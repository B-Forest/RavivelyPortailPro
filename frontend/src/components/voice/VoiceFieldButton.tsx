"use client";

import { useCallback, useRef, useState } from "react";
import type { AssociationProfilePayload } from "../../lib/types";
import { aiExtractionService } from "../../lib/voice/aiExtractionService";
import { formAutoFillService, type ConfirmOverwriteFn } from "../../lib/voice/formAutoFillService";
import { speechRecognitionService } from "../../lib/voice/speechRecognitionService";
import { textToSpeechService } from "../../lib/voice/textToSpeechService";
import type { VoiceProfileField, VoiceStatus } from "../../lib/voice/types";
import { VOICE_FIELD_LABELS } from "../../lib/voice/types";
import { MicIcon, SpeakerIcon } from "./VoiceIcons";

type VoiceFieldButtonProps = {
  field: VoiceProfileField;
  form: AssociationProfilePayload;
  onFormUpdate: (form: AssociationProfilePayload) => void;
  onFieldHighlighted: (field: VoiceProfileField) => void;
  confirmOverwrite: ConfirmOverwriteFn;
  disabled?: boolean;
  onStatusChange?: (status: VoiceStatus) => void;
  onError?: (message: string) => void;
};

export function VoiceFieldButton({
  field,
  form,
  onFormUpdate,
  onFieldHighlighted,
  confirmOverwrite,
  disabled = false,
  onStatusChange,
  onError
}: VoiceFieldButtonProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [speaking, setSpeaking] = useState(false);
  const finalTextRef = useRef("");

  const label = VOICE_FIELD_LABELS[field];
  const fieldValue = (form[field] as string | undefined) ?? "";

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
        const response = await aiExtractionService.extractField(text, field);
        const result = await formAutoFillService.applyField(form, field, response.data.value, confirmOverwrite);

        if (result.filledFields.length === 0) {
          onError?.(`Aucune donnée détectée pour « ${label} ».`);
        } else {
          onFormUpdate(result.form);
          onFieldHighlighted(field);
        }
        setVoiceStatus("idle");
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Erreur lors de l'analyse vocale.");
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
    setVoiceStatus("listening");

    speechRecognitionService.start({
      onFinal: (text) => {
        finalTextRef.current = text;
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
  }, [disabled, onError, processTranscription, setVoiceStatus, status]);

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
      fieldValue.trim() ? `${label} : ${fieldValue}` : `${label} : non renseigné`,
      () => setSpeaking(false)
    );
  }, [fieldValue, label, onError, speaking]);

  const micClass =
    status === "listening" ? "text-red-500" : status === "analyzing" ? "text-ravively-orange" : "text-ravively-green hover:text-ravively-green-dark";

  return (
    <>
      <button
        type="button"
        onClick={() => void handleMicClick()}
        disabled={disabled || status === "listening" || status === "analyzing"}
        className={`px-2 py-3 disabled:opacity-40 ${micClass}`}
        aria-label={`Dicter ${label}`}
        title={`Dicter ${label}`}
      >
        <MicIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleSpeakClick}
        disabled={disabled}
        className={`px-2 py-3 disabled:opacity-40 ${speaking ? "text-ravively-green" : "text-gray-400 hover:text-gray-600"}`}
        aria-label={`Écouter ${label}`}
        title={`Écouter ${label}`}
      >
        <SpeakerIcon className="h-4 w-4" />
      </button>
    </>
  );
}
