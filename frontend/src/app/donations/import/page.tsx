"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { api } from "../../../lib/api";
import { CATEGORIES, UNITS, ALLERGENS } from "../../../lib/constants";
import type { Allergen, CreateDonationPayload, DonationCategory, DonationUnit } from "../../../lib/types";
import { EditDonationRowModal } from "../../../components/EditDonationRowModal";

// ── Column alias maps ──────────────────────────────────────────────────────────

const COL_ALIAS: Record<string, string> = {
  produit: "title", nom: "title", product: "title",
  "catégorie": "category", categorie: "category",
  "quantité": "quantity", quantite: "quantity", qte: "quantity",
  "unité": "unit", unite: "unit",
  dlc: "expirationDate", "date limite": "expirationDate", "date_limite": "expirationDate",
  expiration_date: "expirationDate", date: "expirationDate",
  "allergènes": "allergens", allergenes: "allergens",
  consignes: "pickupInstructions", pickup_instructions: "pickupInstructions",
  "précisions": "description", précision: "description"
};

const CAT_LABEL_MAP: Record<string, DonationCategory> = {};
CATEGORIES.forEach((c) => { CAT_LABEL_MAP[c.label.toLowerCase()] = c.value; CAT_LABEL_MAP[c.value] = c.value; });

const UNIT_LABEL_MAP: Record<string, DonationUnit> = {};
UNITS.forEach((u) => { UNIT_LABEL_MAP[u.label.toLowerCase()] = u.value; UNIT_LABEL_MAP[u.value] = u.value; });

const ALLERGEN_LABEL_MAP: Record<string, Allergen> = {};
ALLERGENS.forEach((a) => { ALLERGEN_LABEL_MAP[a.label.toLowerCase()] = a.value; ALLERGEN_LABEL_MAP[a.value] = a.value; });

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.value));
const VALID_UNITS = new Set(UNITS.map((u) => u.value));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── Types ──────────────────────────────────────────────────────────────────────

type RowErrors = string[];

export interface ParsedRow {
  data: Partial<CreateDonationPayload>;
  errors: RowErrors;
  raw: Record<string, string>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  const clean = h.trim().toLowerCase().replace(/\s+/g, "_");
  return COL_ALIAS[clean.replace(/_/g, " ")] ?? COL_ALIAS[clean] ?? clean;
}

