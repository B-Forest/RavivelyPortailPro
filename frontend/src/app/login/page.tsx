"use client";

import Image from "next/image";
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/types";

const DOT_GRID = {
  backgroundImage:
    "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
} as const;

const FEATURES = [
  "Déclarez vos surplus en 30 secondes",
  "Suivez l'état de vos dons en temps réel",
  "Mesurez votre impact alimentaire",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error
          ? getErrorMessage(
              err,
              "Connexion impossible. Vérifiez vos identifiants.",
            )
          : "Connexion impossible. Vérifiez vos identifiants.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-linear-to-br from-ravively-green to-ravively-green-dark p-16 text-white lg:flex lg:w-[45%]">
        <div
          className="pointer-events-none absolute inset-0"
          style={DOT_GRID}
        />
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

          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">
            Portail Associations
          </p>
          <h1 className="mb-4 text-4xl font-black tracking-tight">
            Ravively Pro
          </h1>
          <p className="mb-10 text-base leading-relaxed text-white/70">
            La plateforme des associations pour lutter contre le gaspillage
            alimentaire.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex w-full flex-col items-center justify-center bg-ravively-cream px-6 py-12 lg:w-[55%]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white overflow-hidden shadow-lg">
              <Image src="/ravively.png" alt="Ravively" width={32} height={32} className="object-contain" />
            </div>
            <span className="text-lg font-bold text-ravively-green">
              Ravively Pro
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="card"
            aria-label="Formulaire de connexion"
          >
            <h2 className="mb-1 text-2xl font-black text-gray-900">
              Connexion
            </h2>
            <p className="mb-7 text-sm text-gray-400">
              Réservé aux associations partenaires.
            </p>

            <div className="mb-5">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="contact@monassociation.fr"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                role="alert"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>

            <p className="mt-6 text-center text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <a
                href="/register"
                className="font-bold text-ravively-green hover:text-ravively-green-dark hover:underline"
              >
                Créer un compte
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
