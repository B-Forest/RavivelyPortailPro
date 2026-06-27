import type { DonationCategory, DonationStatus, DonationUnit, Allergen } from "./types";

export const CATEGORIES: { value: DonationCategory; label: string }[] = [
  { value: "fruits_legumes", label: "Fruits et Légumes" },
  { value: "produits_frais", label: "Produits Frais (Laitages / Viandes)" },
  { value: "epicerie", label: "Épicerie Sèche" },
  { value: "plats_prepares", label: "Plats Préparés / Cantine" }
];

export const UNITS: { value: DonationUnit; label: string }[] = [
  { value: "kg", label: "Kilos" },
  { value: "portion", label: "Portions individuelles" },
  { value: "litre", label: "Litres" }
];

export const STATUSES: Record<DonationStatus, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-emerald-500 text-white" },
  reserved: { label: "Réservé", color: "bg-orange-500 text-white" },
  in_progress: { label: "En cours de récupération", color: "bg-blue-500 text-white" },
  collected: { label: "Récupéré", color: "bg-gray-400 text-white" },
  cancelled: { label: "Annulé", color: "bg-red-500 text-white" }
};

export const ALLERGENS: { value: Allergen; label: string }[] = [
  { value: "gluten", label: "Gluten" },
  { value: "lait", label: "Lait" },
  { value: "oeufs", label: "Œufs" },
  { value: "arachides", label: "Arachides" },
  { value: "soja", label: "Soja" },
  { value: "fruits_a_coque", label: "Fruits à coque" },
  { value: "poisson", label: "Poisson" },
  { value: "crustaces", label: "Crustacés" }
];
