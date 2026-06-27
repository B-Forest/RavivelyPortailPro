const { callLLM } = require("./llmClient");
const { DONATION_CATEGORY, DONATION_UNIT, ALLERGEN } = require("../models/Donation");

const GLOBAL_SCHEMA = {
  productName: "",
  category: "",
  quantity: null,
  unit: "",
  expirationDate: "",
  allergens: [],
  pickupInstructions: ""
};

const FIELD_KEYS = [
  "title",
  "category",
  "quantity",
  "unit",
  "expirationDate",
  "allergens",
  "pickupInstructions"
];

const FIELD_LABELS = {
  title: "Produit donné",
  category: "Catégorie",
  quantity: "Quantité",
  unit: "Unité",
  expirationDate: "Date limite de consommation (DLC)",
  allergens: "Allergènes présents",
  pickupInstructions: "Consignes de récupération"
};

const CATEGORY_HINTS = DONATION_CATEGORY.map(
  (v) => `${v} (${categoryLabel(v)})`
).join(", ");

function categoryLabel(value) {
  const labels = {
    fruits_legumes: "Fruits et Légumes",
    produits_frais: "Produits Frais / Boulangerie-Viennoiserie fraîche",
    epicerie: "Épicerie Sèche",
    plats_prepares: "Plats Préparés / Cantine"
  };
  return labels[value] || value;
}

function buildSystemContext() {
  const today = new Date().toISOString().split("T")[0];
  return `Date du jour (référence pour les dates relatives) : ${today}.
Catégories autorisées (clé exacte) : ${CATEGORY_HINTS}.
Unités autorisées (clé exacte) : kg, portion (pièces/unités individuelles), litre.
Allergènes autorisés (clés exactes) : ${ALLERGEN.join(", ")}.
Interprète les dates relatives (demain, après-demain, vendredi prochain, dans N jours) au format YYYY-MM-DD.
Déduis catégorie et unité si absentes mais évidentes. N'invente jamais de données absentes.`;
}

function hasExtractedData(data) {
  return (
    (data.productName && data.productName.trim()) ||
    (data.category && data.category.trim()) ||
    (typeof data.quantity === "number" && data.quantity > 0) ||
    (data.unit && data.unit.trim()) ||
    (data.expirationDate && data.expirationDate.trim()) ||
    (Array.isArray(data.allergens) && data.allergens.length > 0) ||
    (data.pickupInstructions && data.pickupInstructions.trim())
  );
}

function normalizeGlobal(parsed) {
  const result = {
    productName: typeof parsed.productName === "string" ? parsed.productName.trim() : "",
    category: typeof parsed.category === "string" ? parsed.category.trim() : "",
    quantity: typeof parsed.quantity === "number" ? parsed.quantity : null,
    unit: typeof parsed.unit === "string" ? parsed.unit.trim() : "",
    expirationDate: typeof parsed.expirationDate === "string" ? parsed.expirationDate.trim() : "",
    allergens: Array.isArray(parsed.allergens)
      ? parsed.allergens.filter((a) => typeof a === "string").map((a) => a.trim())
      : [],
    pickupInstructions: typeof parsed.pickupInstructions === "string" ? parsed.pickupInstructions.trim() : ""
  };
  return result;
}

function mapGlobalToForm(globalData) {
  const formData = {};
  if (globalData.productName) formData.title = globalData.productName;
  if (globalData.category) formData.category = globalData.category;
  if (typeof globalData.quantity === "number" && globalData.quantity > 0) {
    formData.quantity = globalData.quantity;
  }
  if (globalData.unit) formData.unit = globalData.unit;
  if (globalData.expirationDate) formData.expirationDate = globalData.expirationDate;
  if (globalData.allergens?.length) formData.allergens = globalData.allergens;
  if (globalData.pickupInstructions) formData.pickupInstructions = globalData.pickupInstructions;
  return formData;
}

async function extractGlobal(transcription, currentForm = null) {
  const systemPrompt = `Tu es un assistant qui extrait les informations d'un don alimentaire à partir d'une phrase naturelle en français.
${buildSystemContext()}

Retourne UNIQUEMENT un JSON strict :
{
  "productName": "",
  "category": "",
  "quantity": null,
  "unit": "",
  "expirationDate": "",
  "allergens": [],
  "pickupInstructions": ""
}

Si l'utilisateur corrige ou modifie une valeur existante (ex: "change la quantité à 40", "ajoute l'allergène lait"), applique la modification en tenant compte du formulaire actuel.`;

  let userPrompt = `Dictée : "${transcription}"`;
  if (currentForm && Object.keys(currentForm).length > 0) {
    userPrompt += `\n\nFormulaire actuel : ${JSON.stringify(currentForm)}`;
  }

  const parsed = await callLLM(systemPrompt, userPrompt);
  const result = normalizeGlobal(parsed);

  if (!hasExtractedData(result)) {
    const err = new Error("Aucune donnée détectée dans la dictée.");
    err.code = "NO_DATA_EXTRACTED";
    err.status = 422;
    throw err;
  }

  return result;
}

async function extractField(transcription, field, currentForm = null) {
  if (!FIELD_KEYS.includes(field)) {
    const err = new Error("Champ cible invalide.");
    err.status = 400;
    throw err;
  }

  const label = FIELD_LABELS[field];
  const systemPrompt = `Tu extrais UNE seule valeur pour le champ "${label}" (clé technique : "${field}").
${buildSystemContext()}

Retourne UNIQUEMENT :
{"field":"${field}","value":<valeur>}

Pour "allergens", value est un tableau de clés allergènes.
Pour "quantity", value est un nombre.
Pour "category" et "unit", value est une clé autorisée.
Pour "expirationDate", value est YYYY-MM-DD.
Pour les autres champs, value est une chaîne.
Si correction demandée, tiens compte du formulaire actuel.
Si rien de pertinent, value vide ("" ou [] ou null).`;

  let userPrompt = `Dictée : "${transcription}"`;
  if (currentForm && Object.keys(currentForm).length > 0) {
    userPrompt += `\n\nFormulaire actuel : ${JSON.stringify(currentForm)}`;
  }

  const parsed = await callLLM(systemPrompt, userPrompt);
  const value = parsed.value;

  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    const err = new Error(`Aucune donnée détectée pour le champ « ${label} ».`);
    err.code = "NO_DATA_EXTRACTED";
    err.status = 422;
    throw err;
  }

  return { field, value };
}

module.exports = {
  extractGlobal,
  extractField,
  mapGlobalToForm,
  FIELD_KEYS,
  FIELD_LABELS,
  DONATION_CATEGORY,
  DONATION_UNIT,
  ALLERGEN
};
