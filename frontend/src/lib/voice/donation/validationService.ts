import { ALLERGENS, CATEGORIES, UNITS } from "../../constants";
import type { Allergen, DonationCategory, DonationUnit } from "../../types";
import type {
  DonationFormPatch,
  DonationFormVoiceState,
  DonationVoiceField,
  FieldDonationExtractResponse,
  GlobalDonationExtraction
} from "./types";

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.value));
const VALID_UNITS = new Set(UNITS.map((u) => u.value));
const VALID_ALLERGENS = new Set(ALLERGENS.map((a) => a.value));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ValidationResult =
  | { ok: true; patch: DonationFormPatch }
  | { ok: false; errors: string[] };

function isAllergen(value: string): value is Allergen {
  return VALID_ALLERGENS.has(value as Allergen);
}

export function validateGlobalExtraction(data: GlobalDonationExtraction): ValidationResult {
  const errors: string[] = [];
  const patch: DonationFormPatch = {};

  if (data.productName?.trim()) patch.title = data.productName.trim();

  if (data.category?.trim()) {
    if (VALID_CATEGORIES.has(data.category as DonationCategory)) {
      patch.category = data.category as DonationCategory;
    } else {
      errors.push(`Catégorie invalide : ${data.category}`);
    }
  }

  if (data.quantity !== null && data.quantity !== undefined) {
    const q = Number(data.quantity);
    if (Number.isFinite(q) && q > 0) patch.quantity = q;
    else errors.push("Quantité invalide.");
  }

  if (data.unit?.trim()) {
    if (VALID_UNITS.has(data.unit as DonationUnit)) patch.unit = data.unit as DonationUnit;
    else errors.push(`Unité invalide : ${data.unit}`);
  }

  if (data.expirationDate?.trim()) {
    if (DATE_RE.test(data.expirationDate)) patch.expirationDate = data.expirationDate;
    else errors.push("Date DLC invalide (attendu YYYY-MM-DD).");
  }

  if (Array.isArray(data.allergens) && data.allergens.length > 0) {
    const valid = data.allergens.filter(isAllergen);
    const invalid = data.allergens.filter((a) => !isAllergen(a));
    if (invalid.length) errors.push(`Allergènes ignorés : ${invalid.join(", ")}`);
    if (valid.length) patch.allergens = valid;
  }

  if (data.pickupInstructions?.trim()) patch.pickupInstructions = data.pickupInstructions.trim();

  if (Object.keys(patch).length === 0) {
    return { ok: false, errors: errors.length ? errors : ["Aucune donnée valide extraite."] };
  }

  return { ok: true, patch };
}

export function validateFieldExtraction(
  response: FieldDonationExtractResponse["data"]
): ValidationResult {
  const errors: string[] = [];
  const patch: DonationFormPatch = {};
  const { field, value } = response;

  switch (field) {
    case "title":
      if (typeof value === "string" && value.trim()) patch.title = value.trim();
      break;
    case "category":
      if (typeof value === "string" && VALID_CATEGORIES.has(value as DonationCategory)) {
        patch.category = value as DonationCategory;
      } else errors.push("Catégorie invalide.");
      break;
    case "quantity": {
      const q = Number(value);
      if (Number.isFinite(q) && q > 0) patch.quantity = q;
      else errors.push("Quantité invalide.");
      break;
    }
    case "unit":
      if (typeof value === "string" && VALID_UNITS.has(value as DonationUnit)) {
        patch.unit = value as DonationUnit;
      } else errors.push("Unité invalide.");
      break;
    case "expirationDate":
      if (typeof value === "string" && DATE_RE.test(value)) patch.expirationDate = value;
      else errors.push("Date DLC invalide.");
      break;
    case "allergens":
      if (Array.isArray(value)) {
        const valid = value.filter((a): a is Allergen => typeof a === "string" && isAllergen(a));
        if (valid.length) patch.allergens = valid;
        else errors.push("Aucun allergène valide détecté.");
      }
      break;
    case "pickupInstructions":
      if (typeof value === "string" && value.trim()) patch.pickupInstructions = value.trim();
      break;
    default:
      errors.push("Champ inconnu.");
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, errors: errors.length ? errors : ["Aucune donnée valide extraite."] };
  }

  return { ok: true, patch };
}

export function getMissingRequiredFields(form: DonationFormVoiceState): DonationVoiceField[] {
  const missing: DonationVoiceField[] = [];
  if (!form.title.trim()) missing.push("title");
  if (!form.category) missing.push("category");
  if (!form.quantity || Number(form.quantity) <= 0) missing.push("quantity");
  if (!form.unit) missing.push("unit");
  if (!form.expirationDate) missing.push("expirationDate");
  return missing;
}

export function formToApiContext(form: DonationFormVoiceState) {
  return {
    title: form.title || undefined,
    category: form.category || undefined,
    quantity: form.quantity ? Number(form.quantity) : undefined,
    unit: form.unit || undefined,
    expirationDate: form.expirationDate || undefined,
    allergens: form.allergens,
    pickupInstructions: form.pickupInstructions || undefined
  };
}
