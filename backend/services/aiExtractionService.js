const GLOBAL_SCHEMA = {
  associationName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  siret: ""
};

const FIELD_KEYS = ["name", "email", "phone", "address", "city", "postalCode", "siret"];

const FIELD_LABELS = {
  name: "Nom de l'association",
  email: "Email de contact",
  phone: "Téléphone",
  address: "Adresse",
  city: "Ville",
  postalCode: "Code postal",
  siret: "SIRET"
};

const GLOBAL_TO_FORM = {
  associationName: "name",
  email: "email",
  phone: "phone",
  address: "address",
  city: "city",
  postalCode: "postalCode",
  siret: "siret"
};

const { callLLM } = require("./llmClient");

function hasNonEmptyValue(obj) {
  return Object.values(obj).some((v) => typeof v === "string" && v.trim() !== "");
}

async function extractGlobal(transcription) {
  const systemPrompt = `Tu es un assistant qui extrait des informations de profil d'association à partir de phrases naturelles en français.
Retourne UNIQUEMENT un JSON strict :
{"associationName":"","email":"","phone":"","address":"","city":"","postalCode":"","siret":""}
Comprends le sens même si l'ordre diffère. Normalise téléphone (format FR) et SIRET (14 chiffres). N'invente rien.`;

  const parsed = await callLLM(systemPrompt, `Dictée : "${transcription}"`);
  const result = { ...GLOBAL_SCHEMA };
  for (const key of Object.keys(GLOBAL_SCHEMA)) {
    if (typeof parsed[key] === "string") result[key] = parsed[key].trim();
  }

  if (!hasNonEmptyValue(result)) {
    const err = new Error("Aucune donnée détectée dans la dictée.");
    err.code = "NO_DATA_EXTRACTED";
    err.status = 422;
    throw err;
  }

  return result;
}

async function extractField(transcription, field) {
  if (!FIELD_KEYS.includes(field)) {
    const err = new Error("Champ cible invalide.");
    err.status = 400;
    throw err;
  }

  const label = FIELD_LABELS[field];
  const systemPrompt = `Extrais UNE valeur pour le champ "${label}" (clé: "${field}").
Retourne UNIQUEMENT : {"field":"${field}","value":"valeur extraite"}
Si rien de pertinent, "value": "". N'invente rien.`;

  const parsed = await callLLM(systemPrompt, `Dictée : "${transcription}"`);
  const value = typeof parsed.value === "string" ? parsed.value.trim() : "";

  if (!value) {
    const err = new Error(`Aucune donnée détectée pour le champ « ${label} ».`);
    err.code = "NO_DATA_EXTRACTED";
    err.status = 422;
    throw err;
  }

  return { field, value };
}

function mapGlobalToForm(globalData) {
  const formData = {};
  for (const [globalKey, formKey] of Object.entries(GLOBAL_TO_FORM)) {
    const val = globalData[globalKey];
    if (typeof val === "string" && val.trim() !== "") formData[formKey] = val.trim();
  }
  return formData;
}

module.exports = { extractGlobal, extractField, mapGlobalToForm, FIELD_KEYS };
