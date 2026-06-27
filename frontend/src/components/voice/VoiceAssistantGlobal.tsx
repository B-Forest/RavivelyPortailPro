"use client";

import { useCallback, useRef, useState } from "react";
import type { AssociationProfilePayload } from "../../lib/types";
import { aiExtractionService } from "../../lib/voice/aiExtractionService";
import { formAutoFillService, type ConfirmOverwriteFn } from "../../lib/voice/formAutoFillService";
import { speechRecognitionService } from "../../lib/voice/speechRecognitionService";
import type { VoiceProfileField, VoiceStatus } from "../../lib/voice/types";
import { MicIcon } from "./VoiceIcons";

type VoiceAssistantGlobalProps = {
  form: AssociationProfilePayload;
  onFormUpdate: (form: AssociationProfilePayload) => void;
  onFieldsHighlighted: (fields: VoiceProfileField[]) => void;
  confirmOverwrite: ConfirmOverwriteFn;
  disabled?: boolean;
  onStatusChange?: (status: VoiceStatus) => void;
  onError?: (message: string) => void;
};

export function VoiceAssistantGlobal({
  form,
  onFormUpdate,
  onFieldsHighlighted,
  confirmOverwrite,
  disabled = false,
  onStatusChange,
  onError
}: VoiceAssistantGlobalProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcription, setTranscription] = useState("");
  const finalTextRef = useRef("");

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

      setTranscription(text);
      setVoiceStatus("analyzing");

      try {
        const response = await aiExtractionService.extractGlobal(text);
        const result = await formAutoFillService.applyGlobal(form, response.formData, confirmOverwrite);

        if (result.filledFields.length === 0) {
          onError?.("Aucune donnée n'a pu être appliquée.");
        } else {
          onFormUpdate(result.form);
          onFieldsHighlighted(result.filledFields);
        }
        setVoiceStatus("idle");
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Erreur lors de l'analyse vocale.");
        setVoiceStatus("idle");
      }
    },
    [confirmOverwrite, form, onError, onFieldsHighlighted, onFormUpdate, setVoiceStatus]
  );

  const handleClick = useCallback(async () => {
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
    setTranscription("");
    setVoiceStatus("listening");

    speechRecognitionService.start({
      onInterim: (text) => setTranscription(text),
      onFinal: (text) => {
        finalTextRef.current = text;
        setTranscription(text);
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

  const hint =
    status === "listening"
      ? "Écoute en cours…"
      : status === "analyzing"
        ? "Analyse en cours…"
        : "Dictez toutes vos informations en une phrase";

  const micClass =
    status === "listening" ? "text-red-500" : status === "analyzing" ? "text-ravively-orange" : "text-ravively-green hover:text-ravively-green-dark";

  return (
    <div>
      <label className="mb-1 block text-base font-medium">Dictée globale</label>
      <div className="relative flex items-center rounded-lg border border-gray-300 bg-white">
        <p className={`min-w-0 flex-1 py-3 pl-4 pr-12 text-lg ${transcription ? "text-gray-900" : "text-gray-400"}`} aria-live="polite">
          {transcription || hint}
        </p>
        <button
          type="button"
          onClick={() => void handleClick()}
          disabled={disabled || status === "listening" || status === "analyzing"}
          className={`absolute right-0 px-3 py-3 disabled:opacity-40 ${micClass}`}
          aria-label="Dictée globale"
        >
          <MicIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
