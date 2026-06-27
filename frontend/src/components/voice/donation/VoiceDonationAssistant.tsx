"use client";

import { useCallback, useRef, useState } from "react";
import { donationAIExtractionService } from "../../../lib/voice/donation/aiExtractionService";
import { donationAutoFillService, type ConfirmOverwriteFn } from "../../../lib/voice/donation/donationAutoFillService";
import type { DonationFormVoiceState, DonationVoiceField, VoiceStatus } from "../../../lib/voice/donation/types";
import {
  getMissingRequiredFields,
  validateGlobalExtraction
} from "../../../lib/voice/donation/validationService";
import { speechRecognitionService } from "../../../lib/voice/speechRecognitionService";
import { fieldClass } from "./VoiceDonationField";
import { MicIcon } from "../VoiceIcons";

type VoiceDonationAssistantProps = {
  form: DonationFormVoiceState;
  onFormUpdate: (form: DonationFormVoiceState) => void;
  onFieldsHighlighted: (fields: DonationVoiceField[]) => void;
  onMissingFields: (fields: DonationVoiceField[]) => void;
  confirmOverwrite: ConfirmOverwriteFn;
  disabled?: boolean;
  onStatusChange?: (status: VoiceStatus) => void;
  onTranscriptionChange?: (text: string) => void;
  onError?: (message: string) => void;
};

export function VoiceDonationAssistant({
  form,
  onFormUpdate,
  onFieldsHighlighted,
  onMissingFields,
  confirmOverwrite,
  disabled = false,
  onStatusChange,
  onTranscriptionChange,
  onError
}: VoiceDonationAssistantProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [textInput, setTextInput] = useState("");
  const [transcription, setTranscription] = useState("");
  const finalTextRef = useRef("");

  const setVoiceStatus = useCallback(
    (next: VoiceStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const processText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        onError?.("Aucun texte à analyser.");
        return;
      }

      setTranscription(text);
      onTranscriptionChange?.(text);
      setVoiceStatus("analyzing");

      try {
        const response = await donationAIExtractionService.extractGlobal(text, form);
        const validated = validateGlobalExtraction(response.data);

        if (!validated.ok) {
          onError?.(validated.errors.join(" "));
          setVoiceStatus("idle");
          return;
        }

        const result = await donationAutoFillService.applyPatch(form, validated.patch, confirmOverwrite);

        if (result.filledFields.length === 0) {
          onError?.("Aucune donnée n'a pu être appliquée.");
        } else {
          onFormUpdate(result.form);
          onFieldsHighlighted(result.filledFields);
          onMissingFields(getMissingRequiredFields(result.form));
        }
        setVoiceStatus("idle");
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
        setVoiceStatus("idle");
      }
    },
    [confirmOverwrite, form, onError, onFieldsHighlighted, onFormUpdate, onMissingFields, onTranscriptionChange, setVoiceStatus]
  );

  const handleMic = useCallback(async () => {
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
    onTranscriptionChange?.("");
    setVoiceStatus("listening");

    speechRecognitionService.start({
      onInterim: (t) => {
        setTranscription(t);
        onTranscriptionChange?.(t);
      },
      onFinal: (t) => {
        finalTextRef.current = t;
        setTranscription(t);
        onTranscriptionChange?.(t);
      },
      onError: (msg) => {
        onError?.(msg);
        setVoiceStatus("idle");
      },
      onEnd: () => {
        if (finalTextRef.current) void processText(finalTextRef.current);
        else {
          onError?.("Aucune parole détectée.");
          setVoiceStatus("idle");
        }
      }
    });
  }, [disabled, onError, onTranscriptionChange, processText, setVoiceStatus, status]);

  const hint =
    status === "listening"
      ? "Écoute en cours…"
      : status === "analyzing"
        ? "Analyse IA en cours…"
        : "Décrivez votre don à voix haute ou saisissez une phrase";

  const micClass =
    status === "listening" ? "text-red-500" : status === "analyzing" ? "text-ravively-orange" : "text-ravively-green hover:text-ravively-green-dark";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="voice-donation-input" className="text-base font-medium">
          Décrire le don (voix ou texte)
        </label>
      </div>
      <div className="flex gap-2">
        <input
          id="voice-donation-input"
          type="text"
          value={status === "listening" ? transcription : textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void processText(textInput);
            }
          }}
          disabled={disabled || status === "listening" || status === "analyzing"}
          placeholder={hint}
          className={`${fieldClass} min-w-0 flex-1`}
          aria-describedby="voice-donation-hint"
        />
        <button
          type="button"
          onClick={() => void processText(textInput)}
          disabled={disabled || !textInput.trim() || status !== "idle"}
          className="btn-secondary shrink-0 px-4"
        >
          Analyser
        </button>
        <button
          type="button"
          onClick={() => void handleMic()}
          disabled={disabled || status === "listening" || status === "analyzing"}
          className={`shrink-0 rounded-lg border border-gray-300 bg-white px-3 disabled:opacity-40 ${micClass}`}
          aria-label="Dictée globale"
        >
          <MicIcon className="h-5 w-5" />
        </button>
      </div>
      {transcription && status === "listening" && (
        <p id="voice-donation-hint" className="text-sm text-gray-500" role="status">
          {transcription}
        </p>
      )}
    </div>
  );
}
