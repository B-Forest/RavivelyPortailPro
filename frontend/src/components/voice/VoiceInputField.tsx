"use client";

import type { ChangeEvent } from "react";
import type { AssociationProfilePayload } from "../../lib/types";
import type { ConfirmOverwriteFn } from "../../lib/voice/formAutoFillService";
import type { VoiceProfileField, VoiceStatus } from "../../lib/voice/types";
import { VoiceFieldButton } from "./VoiceFieldButton";

type VoiceInputFieldProps = {
  field: VoiceProfileField;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  form: AssociationProfilePayload;
  voiceFilled: boolean;
  onFormUpdate: (form: AssociationProfilePayload) => void;
  onFieldHighlighted: (field: VoiceProfileField) => void;
  confirmOverwrite: ConfirmOverwriteFn;
  voiceDisabled?: boolean;
  onStatusChange?: (status: VoiceStatus) => void;
  onError?: (message: string) => void;
};

export function VoiceInputField({
  field,
  label,
  type = "text",
  value,
  onChange,
  form,
  voiceFilled,
  onFormUpdate,
  onFieldHighlighted,
  confirmOverwrite,
  voiceDisabled = false,
  onStatusChange,
  onError
}: VoiceInputFieldProps) {
  return (
    <div>
      <label htmlFor={`profile-${field}`} className="mb-1 block text-base font-medium">
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-lg border bg-white ${
          voiceFilled ? "border-ravively-green/40 bg-green-50/20" : "border-gray-300"
        }`}
      >
        <input
          id={`profile-${field}`}
          type={type}
          value={value}
          onChange={onChange}
          className="min-w-0 flex-1 rounded-lg border-0 bg-transparent py-3 pl-4 pr-[4.5rem] text-lg outline-none"
        />
        <div className="absolute right-0 flex items-center pr-1">
          <VoiceFieldButton
            field={field}
            form={form}
            onFormUpdate={onFormUpdate}
            onFieldHighlighted={onFieldHighlighted}
            confirmOverwrite={confirmOverwrite}
            disabled={voiceDisabled}
            onStatusChange={onStatusChange}
            onError={onError}
          />
        </div>
      </div>
    </div>
  );
}
