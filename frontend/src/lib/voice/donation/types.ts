import type { Allergen, DonationCategory, DonationUnit } from "../../types";

export type VoiceStatus = "idle" | "listening" | "analyzing" | "error";

export type DonationVoiceField =
  | "title"
  | "category"
  | "quantity"
  | "unit"
  | "expirationDate"
  | "allergens"
  | "pickupInstructions";

export interface DonationFormVoiceState {
  title: string;
  category: DonationCategory | "";
  quantity: string;
  unit: DonationUnit | "";
  expirationDate: string;
  allergens: Allergen[];
  pickupInstructions: string;
}

export interface GlobalDonationExtraction {
  productName: string;
  category: string;
  quantity: number | null;
  unit: string;
  expirationDate: string;
  allergens: string[];
  pickupInstructions: string;
}

export interface DonationFormPatch {
  title?: string;
  category?: DonationCategory;
  quantity?: number;
  unit?: DonationUnit;
  expirationDate?: string;
  allergens?: Allergen[];
  pickupInstructions?: string;
}

export interface GlobalDonationExtractResponse {
  transcription: string;
  mode: "global";
  data: GlobalDonationExtraction;
  formData: DonationFormPatch;
}

export interface FieldDonationExtractResponse {
  transcription: string;
  mode: "field";
  data: { field: DonationVoiceField; value: string | number | Allergen[] };
}

export const DONATION_VOICE_FIELD_LABELS: Record<DonationVoiceField, string> = {
  title: "Produit donné",
  category: "Catégorie",
  quantity: "Quantité",
  unit: "Unité",
  expirationDate: "Date limite de consommation",
  allergens: "Allergènes",
  pickupInstructions: "Consignes de récupération"
};

export const REQUIRED_DONATION_FIELDS: DonationVoiceField[] = [
  "title",
  "category",
  "quantity",
  "unit",
  "expirationDate"
];