function parseDate(raw: string): string | null {
  const s = raw?.trim();
  if (!s) return null;
  if (DATE_RE.test(s)) return s;
  // DD/MM/YYYY
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3 && parts[0].length <= 2) {
    const [d, m, y] = parts;
    return `${y.padStart(4, "20")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Excel serial date
  const serial = Number(s);
  if (!isNaN(serial) && serial > 1000) {
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().slice(0, 10);
  }
  return null;
}

function parseAllergens(raw: string): Allergen[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\/]/)
    .map((s) => s.trim().toLowerCase())
    .map((s) => ALLERGEN_LABEL_MAP[s])
    .filter(Boolean) as Allergen[];
}

function parseRow(raw: Record<string, string>): ParsedRow {
  const errors: RowErrors = [];
  const data: Partial<CreateDonationPayload> = {};

  // title
  const title = raw.title?.trim();
  if (!title) errors.push("Produit requis.");
  else data.title = title;

  // category
  const catRaw = raw.category?.trim().toLowerCase();
  const category = catRaw ? (CAT_LABEL_MAP[catRaw] ?? catRaw as DonationCategory) : undefined;
  if (!category) errors.push("Catégorie requise.");
  else if (!VALID_CATEGORIES.has(category)) errors.push(`Catégorie invalide : ${raw.category}`);
  else data.category = category;

  // quantity
  const qty = Number(raw.quantity);
  if (!raw.quantity || isNaN(qty) || qty <= 0) errors.push("Quantité invalide.");
  else data.quantity = qty;

  // unit
  const unitRaw = raw.unit?.trim().toLowerCase();
  const unit = unitRaw ? (UNIT_LABEL_MAP[unitRaw] ?? unitRaw as DonationUnit) : undefined;
  if (!unit) errors.push("Unité requise.");
  else if (!VALID_UNITS.has(unit)) errors.push(`Unité invalide : ${raw.unit}`);
  else data.unit = unit;

  // expirationDate
  const date = parseDate(raw.expirationDate ?? "");
  if (!date) errors.push("Date limite (DLC) requise au format JJ/MM/AAAA ou AAAA-MM-JJ.");
  else data.expirationDate = date;

  // allergens (optional)
  data.allergens = parseAllergens(raw.allergens ?? "");

  // optional
  if (raw.pickupInstructions?.trim()) data.pickupInstructions = raw.pickupInstructions.trim();
  if (raw.description?.trim()) data.description = raw.description.trim();

  return { data, errors, raw };
}

function parseSheet(sheet: XLSX.WorkSheet): ParsedRow[] {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return json.map((rawRow) => {
    const normalized: Record<string, string> = {};
    for (const [key, val] of Object.entries(rawRow)) {
      normalized[normalizeHeader(key)] = String(val ?? "");
    }
    return parseRow(normalized);
  });
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["produit", "catégorie", "quantité", "unité", "dlc", "allergènes", "consignes", "description"],
    ["Pains au chocolat", "Boulangerie / Viennoiserie", "30", "Portions individuelles", "28/06/2026", "gluten, lait", "Porte de service à partir de 14h", ""],
    ["Yaourts nature", "Produits Frais (Laitages / Viandes)", "15", "Kilos", "29/06/2026", "lait", "", ""],
  ]);
  // Note: category values must match constants — show label in template, user must respect them
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dons");
  XLSX.writeFile(wb, "modele-import-dons.xlsx");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImportDonationsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: { row: number; errors: string[] }[] } | null>(null);
  const [fileError, setFileError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const handleFile = useCallback((file: File) => {
    setFileError("");
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsed = parseSheet(ws);
        if (parsed.length === 0) {
          setFileError("Le fichier est vide ou le format est incorrect.");
          return;
        }
        setRows(parsed);
      } catch {
        setFileError("Impossible de lire le fichier. Vérifiez qu'il s'agit d'un CSV ou Excel valide.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSaveEdit = (rowIndex: number, data: Partial<CreateDonationPayload>) => {
    setRows((prev) => {
      const updated = [...prev];
      const reparsed = parseRow(
        Object.fromEntries(
          Object.entries({ ...updated[rowIndex].raw, ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v ?? "")])
          )})
        )
      );
      // Override with direct values from the form (already validated by UI)
      const direct: Partial<CreateDonationPayload> = {
        title: data.title,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        expirationDate: data.expirationDate,
        allergens: data.allergens ?? [],
        pickupInstructions: data.pickupInstructions,
        description: data.description,
      };
      const errors: string[] = [];
      if (!direct.title?.trim()) errors.push("Produit requis.");
      if (!direct.category) errors.push("Catégorie requise.");
      if (!direct.quantity || direct.quantity <= 0) errors.push("Quantité invalide.");
      if (!direct.unit) errors.push("Unité requise.");
      if (!direct.expirationDate) errors.push("Date limite requise.");
      updated[rowIndex] = { data: direct, errors, raw: updated[rowIndex].raw };
      return updated;
    });
    setEditingIndex(null);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const payload = validRows.map((r) => r.data as CreateDonationPayload);
      const res = await api.importDonationsBulk(payload);
      setResult(res);
      if (res.failed === 0) setRows([]);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ravively-green">Import en masse</h1>
            <p className="mt-1 text-lg text-gray-600">Importez plusieurs dons depuis un fichier CSV ou Excel.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadTemplate} className="btn-secondary btn-sm">
              Télécharger le modèle
            </button>
            <button onClick={() => router.push("/dashboard")} className="btn-ghost btn-sm">
              Retour
            </button>
          </div>
        </div>

        {/* Format guide */}
        <div className="card mb-6 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ravively-green">Obligatoires</span>
              {["produit", "catégorie", "quantité", "unité", "dlc"].map((col) => (
                <span key={col} className="rounded bg-ravively-green px-2 py-0.5 text-xs font-bold text-white">{col}</span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Facultatives</span>
              {["allergènes", "consignes", "description"].map((col) => (
                <span key={col} className="rounded bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">{col}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400">Catégories : {CATEGORIES.map(c => c.label).join(" · ")}</p>
          </div>

          {/* Mini preview table */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Exemple de fichier valide</p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {["produit", "catégorie", "quantité", "unité", "dlc", "allergènes", "consignes"].map(h => (
                      <th key={h} className="px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100 text-gray-700">
                    <td className="px-3 py-2">Pains au chocolat</td>
                    <td className="px-3 py-2">Épicerie Sèche</td>
                    <td className="px-3 py-2">30</td>
                    <td className="px-3 py-2">Portions individuelles</td>
                    <td className="px-3 py-2">28/06/2026</td>
                    <td className="px-3 py-2">gluten, lait</td>
                    <td className="px-3 py-2">Porte de service à 14h</td>
                  </tr>
                  <tr className="border-t border-gray-100 text-gray-500 italic">
                    <td className="px-3 py-2">Yaourts nature</td>
                    <td className="px-3 py-2">Produits Frais…</td>
                    <td className="px-3 py-2">15</td>
                    <td className="px-3 py-2">Kilos</td>
                    <td className="px-3 py-2">29/06/2026</td>
                    <td className="px-3 py-2">lait</td>
                    <td className="px-3 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Drop zone */}
        {rows.length === 0 && !result && (
          <div
            className="card flex cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-300 py-16 text-center transition-colors hover:border-ravively-green"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-12 w-12 text-gray-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-700">Glissez votre fichier ici</p>
              <p className="text-gray-500">ou cliquez pour choisir un fichier CSV ou Excel</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        )}

        {fileError && <p className="field-error mt-2">{fileError}</p>}

        {/* Result banner */}
        {result && (
          <div className={`card mb-4 ${result.failed === 0 ? "border-l-4 border-ravively-green" : "border-l-4 border-amber-500"}`}>
            <p className="font-semibold">
              ✓ {result.created} don{result.created > 1 ? "s" : ""} importé{result.created > 1 ? "s" : ""} avec succès.
              {result.failed > 0 && ` ${result.failed} ligne${result.failed > 1 ? "s" : ""} en erreur.`}
            </p>
            {result.errors.map(({ row, errors }) => (
              <p key={row} className="field-error text-sm">Ligne {row} : {errors.join(" ")}</p>
            ))}
            {result.failed === 0 && (
              <button onClick={() => router.push("/dashboard")} className="btn-primary btn-sm mt-3">
                Voir le tableau de bord
              </button>
            )}
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && !result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{fileName}</p>
                <p className="text-sm text-gray-500">
                  {rows.length} ligne{rows.length > 1 ? "s" : ""} —{" "}
                  <span className="text-ravively-green font-medium">{validRows.length} valide{validRows.length > 1 ? "s" : ""}</span>
                  {invalidRows.length > 0 && (
                    <span className="ml-1 text-red-600 font-medium">, {invalidRows.length} en erreur</span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setRows([]); setFileName(""); }} className="btn-ghost btn-sm">
                  Changer de fichier
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="btn-primary btn-sm"
                >
                  {importing ? "Import en cours…" : `Importer ${validRows.length} don${validRows.length > 1 ? "s" : ""}`}
                </button>
              </div>
            </div>

            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Produit</th>
                    <th className="px-4 py-3 font-medium">Catégorie</th>
                    <th className="px-4 py-3 font-medium">Qté / Unité</th>
                    <th className="px-4 py-3 font-medium">DLC</th>
                    <th className="px-4 py-3 font-medium">Allergènes</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const catLabel = CATEGORIES.find((c) => c.value === row.data.category)?.label ?? row.data.category ?? "—";
                    const unitLabel = UNITS.find((u) => u.value === row.data.unit)?.label ?? row.data.unit ?? "—";
                    const allergenLabels = (row.data.allergens ?? [])
                      .map((a) => ALLERGENS.find((x) => x.value === a)?.label ?? a)
                      .join(", ");
                    const hasError = row.errors.length > 0;
                    return (
                      <tr key={i} className={`border-b border-gray-50 ${hasError ? "bg-red-50" : ""}`}>
                        <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium">{row.data.title ?? <span className="text-red-500 italic">manquant</span>}</td>
                        <td className="px-4 py-2.5">{catLabel}</td>
                        <td className="px-4 py-2.5">
                          {row.data.quantity ?? "—"} {unitLabel}
                        </td>
                        <td className="px-4 py-2.5">{row.data.expirationDate ?? <span className="text-red-500 italic">invalide</span>}</td>
                        <td className="px-4 py-2.5 text-gray-600">{allergenLabels || "—"}</td>
                        <td className="px-4 py-2.5">
                          {hasError ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                Erreur
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingIndex(i)}
                                className="text-xs font-medium text-ravively-green underline underline-offset-2 hover:no-underline"
                              >
                                Modifier
                              </button>
                            </div>
                          ) : (
                            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {invalidRows.length > 0 && (
              <div className="card border-l-4 border-red-400 space-y-1">
                <p className="font-semibold text-red-700">Lignes en erreur (non importées)</p>
                {invalidRows.map((row, i) => {
                  const origIndex = rows.indexOf(row) + 1;
                  return (
                    <p key={i} className="text-sm text-red-600">
                      Ligne {origIndex} : {row.errors.join(" ")}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <EditDonationRowModal
        isOpen={editingIndex !== null}
        rowIndex={editingIndex ?? 0}
        initial={rows[editingIndex ?? 0]?.data ?? {}}
        errors={rows[editingIndex ?? 0]?.errors ?? []}
        onSave={handleSaveEdit}
        onCancel={() => setEditingIndex(null)}
      />
    </main>
  );
}
