"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import type { RegisterAssociationPayload } from "../../lib/types";
import { getErrorMessage } from "../../lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterAssociationPayload>({
    associationName: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    city: "",
    phone: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof RegisterAssociationPayload) {
    return (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.registerAssociation(form);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? getErrorMessage(err, "Inscription impossible.") : "Inscription impossible.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ravively-cream px-4 py-10">
      <form onSubmit={handleSubmit} className="card w-full max-w-lg" aria-label="Formulaire d'inscription association">
        <h1 className="mb-1 text-2xl font-bold text-ravively-green">Créer mon compte association</h1>
        <p className="mb-6 text-base text-gray-600">Quelques informations pour démarrer.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-base font-medium">Nom de l'association *</label>
            <input
              required
              value={form.associationName}
              onChange={update("associationName")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>
          <div>
            <label className="mb-1 block text-base font-medium">Ville</label>
            <input
              value={form.city}
              onChange={update("city")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>
          <div>
            <label className="mb-1 block text-base font-medium">Prénom (contact) *</label>
            <input
              required
              value={form.firstname}
              onChange={update("firstname")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>
          <div>
            <label className="mb-1 block text-base font-medium">Nom (contact) *</label>
            <input
              required
              value={form.lastname}
              onChange={update("lastname")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-base font-medium">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-base font-medium">Téléphone</label>
            <input
              value={form.phone}
              onChange={update("phone")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-base font-medium">Mot de passe *</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? "Création en cours..." : "Créer mon compte"}
        </button>
      </form>
    </main>
  );
}
