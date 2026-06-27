import { CATEGORIES, UNITS, STATUSES } from "./constants";
import type { Donation, DonationCategory, DonationStatus, DonationUnit } from "./types";

function categoryLabel(value: DonationCategory) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

function unitLabel(value: DonationUnit) {
  return UNITS.find((u) => u.value === value)?.label || value;
}

function statusLabel(value: DonationStatus) {
  return STATUSES[value]?.label || value;
}

function formatDateFR(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function csvField(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportDonationsToCSV(donations: Donation[], filename = "dons-ravively.csv") {
  const headers = ["Titre", "Catégorie", "Quantité", "Unité", "DLC", "Statut", "Allergènes", "Créé le"];

  const rows = donations.map((d) => [
    csvField(d.title),
    csvField(categoryLabel(d.category)),
    csvField(d.quantity),
    csvField(unitLabel(d.unit)),
    csvField(formatDateFR(d.expirationDate)),
    csvField(statusLabel(d.status)),
    csvField((d.allergens || []).join(" / ")),
    csvField(d.createdAt ? formatDateFR(d.createdAt) : "")
  ]);

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
