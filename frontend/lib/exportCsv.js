import { CATEGORIES, UNITS, STATUSES } from "./constants";

function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}
function unitLabel(value) {
  return UNITS.find((u) => u.value === value)?.label || value;
}
function statusLabel(value) {
  return STATUSES[value]?.label || value;
}

function formatDateFR(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

// Échappe les guillemets et virgules pour un champ CSV
function csvField(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportDonationsToCSV(donations, filename = "dons-ravively.csv") {
  const headers = ["Titre", "Catégorie", "Quantité", "Unité", "DLC", "Statut", "Allergènes", "Créé le"];

  const rows = donations.map((d) => [
    csvField(d.title),
    csvField(categoryLabel(d.category)),
    csvField(d.quantity),
    csvField(unitLabel(d.unit)),
    csvField(formatDateFR(d.expirationDate)),
    csvField(statusLabel(d.status)),
    csvField((d.allergens || []).join(" / ")),
    csvField(formatDateFR(d.createdAt))
  ]);

  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
