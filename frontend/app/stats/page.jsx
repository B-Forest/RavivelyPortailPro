"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { CATEGORIES, UNITS, STATUSES } from "../../lib/constants";
import { CardSkeleton } from "../../components/Skeleton";

function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}
function unitLabel(value) {
  return UNITS.find((u) => u.value === value)?.label || value;
}
function statusLabel(value) {
  return STATUSES[value]?.label || value;
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const meRes = await api.me();
        if (!meRes.user.associationId) {
          setError("Aucune association rattachée à ce compte.");
          return;
        }
        const data = await api.getStats(meRes.user.associationId);
        setStats(data);
      } catch (err) {
        router.push("/login");
      }
    }
    load();
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ravively-cream px-4">
        <p className="field-error">{error}</p>
      </main>
    );
  }

  if (!stats) {
    return <CardSkeleton />;
  }

  const unitEntries = Object.entries(stats.quantitySavedByUnit || {});

  return (
    <main className="min-h-screen bg-ravively-cream px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-3xl font-bold text-ravively-green">Statistiques de mon association</h1>
        <p className="mb-6 text-lg text-gray-600">L'impact de vos dons en un coup d'œil.</p>

        {/* Chiffres clés */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="text-sm text-gray-500">Dons déclarés au total</p>
            <p className="text-3xl font-bold text-ravively-green">{stats.totalDonations}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Dons récupérés</p>
            <p className="text-3xl font-bold text-ravively-orange">{stats.byStatus.collected || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Repas estimés sauvés</p>
            <p className="text-3xl font-bold text-gray-700">{stats.mealsEstimate}</p>
            <p className="mt-1 text-xs text-gray-400">Estimation indicative</p>
          </div>
        </section>

        {/* Quantités sauvées par unité */}
        <section className="card mb-8">
          <h2 className="mb-4 text-xl font-semibold">Quantités effectivement récupérées</h2>
          {unitEntries.length === 0 ? (
            <p className="text-gray-600">Aucun don récupéré pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {unitEntries.map(([unit, qty]) => (
                <li key={unit} className="flex justify-between border-b border-gray-100 py-2 text-lg">
                  <span>{unitLabel(unit)}</span>
                  <span className="font-semibold text-ravively-green">{qty}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Répartition par catégorie */}
        <section className="card mb-8">
          <h2 className="mb-4 text-xl font-semibold">Répartition par catégorie</h2>
          <ul className="space-y-2">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <li key={cat} className="flex justify-between border-b border-gray-100 py-2 text-lg">
                <span>{categoryLabel(cat)}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Répartition par statut */}
        <section className="card">
          <h2 className="mb-4 text-xl font-semibold">Répartition par statut</h2>
          <ul className="space-y-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between border-b border-gray-100 py-2 text-lg">
                <span>{statusLabel(status)}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <button onClick={() => router.push("/dashboard")} className="btn-secondary mt-6">
          ← Retour au tableau de bord
        </button>
      </div>
    </main>
  );
}
