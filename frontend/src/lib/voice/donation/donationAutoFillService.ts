import type { Allergen } from "../../types";
import type {
  DonationFormPatch,
  DonationFormVoiceState,
  DonationVoiceField
} from "./types";
import { DONATION_VOICE_FIELD_LABELS } from "./types";

export type ConfirmOverwriteFn = (
  field: DonationVoiceField,
  currentDisplay: string,
  newDisplay: string
) => Promise<boolean>;

function displayValue(form: DonationFormVoiceState, field: DonationVoiceField): string {
  switch (field) {
    case "title":
      return form.title;
    case "category":
      return form.category;
    case "quantity":
      return form.quantity;
    case "unit":
      return form.unit;
    case "expirationDate":
      return form.expirationDate;
    case "allergens":
      return form.allergens.join(", ") || "";
    case "pickupInstructions":
      return form.pickupInstructions;
    default:
      return "";
  }
}

function patchToDisplay(field: DonationVoiceField, patch: DonationFormPatch): string {
  const val = patch[field as keyof DonationFormPatch];
  if (field === "allergens" && Array.isArray(val)) return val.join(", ");
  if (val === undefined || val === null) return "";
  return String(val);
}

function applyPatchToForm(form: DonationFormVoiceState, patch: DonationFormPatch): DonationFormVoiceState {
  const next = { ...form };

  if (patch.title !== undefined) next.title = patch.title;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.quantity !== undefined) next.quantity = String(patch.quantity);
  if (patch.unit !== undefined) next.unit = patch.unit;
  if (patch.expirationDate !== undefined) next.expirationDate = patch.expirationDate;
  if (patch.pickupInstructions !== undefined) next.pickupInstructions = patch.pickupInstructions;

  if (patch.allergens !== undefined) {
    const merged = new Set([...form.allergens, ...patch.allergens]);
    next.allergens = [...merged] as Allergen[];
  }

  return next;
}

export class DonationAutoFillService {
  async applyPatch(
    currentForm: DonationFormVoiceState,
    patch: DonationFormPatch,
    confirmOverwrite: ConfirmOverwriteFn,
    options?: { mergeAllergens?: boolean }
  ) {
    const mergeAllergens = options?.mergeAllergens ?? true;
    let workingPatch = { ...patch };
    const filledFields: DonationVoiceField[] = [];
    const skippedFields: DonationVoiceField[] = [];

    const fields = Object.keys(workingPatch) as (keyof DonationFormPatch)[];

    for (const key of fields) {
      const field = key as DonationVoiceField;
      if (workingPatch[key] === undefined) continue;

      const current = displayValue(currentForm, field);
      const incoming = patchToDisplay(field, workingPatch);

      if (field === "allergens" && mergeAllergens) {
        filledFields.push(field);
        continue;
      }

      if (current.trim() && current.trim() !== incoming.trim()) {
        const label = DONATION_VOICE_FIELD_LABELS[field];
        const confirmed = await confirmOverwrite(field, current, incoming);
        if (!confirmed) {
          skippedFields.push(field);
          delete workingPatch[key];
          continue;
        }
      }

      filledFields.push(field);
    }

    const form = applyPatchToForm(currentForm, workingPatch);
    return { form, filledFields, skippedFields };
  }

  buildFormSummary(form: DonationFormVoiceState): string {
    const parts = (Object.keys(DONATION_VOICE_FIELD_LABELS) as DonationVoiceField[]).map((field) => {
      const label = DONATION_VOICE_FIELD_LABELS[field];
      const value = displayValue(form, field) || "non renseigné";
      return `${label} : ${value}`;
    });
    return `Récapitulatif du don. ${parts.join(". ")}.`;
  }
}

export const donationAutoFillService = new DonationAutoFillService();
