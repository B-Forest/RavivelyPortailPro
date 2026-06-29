"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import type { RegisterAssociationPayload } from "../../lib/types";
import { getErrorMessage } from "../../lib/types";

const DOT_GRID = {
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
} as const;

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
    <main className="flex min-h-screen">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-linear-to-br from-ravively-green to-ravively-green-dark p-16 text-white lg:flex lg:w-[40%]">
        <div className="pointer-events-none absolute inset-0" style={DOT_GRID} />
        {/* Image décorative coeurblanc */}
        <Image
          src="/coeurblanc.webp"
          alt=""
          width={320}
          height={320}
          className="pointer-events-none absolute -bottom-10 -right-10 w-52 select-none opacity-10"
          aria-hidden
        />
        <Image
          src="/coeurblanc.webp"
          alt=""
          width={200}
          height={200}
          className="pointer-events-none absolute -left-8 -top-8 w-36 select-none opacity-[0.07]"
          aria-hidden
        />

        <div className="relative max-w-xs text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 shadow-2xl overflow-hidden">
            <Image src="/ravively.png" alt="Ravively" width={56} height={56} className="object-contain" />
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">Portail Associations</p>
          <h1 className="mb-4 text-3xl font-black tracking-tight">Rejoignez le réseau solidaire</h1>


          <div className="mt-10 rounded-2xl bg-white/10 p-5 text-left ring-1 ring-white/15">
            <p className="text-sm font-semibold text-white/90">Dédié aux associations</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Ravively Pro est entièrement dédié aux associations partenaires engagées dans la lutte contre le gaspillage alimentaire.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex w-full flex-col items-center justify-center bg-ravively-cream px-6 py-10 lg:w-[60%]">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white overflow-hidden shadow-lg">
              <Image src="/ravively.png" alt="Ravively" width={32} height={32} className="object-contain" />
            </div>
            <span className="text-lg font-bold text-ravively-green">Ravively Pro</span>
          </div>

          <form onSubmit={handleSubmit} className="card" aria-label="Formulaire d'inscription association">
            <h2 className="mb-1 text-2xl font-black text-gray-900">Créer mon compte</h2>
            <p className="mb-7 text-sm text-gray-400">Quelques informations pour démarrer.</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Nom de l'association *</label>
                <input
                  required
                  value={form.associationName}
                  onChange={update("associationName")}
                  className="input-base"
                  placeholder="Banque Alimentaire de Tours"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Prénom (contact) *</label>
                <input
                  required
                  value={form.firstname}
                  onChange={update("firstname")}
                  className="input-base"
                  placeholder="Marie"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Nom (contact) *</label>
                <input
                  required
                  value={form.lastname}
                  onChange={update("lastname")}
                  className="input-base"
                  placeholder="Dupont"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Ville</label>
                <input
                  value={form.city}
                  onChange={update("city")}
                  className="input-base"
                  placeholder="Tours"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Téléphone</label>
                <input
                  value={form.phone}
                  onChange={update("phone")}
                  className="input-base"
                  placeholder="02 47 00 00 00"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  className="input-base"
                  placeholder="contact@association.fr"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Mot de passe *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={update("password")}
                  className="input-base"
                  placeholder="••••••••  (6 caractères min.)"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-6 w-full justify-center py-3.5 text-base">
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>

            <p className="mt-5 text-center text-sm text-gray-500">
              Déjà un compte ?{" "}
              <a href="/login" className="font-bold text-ravively-green hover:text-ravively-green-dark hover:underline">
                Se connecter
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
