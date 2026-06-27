"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { CardSkeleton } from "../../components/Skeleton";
import type { AssociationProfilePayload } from "../../lib/types";
import { getErrorMessage, isApiError } from "../../lib/types";

const FIELDS: { field: keyof AssociationProfilePayload; label: string; type?: string; placeholder?: string }[] = [
  { field: "name", label: "Nom de l'association", placeholder: "Ex : Banque Alimentaire de Tours" },
  { field: "email", label: "Email de contact", type: "email", placeholder: "contact@association.fr" },
  { field: "phone", label: "Téléphone", placeholder: "02 47 00 00 00" },
  { field: "address", label: "Adresse", placeholder: "12 rue de la Solidarité" },
  { field: "city", label: "Ville", placeholder: "Tours" },
  { field: "postalCode", label: "Code postal", placeholder: "37000" },
  { field: "siret", label: "SIRET", placeholder: "12345678900012" }
];

const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-ravively-green focus:outline-none";

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
    return (e: ChangeEvent<HTMLInputElement>) => {
      setForm((f) => (f ? { ...f, [field]: e.target.value } : f));
    };
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
      <main className="flex min-h-screen items-center justify-center bg-ravively-cream pl-[120px] pr-4">
        <p className="field-error">{loadError}</p>
      </main>
    );
  }

  if (!form) return <CardSkeleton />;

  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-3xl font-bold text-ravively-green">Mon profil association</h1>
        <p className="mb-6 text-lg text-gray-600">Ces informations apparaissent sur vos justificatifs de dons.</p>

        <form onSubmit={handleSubmit} className="card space-y-4" aria-label="Formulaire de profil association">
          {FIELDS.slice(0, 4).map(({ field, label, type, placeholder }) => (
            <div key={field}>
              <label htmlFor={`profile-${field}`} className="mb-1 block text-base font-medium">{label}</label>
              <input
                id={`profile-${field}`}
                type={type ?? "text"}
                value={(form[field] as string | undefined) ?? ""}
                onChange={update(field)}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.slice(4, 6).map(({ field, label, placeholder }) => (
              <div key={field}>
                <label htmlFor={`profile-${field}`} className="mb-1 block text-base font-medium">{label}</label>
                <input
                  id={`profile-${field}`}
                  value={(form[field] as string | undefined) ?? ""}
                  onChange={update(field)}
                  placeholder={placeholder}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="profile-siret" className="mb-1 block text-base font-medium">SIRET</label>
            <input
              id="profile-siret"
              value={form.siret ?? ""}
              onChange={update("siret")}
              placeholder="12345678900012"
              className={inputClass}
            />
          </div>

          {serverError && <p className="field-error" role="alert">{serverError}</p>}
          {success && <p className="font-medium text-ravively-green" role="status">{success}</p>}

          <div className="flex flex-wrap gap-4 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="btn-ghost">
              Retour
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
