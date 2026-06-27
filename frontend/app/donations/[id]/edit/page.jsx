"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import { CATEGORIES, UNITS, ALLERGENS } from "../../../../lib/constants";
import { CardSkeleton } from "../../../../components/Skeleton";

export default function EditDonationPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [form, setForm] = useState(null); // null = pas encore chargé
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { donation } = await api.getDonation(id);
        setForm({
          title: donation.title || "",
          category: donation.category || "",
          quantity: donation.quantity ?? "",
          unit: donation.unit || "",
          expirationDate: donation.expirationDate ? donation.expirationDate.slice(0, 10) : "",
          allergens: donation.allergens || [],
          pickupInstructions: donation.pickupInstructions || "",
          description: donation.description || ""
        });
      } catch (err) {
        setLoadError(err.message || "Impossible de charger ce don.");
      }
    }
    load();
  }, [id]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function toggleAllergen(value) {
    setForm((f) => {
      const has = f.allergens.includes(value);
      return { ...f, allergens: has ? f.allergens.filter((a) => a !== value) : [...f.allergens, value] };
    });
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = "Veuillez indiquer le nom du produit.";
    if (!form.category) errs.category = "Veuillez choisir une catégorie.";
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = "Veuillez indiquer le nombre de kilos, cagettes ou portions.";
    if (!form.unit) errs.unit = "Veuillez choisir une unité.";
    if (!form.expirationDate) errs.expirationDate = "Veuillez indiquer la date limite de consommation (DLC).";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.updateDonation(id, { ...form, quantity: Number(form.quantity) });
      router.push("/dashboard");
    } catch (err) {
      setServerError(err.message || "Impossible d'enregistrer les modifications.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ravively-cream px-4">
        <p className="field-error">{loadError}</p>
      </main>
    );
  }

  if (!form) {
    return <CardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-ravively-cream px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-3xl font-bold text-ravively-green">Modifier ce don</h1>
        <p className="mb-6 text-lg text-gray-600">Corrigez les informations ci-dessous.</p>

        <form onSubmit={handleSubmit} className="card space-y-6" aria-label="Formulaire de modification de don">
          <div>
            <label htmlFor="title" className="mb-1 block text-base font-medium">
              Quel produit donnez-vous ? *
            </label>
            <input
              id="title"
              value={form.title}
              onChange={update("title")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-ravively-green focus:outline-none"
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="category" className="mb-1 block text-base font-medium">
              Catégorie *
            </label>
            <select
              id="category"
              value={form.category}
              onChange={update("category")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            >
              <option value="">Choisissez une catégorie</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="field-error">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="quantity" className="mb-1 block text-base font-medium">
                Quantité *
              </label>
              <input
                id="quantity"
                type="number"
                min="0.1"
                step="0.1"
                value={form.quantity}
                onChange={update("quantity")}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
              />
              {errors.quantity && <p className="field-error">{errors.quantity}</p>}
            </div>
            <div>
              <label htmlFor="unit" className="mb-1 block text-base font-medium">
                Unité *
              </label>
              <select
                id="unit"
                value={form.unit}
                onChange={update("unit")}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
              >
                <option value="">Choisissez une unité</option>
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="field-error">{errors.unit}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="expirationDate" className="mb-1 block text-base font-medium">
              Date limite de consommation (DLC) *
            </label>
            <input
              id="expirationDate"
              type="date"
              value={form.expirationDate}
              onChange={update("expirationDate")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
            {errors.expirationDate && <p className="field-error">{errors.expirationDate}</p>}
          </div>

          <div>
            <p className="mb-2 block text-base font-medium">Allergènes présents (si connus)</p>
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

          <div>
            <label htmlFor="pickupInstructions" className="mb-1 block text-base font-medium">
              Consignes de récupération
            </label>
            <input
              id="pickupInstructions"
              value={form.pickupInstructions}
              onChange={update("pickupInstructions")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-base font-medium">
              Précisions complémentaires (optionnel)
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={update("description")}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>

          {serverError && <p className="field-error" role="alert">{serverError}</p>}

          <div className="flex gap-4">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="btn-ghost">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
