import type { AssociationProfilePayload } from "../types";

export type VoiceProfileField = keyof AssociationProfilePayload;
export type VoiceStatus = "idle" | "listening" | "analyzing" | "error";

export interface GlobalVoiceExtraction {
  associationName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  siret: string;
}

export interface FieldVoiceExtraction {
  field: VoiceProfileField;
  value: string;
}

export interface GlobalExtractResponse {
  transcription: string;
  mode: "global";
  data: GlobalVoiceExtraction;
  formData: Partial<AssociationProfilePayload>;
}

export interface FieldExtractResponse {
  transcription: string;
  mode: "field";
  data: FieldVoiceExtraction;
}

export const VOICE_FIELD_LABELS: Record<VoiceProfileField, string> = {
  name: "Nom de l'association",
  email: "Email de contact",
  phone: "Téléphone",
  address: "Adresse",
  city: "Ville",
  postalCode: "Code postal",
  siret: "SIRET"
};
