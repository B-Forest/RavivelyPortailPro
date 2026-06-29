"use client";

import { useCallback, useRef, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { CATEGORIES, UNITS, ALLERGENS } from "../../../lib/constants";
import { VoiceTextField } from "../../../components/voice/VoiceTextField";
import { ConfirmOverwriteModal } from "../../../components/ConfirmOverwriteModal";
import type { Allergen, CreateDonationPayload, DonationCategory, DonationUnit } from "../../../lib/types";
import { getErrorMessage } from "../../../lib/types";
import type { DonationFormVoiceState, DonationVoiceField } from "../../../lib/voice/donation/types";
import { DONATION_VOICE_FIELD_LABELS } from "../../../lib/voice/donation/types";
import { donationAIExtractionService } from "../../../lib/voice/donation/aiExtractionService";
import { donationAutoFillService } from "../../../lib/voice/donation/donationAutoFillService";
import { validateFieldExtraction, validateGlobalExtraction } from "../../../lib/voice/donation/validationService";
import { CATEGORIES as CAT_LIST, UNITS as UNIT_LIST } from "../../../lib/constants";

type DonationFormErrors = Partial<Record<keyof DonationFormVoiceState, string>>;

const initialState: DonationFormVoiceState = {
  title: "",
  category: "",
  quantity: "",
  unit: "",
  expirationDate: "",
  allergens: [],
  pickupInstructions: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-ravively-green focus:outline-none";

export default function NewDonationPage() {
  const router = useRouter();
  const [form, setForm] = useState<DonationFormVoiceState>(initialState);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<DonationFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [voiceFilled, setVoiceFilled] = useState<Set<DonationVoiceField>>(new Set());
  const [globalFillMessage, setGlobalFillMessage] = useState<string | null>(null);

  // ── Confirm overwrite modal (replaces window.confirm) ──
  type ModalState = { fieldLabel: string; currentValue: string; newValue: string };
  const [confirmModal, setConfirmModal] = useState<ModalState | null>(null);
  const confirmResolveRef = useRef<((v: boolean) => void) | null>(null);

  /** Human-readable display for a raw field value */
  function toDisplayValue(field: DonationVoiceField, raw: string): string {
    if (field === "category") return CAT_LIST.find((c) => c.value === raw)?.label ?? raw;
    if (field === "unit") return UNIT_LIST.find((u) => u.value === raw)?.label ?? raw;
    return raw;
  }

  const openConfirmModal = useCallback(
    (field: DonationVoiceField, currentRaw: string, newRaw: string): Promise<boolean> =>
      new Promise((resolve) => {
        confirmResolveRef.current = resolve;
        setConfirmModal({
          fieldLabel: DONATION_VOICE_FIELD_LABELS[field],
          currentValue: toDisplayValue(field, currentRaw),
          newValue: toDisplayValue(field, newRaw),
        });
      }),
    []
  );

  const handleModalConfirm = () => {
    setConfirmModal(null);
    confirmResolveRef.current?.(true);
  };

  const handleModalCancel = () => {
    setConfirmModal(null);
    confirmResolveRef.current?.(false);
  };

  function update(field: keyof DonationFormVoiceState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };
  }

  function toggleAllergen(value: Allergen) {
    setForm((f) => {
      const has = f.allergens.includes(value);
      return { ...f, allergens: has ? f.allergens.filter((a) => a !== value) : [...f.allergens, value] };
    });
  }

  function validate(): boolean {
    const errs: DonationFormErrors = {};
    if (!form.title.trim()) errs.title = "Veuillez indiquer le nom du produit (ex : Pains et viennoiseries du jour).";
    if (!form.category) errs.category = "Veuillez choisir une catégorie.";
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = "Veuillez indiquer le nombre de kilos, cagettes ou portions.";
    if (!form.unit) errs.unit = "Veuillez choisir une unité.";
    if (!form.expirationDate) errs.expirationDate = "Veuillez indiquer la date limite de consommation (DLC).";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildPayload(): CreateDonationPayload {
    return {
      title: form.title.trim(),
      category: form.category as DonationCategory,
      quantity: Number(form.quantity),
      unit: form.unit as DonationUnit,
      expirationDate: form.expirationDate,
      allergens: form.allergens,
      pickupInstructions: form.pickupInstructions || undefined,
      description: description || undefined
    };
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.createDonation(buildPayload());
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? getErrorMessage(err, "Impossible d'enregistrer le don.") : "Impossible d'enregistrer le don.");
    } finally {
      setSubmitting(false);
    }
  }

  /** Global: fill all fields from one spoken phrase */
  const handleGlobalVoice = useCallback(
    async (transcription: string) => {
      const response = await donationAIExtractionService.extractGlobal(transcription, form);
      const validated = validateGlobalExtraction(response.data);
      if (!validated.ok) throw new Error(validated.errors.join(" "));

      const result = await donationAutoFillService.applyPatch(
        form,
        validated.patch,
        openConfirmModal
      );

      if (result.filledFields.length === 0) {
        throw new Error("Aucune donnée détectée dans votre phrase.");
      }

      setForm(result.form);
      setVoiceFilled((prev) => new Set([...prev, ...result.filledFields]));
      setGlobalFillMessage(
        `Rempli : ${result.filledFields.map((f) => DONATION_VOICE_FIELD_LABELS[f]).join(", ")}.`
      );
    },
    [form]
  );

  /** Apply voice extraction for a single form field */
  const makeVoiceHandler = useCallback(
    (field: DonationVoiceField) => async (transcription: string) => {
      const response = await donationAIExtractionService.extractField(transcription, field, form);
      const validated = validateFieldExtraction(response.data);
      if (!validated.ok) throw new Error(validated.errors.join(" "));

      const result = await donationAutoFillService.applyPatch(
        form,
        validated.patch,
        openConfirmModal
      );

      if (result.filledFields.length === 0) {
        throw new Error(`Aucune donnée détectée pour « ${DONATION_VOICE_FIELD_LABELS[field]} ».`);
      }

      setForm(result.form);
      setVoiceFilled((prev) => new Set([...prev, field]));
    },
    [form]
  );

  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 text-3xl font-bold text-ravively-green">Déclarer un nouveau don</h1>
        <p className="mb-6 text-lg text-gray-600">Remplissez ce formulaire simple, étape par étape.</p>

        <form onSubmit={handleSubmit} className="card space-y-5" aria-label="Formulaire de déclaration de don">

          {/* ── Assistant vocal global ── */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Décrire le don en une phrase
            </p>
            <VoiceTextField
              value=""
              onChange={() => {}}
              onVoiceSubmit={handleGlobalVoice}
              placeholder="Ex : « Je donne 30 pains au chocolat, la DLC c'est demain, il y a du gluten et du lait. Les bénévoles peuvent passer par la porte de service à partir de 14h. »"
              multiline
              rows={2}
              disabled={submitting}
            />
            {globalFillMessage && (
              <p className="text-sm text-ravively-green font-medium" role="status">
                ✓ {globalFillMessage}
              </p>
            )}
          </div>

          {/* 1. Produit */}
          <div>
            <label htmlFor="title" className="mb-1 block text-base font-medium">
              1. Quel produit donnez-vous ? *
            </label>
            <VoiceTextField
              id="title"
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
              onVoiceSubmit={makeVoiceHandler("title")}
              placeholder="Ex : Pains et viennoiseries du jour"
              voiceFilled={voiceFilled.has("title")}
              disabled={submitting}
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          {/* 2. Catégorie */}
          <div>
            <label htmlFor="category" className="mb-1 block text-base font-medium">
              2. Catégorie *
            </label>
            <select id="category" value={form.category} onChange={update("category")} className={inputClass}>
              <option value="">Choisissez une catégorie</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="field-error">{errors.category}</p>}
          </div>

          {/* 3. Quantité + Unité */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="quantity" className="mb-1 block text-base font-medium">
                3. Quantité *
              </label>
              <input
                id="quantity"
                type="number"
                min="0.1"
                step="0.1"
                value={form.quantity}
                onChange={update("quantity")}
                placeholder="Ex : 30"
                className={inputClass}
              />
              {errors.quantity && <p className="field-error">{errors.quantity}</p>}
            </div>
            <div>
              <label htmlFor="unit" className="mb-1 block text-base font-medium">
                Unité *
              </label>
              <select id="unit" value={form.unit} onChange={update("unit")} className={inputClass}>
                <option value="">Choisissez une unité</option>
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
              {errors.unit && <p className="field-error">{errors.unit}</p>}
            </div>
          </div>

          {/* 4. DLC */}
          <div>
            <label htmlFor="expirationDate" className="mb-1 block text-base font-medium">
              4. Date limite de consommation (DLC) *
            </label>
            <input
              id="expirationDate"
              type="date"
              value={form.expirationDate}
              onChange={update("expirationDate")}
              className={inputClass}
            />
            {errors.expirationDate && <p className="field-error">{errors.expirationDate}</p>}
          </div>

          {/* 5. Allergènes */}
          <div>
            <p className="mb-2 text-base font-medium">5. Allergènes présents (si connus)</p>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => (
                <label
                  key={a.value}
                  className={`cursor-pointer rounded-full border px-3 py-2 text-sm ${
                    form.allergens.includes(a.value)
                      ? "border-ravively-green bg-ravively-green text-white"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.allergens.includes(a.value)}
                    onChange={() => toggleAllergen(a.value)}
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>

          {/* 6. Consignes */}
          <div>
            <label htmlFor="pickupInstructions" className="mb-1 block text-base font-medium">
              6. Consignes de récupération
            </label>
            <VoiceTextField
              id="pickupInstructions"
              value={form.pickupInstructions}
              onChange={(v) => setForm((f) => ({ ...f, pickupInstructions: v }))}
              onVoiceSubmit={makeVoiceHandler("pickupInstructions")}
              placeholder="Ex : Passer par la porte de service derrière la mairie"
              voiceFilled={voiceFilled.has("pickupInstructions")}
              disabled={submitting}
            />
          </div>

          {/* Précisions */}
          <div>
            <label htmlFor="description" className="mb-1 block text-base font-medium">
              Précisions complémentaires (optionnel)
            </label>
            <VoiceTextField
              id="description"
              value={description}
              onChange={setDescription}
              onVoiceSubmit={async (text) => setDescription(text)}
              placeholder="Informations supplémentaires sur le don…"
              multiline
              rows={3}
              disabled={submitting}
            />
          </div>

          {serverError && <p className="field-error" role="alert">{serverError}</p>}

          <div className="flex flex-wrap gap-4 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Enregistrement..." : "Valider le don"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="btn-ghost">
              Annuler
            </button>
          </div>
        </form>
      </div>

      <ConfirmOverwriteModal
        isOpen={!!confirmModal}
        fieldLabel={confirmModal?.fieldLabel ?? ""}
        currentValue={confirmModal?.currentValue ?? ""}
        newValue={confirmModal?.newValue ?? ""}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </main>
  );
}
