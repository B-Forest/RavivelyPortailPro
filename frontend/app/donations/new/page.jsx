"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { CATEGORIES, UNITS, ALLERGENS } from "../../../lib/constants";

const initialState = {
  title: "",
  category: "",
  quantity: "",
  unit: "",
  expirationDate: "",
  allergens: [],
  pickupInstructions: "",
  description: ""
};

export default function NewDonationPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

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
    if (!form.title.trim()) errs.title = "Veuillez indiquer le nom du produit (ex : Pains et viennoiseries du jour).";
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
      await api.createDonation({ ...form, quantity: Number(form.quantity) });
      router.push("/dashboard");
    } catch (err) {
      setServerError(err.message || "Impossible d'enregistrer le don.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ravively-cream px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-3xl font-bold text-ravively-green">Déclarer un nouveau don</h1>
        <p className="mb-6 text-lg text-gray-600">Remplissez ce formulaire simple, étape par étape.</p>

        <form onSubmit={handleSubmit} className="card space-y-6" aria-label="Formulaire de déclaration de don">
          {/* Dénomination */}
          <div>
            <label htmlFor="title" className="mb-1 block text-base font-medium">
              1. Quel produit donnez-vous ? *
            </label>
            <input
              id="title"
              value={form.title}
              onChange={update("title")}
              placeholder="Ex : Pains et viennoiseries du jour"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-ravively-green focus:outline-none"
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          {/* Catégorisation */}
          <div>
            <label htmlFor="category" className="mb-1 block text-base font-medium">
              2. Catégorie *
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

          {/* Volumes */}
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

          {/* DLC */}
          <div>
            <label htmlFor="expirationDate" className="mb-1 block text-base font-medium">
              4. Date limite de consommation (DLC) *
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

          {/* Allergènes */}
          <div>
            <p className="mb-2 block text-base font-medium">5. Allergènes présents (si connus)</p>
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

          {/* Consignes de récupération */}
          <div>
            <label htmlFor="pickupInstructions" className="mb-1 block text-base font-medium">
              6. Consignes de récupération
            </label>
            <input
              id="pickupInstructions"
              value={form.pickupInstructions}
              onChange={update("pickupInstructions")}
              placeholder="Ex : Passer par la porte de service derrière la mairie"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>

          {/* Description libre */}
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
              {submitting ? "Enregistrement..." : "Valider le don"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="text-base text-gray-500 underline">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
