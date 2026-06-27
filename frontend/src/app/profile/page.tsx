"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { CardSkeleton } from "../../components/Skeleton";
import type { AssociationProfilePayload } from "../../lib/types";
import { getErrorMessage, isApiError } from "../../lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<AssociationProfilePayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { association } = await api.getMyAssociation();
        setForm({
          name: association.name || "",
          email: association.email || "",
          phone: association.phone || "",
          address: association.address || "",
          city: association.city || "",
          postalCode: association.postalCode || "",
          siret: association.siret || ""
        });
      } catch (err) {
        if (err instanceof Error && isApiError(err) && err.status === 401) {
          router.push("/login");
        } else {
          const message = err instanceof Error ? getErrorMessage(err, "Impossible de charger le profil.") : "Impossible de charger le profil.";
          setLoadError(message);
        }
      }
    }
    load();
  }, [router]);

  function update(field: keyof AssociationProfilePayload) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => (f ? { ...f, [field]: e.target.value } : f));
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form) return;
    setServerError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.updateMyAssociation(form);
      setSuccess("Profil mis à jour avec succès.");
    } catch (err) {
      const message = err instanceof Error ? getErrorMessage(err, "Impossible d'enregistrer les modifications.") : "Impossible d'enregistrer les modifications.";
      setServerError(message);
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
        <h1 className="mb-1 text-3xl font-bold text-ravively-green">Mon profil association</h1>
        <p className="mb-6 text-lg text-gray-600">Ces informations apparaissent sur vos justificatifs de dons.</p>

        <form onSubmit={handleSubmit} className="card space-y-4" aria-label="Formulaire de profil association">
          <div>
            <label className="mb-1 block text-base font-medium">Nom de l'association</label>
            <input
              value={form.name}
              onChange={update("name")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>

          <div>
            <label className="mb-1 block text-base font-medium">Email de contact</label>
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>

          <div>
            <label className="mb-1 block text-base font-medium">Téléphone</label>
            <input
              value={form.phone}
              onChange={update("phone")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>

          <div>
            <label className="mb-1 block text-base font-medium">Adresse</label>
            <input
              value={form.address}
              onChange={update("address")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-base font-medium">Ville</label>
              <input
                value={form.city}
                onChange={update("city")}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
              />
            </div>
            <div>
              <label className="mb-1 block text-base font-medium">Code postal</label>
              <input
                value={form.postalCode}
                onChange={update("postalCode")}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-base font-medium">SIRET</label>
            <input
              value={form.siret}
              onChange={update("siret")}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
            />
          </div>

          {serverError && <p className="field-error" role="alert">{serverError}</p>}
          {success && <p className="font-medium text-ravively-green" role="status">{success}</p>}

          <div className="flex gap-4">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="btn-ghost">
              Retour au tableau de bord
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
