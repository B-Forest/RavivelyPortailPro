import type { AssociationProfilePayload } from "../types";
import type { VoiceProfileField } from "./types";
import { VOICE_FIELD_LABELS } from "./types";

export type ConfirmOverwriteFn = (
  field: VoiceProfileField,
  currentValue: string,
  newValue: string
) => Promise<boolean>;

export class FormAutoFillService {
  async applyGlobal(
    currentForm: AssociationProfilePayload,
    extracted: Partial<AssociationProfilePayload>,
    confirmOverwrite: ConfirmOverwriteFn
  ) {
    const form = { ...currentForm };
    const filledFields: VoiceProfileField[] = [];
    const skippedFields: VoiceProfileField[] = [];

    for (const [key, newValue] of Object.entries(extracted) as [VoiceProfileField, string][]) {
      if (!newValue?.trim()) continue;
      const currentValue = (form[key] as string | undefined) ?? "";
      if (currentValue.trim() && currentValue.trim() !== newValue.trim()) {
        if (!(await confirmOverwrite(key, currentValue, newValue))) {
          skippedFields.push(key);
          continue;
        }
      }
      form[key] = newValue.trim();
      filledFields.push(key);
    }

    return { form, filledFields, skippedFields };
  }

  async applyField(
    currentForm: AssociationProfilePayload,
    field: VoiceProfileField,
    value: string,
    confirmOverwrite: ConfirmOverwriteFn
  ) {
    const trimmed = value.trim();
    if (!trimmed) return { form: currentForm, filledFields: [], skippedFields: [field] };

    const currentValue = (currentForm[field] as string | undefined) ?? "";
    if (currentValue.trim() && currentValue.trim() !== trimmed) {
      if (!(await confirmOverwrite(field, currentValue, trimmed))) {
        return { form: currentForm, filledFields: [], skippedFields: [field] };
      }
    }

    return { form: { ...currentForm, [field]: trimmed }, filledFields: [field], skippedFields: [] };
  }

  buildFormSummary(form: AssociationProfilePayload): string {
    return (Object.keys(VOICE_FIELD_LABELS) as VoiceProfileField[])
      .map((field) => `${VOICE_FIELD_LABELS[field]} : ${(form[field] as string | undefined)?.trim() || "non renseigné"}`)
      .join(". ");
  }
}

export const formAutoFillService = new FormAutoFillService();
