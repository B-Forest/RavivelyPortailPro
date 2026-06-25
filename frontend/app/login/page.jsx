"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Connexion impossible. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ravively-cream px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md" aria-label="Formulaire de connexion">
        <h1 className="mb-1 text-2xl font-bold text-ravively-green">Connexion Ravively Pro</h1>
        <p className="mb-6 text-base text-gray-600">Réservé aux associations partenaires.</p>

        <label htmlFor="email" className="mb-1 block text-base font-medium">
          Adresse email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-ravively-green focus:outline-none"
          placeholder="contact@monassociation.fr"
        />

        <label htmlFor="password" className="mb-1 block text-base font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-ravively-green focus:outline-none"
          placeholder="••••••••"
        />

        {error && <p className="field-error" role="alert">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          Pas encore de compte association ?{" "}
          <a href="/register" className="font-medium text-ravively-green underline">
            Créer un compte
          </a>
        </p>
      </form>
    </main>
  );
}
