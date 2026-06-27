export type DonationCategory = "fruits_legumes" | "produits_frais" | "epicerie" | "plats_prepares";
export type DonationUnit = "kg" | "portion" | "litre";
export type DonationStatus = "available" | "reserved" | "in_progress" | "collected" | "cancelled";
export type Allergen =
  | "gluten"
  | "lait"
  | "oeufs"
  | "arachides"
  | "soja"
  | "fruits_a_coque"
  | "poisson"
  | "crustaces";

export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  associationId: string | null;
}

export interface Donation {
  _id: string;
  associationId: string;
  title: string;
  description?: string;
  category: DonationCategory;
  quantity: number;
  unit: DonationUnit;
  expirationDate: string;
  allergens: Allergen[];
  pickupInstructions?: string;
  status: DonationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface DonationStats {
  totalDonations: number;
  availableDonations: number;
  collectedDonations: number;
}

export interface Association {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  siret?: string;
}

export interface AssociationProfilePayload {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  siret?: string;
}

export interface DetailedDonationStats {
  totalDonations: number;
  byStatus: Partial<Record<DonationStatus, number>>;
  byCategory: Partial<Record<DonationCategory, number>>;
  quantityByUnit: Partial<Record<DonationUnit, number>>;
  quantitySavedByUnit: Partial<Record<DonationUnit, number>>;
  mealsEstimate: number;
}

export interface RegisterAssociationPayload {
  associationName: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  city?: string;
  phone?: string;
}

export interface CreateDonationPayload {
  title: string;
  category: DonationCategory;
  quantity: number;
  unit: DonationUnit;
  expirationDate: string;
  allergens: Allergen[];
  pickupInstructions?: string;
  description?: string;
}

export interface ApiErrorDetails {
  message?: string;
  errors?: string[];
  error?: string;
}

export interface ApiError extends Error {
  status?: number;
  details?: ApiErrorDetails;
}

export function getErrorMessage(err: Error, fallback: string): string {
  return err.message || fallback;
}

export function isApiError(err: Error): err is ApiError {
  return "status" in err;
}
