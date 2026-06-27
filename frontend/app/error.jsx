"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ravively-cream px-6 text-center">
      <p className="mb-2 text-5xl">⚠️</p>
      <h1 className="mb-3 text-2xl font-bold text-gray-800">Une erreur est survenue</h1>
      <p className="mb-8 max-w-md text-lg text-gray-600">
        Quelque chose s'est mal passé. Vous pouvez réessayer ou revenir au tableau de bord.
      </p>
      <div className="flex gap-4">
        <button onClick={() => reset()} className="btn-primary">
          Réessayer
        </button>
        <a href="/dashboard" className="btn-ghost">
          Tableau de bord
        </a>
      </div>
    </main>
  );
}
