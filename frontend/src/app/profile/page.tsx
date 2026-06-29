"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { ProfileSkeleton } from "../../components/Skeleton";
import type { AssociationProfilePayload } from "../../lib/types";
import { getErrorMessage, isApiError } from "../../lib/types";

const DOT_GRID = {
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
} as const;

const FIELDS: { field: keyof AssociationProfilePayload; label: string; type?: string; placeholder?: string }[] = [
  { field: "name", label: "Nom de l'association", placeholder: "Ex : Banque Alimentaire de Tours" },
  { field: "email", label: "Email de contact", type: "email", placeholder: "contact@association.fr" },
  { field: "phone", label: "Téléphone", placeholder: "02 47 00 00 00" },
  { field: "address", label: "Adresse", placeholder: "12 rue de la Solidarité" },
  { field: "city", label: "Ville", placeholder: "Tours" },
  { field: "postalCode", label: "Code postal", placeholder: "37000" },
  { field: "siret", label: "SIRET", placeholder: "12345678900012" }
];

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
      <main className="flex min-h-screen items-center justify-center bg-ravively-cream pl-[120px] pr-4 sm:pr-8">
        <p className="field-error">{loadError}</p>
      </main>
    );
  }

  if (!form) return <ProfileSkeleton />;

  const initials = form.name
    ? form.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      <div>

        {/* ── Header banner ── */}
        <header className="relative mb-8 overflow-hidden rounded-2xl bg-linear-to-br from-ravively-green to-ravively-green-dark px-6 py-6 shadow-lg">
          <div className="pointer-events-none absolute inset-0" style={DOT_GRID} />
          {/* Image décorative coeurblanc */}
          <Image
            src="/coeurblanc.webp"
            alt=""
            width={180}
            height={180}
            className="pointer-events-none absolute -right-6 -top-6 w-28 select-none opacity-10"
            aria-hidden
          />
          <div className="relative flex items-center gap-4 text-white">
            {/* Initials avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-black ring-1 ring-white/25">
              {initials}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">Mon profil</p>
              <h1 className="text-xl font-black tracking-tight">{form.name || "Mon association"}</h1>
              <p className="mt-0.5 text-sm text-white/70">Ces informations apparaissent sur vos justificatifs de dons.</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} aria-label="Formulaire de profil association">
          <div className="space-y-4">

            {/* Identité — pleine largeur */}
            <div className="card">
              <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <span className="inline-block h-1 w-4 rounded-full bg-ravively-green" />
                Identité
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-gray-700">
                    {FIELDS[0].label}
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={(form.name as string | undefined) ?? ""}
                    onChange={update("name")}
                    placeholder={FIELDS[0].placeholder}
                    className="input-base"
                  />
                </div>
                <div>
                  <label htmlFor="profile-siret" className="mb-2 block text-sm font-semibold text-gray-700">SIRET</label>
                  <input
                    id="profile-siret"
                    value={form.siret ?? ""}
                    onChange={update("siret")}
                    placeholder="12345678900012"
                    className="input-base"
                  />
                </div>
              </div>
            </div>

            {/* Contact + Adresse — 2 colonnes */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

              {/* Contact */}
              <div className="card">
                <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <span className="inline-block h-1 w-4 rounded-full bg-ravively-orange" />
                  Contact
                </p>
                <div className="space-y-4">
                  {FIELDS.slice(1, 3).map(({ field, label, type, placeholder }) => (
                    <div key={field}>
                      <label htmlFor={`profile-${field}`} className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
                      <input
                        id={`profile-${field}`}
                        type={type ?? "text"}
                        value={(form[field] as string | undefined) ?? ""}
                        onChange={update(field)}
                        placeholder={placeholder}
                        className="input-base"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Adresse */}
              <div className="card">
                <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <span className="inline-block h-1 w-4 rounded-full bg-gray-300" />
                  Adresse
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="profile-address" className="mb-2 block text-sm font-semibold text-gray-700">Adresse</label>
                    <input
                      id="profile-address"
                      value={form.address ?? ""}
                      onChange={update("address")}
                      placeholder="12 rue de la Solidarité"
                      className="input-base"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {FIELDS.slice(4, 6).map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label htmlFor={`profile-${field}`} className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
                        <input
                          id={`profile-${field}`}
                          value={(form[field] as string | undefined) ?? ""}
                          onChange={update(field)}
                          placeholder={placeholder}
                          className="input-base"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Alertes + boutons — pleine largeur en bas */}
            <div className="space-y-3">
              {serverError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {serverError}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-xl bg-ravively-green/10 px-4 py-3 text-sm font-semibold text-ravively-green" role="status">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {success}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button type="button" onClick={() => router.push("/dashboard")} className="btn-ghost">
                  Retour
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}
