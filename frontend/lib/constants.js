export const CATEGORIES = [
  { value: "fruits_legumes", label: "Fruits et Légumes" },
  { value: "produits_frais", label: "Produits Frais (Laitages / Viandes)" },
  { value: "epicerie", label: "Épicerie Sèche" },
  { value: "plats_prepares", label: "Plats Préparés / Cantine" }
];

export const UNITS = [
  { value: "kg", label: "Kilos" },
  { value: "portion", label: "Portions individuelles" },
  { value: "litre", label: "Litres" }
];

export const STATUSES = {
  available: { label: "Disponible", color: "bg-green-100 text-green-800" },
  reserved: { label: "Réservé", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "En cours de récupération", color: "bg-blue-100 text-blue-800" },
  collected: { label: "Récupéré", color: "bg-gray-200 text-gray-700" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" }
};

export const ALLERGENS = [
  { value: "gluten", label: "Gluten" },
  { value: "lait", label: "Lait" },
  { value: "oeufs", label: "Œufs" },
  { value: "arachides", label: "Arachides" },
  { value: "soja", label: "Soja" },
  { value: "fruits_a_coque", label: "Fruits à coque" },
  { value: "poisson", label: "Poisson" },
  { value: "crustaces", label: "Crustacés" }
];
