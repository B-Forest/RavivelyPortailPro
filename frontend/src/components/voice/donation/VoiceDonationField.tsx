"use client";

import type { ReactNode } from "react";
import type { DonationFormVoiceState, DonationVoiceField } from "../../../lib/voice/donation/types";
import { VoiceFieldButton } from "./VoiceFieldButton";
import type { ConfirmOverwriteFn } from "../../../lib/voice/donation/donationAutoFillService";
import type { VoiceStatus } from "../../../lib/voice/donation/types";

const fieldClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-ravively-green focus:outline-none";

type VoiceDonationFieldProps = {
  id: string;
  label: string;
  field: DonationVoiceField;
  form: DonationFormVoiceState;
  speakText?: string;
  voiceFilled?: boolean;
  error?: string;
  onFormUpdate: (form: DonationFormVoiceState) => void;
  onFieldHighlighted: (field: DonationVoiceField) => void;
  confirmOverwrite: ConfirmOverwriteFn;
  voiceDisabled?: boolean;
  onStatusChange?: (status: VoiceStatus) => void;
  onTranscriptionChange?: (text: string) => void;
  onError?: (message: string) => void;
  children: ReactNode;
};

export function VoiceDonationField({
  id,
  label,
  field,
  form,
  speakText,
  voiceFilled = false,
  error,
  onFormUpdate,
  onFieldHighlighted,
  confirmOverwrite,
  voiceDisabled,
  onStatusChange,
  onTranscriptionChange,
  onError,
  children
}: VoiceDonationFieldProps) {
  const voiceProps = {
    field,
    form,
    speakText,
    onFormUpdate,
    onFieldHighlighted,
    confirmOverwrite,
    disabled: voiceDisabled,
    onStatusChange,
    onTranscriptionChange,
    onError
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-base font-medium">
          {label}
        </label>
        <VoiceFieldButton {...voiceProps} />
      </div>
      <div
        className={
          voiceFilled ? "rounded-lg ring-2 ring-ravively-green/30 [&_*]:border-ravively-green/50" : ""
        }
      >
        {children}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export { fieldClass };
