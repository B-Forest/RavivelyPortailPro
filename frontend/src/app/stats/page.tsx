"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { CATEGORIES, UNITS, STATUSES } from "../../lib/constants";
import { StatsSkeleton } from "../../components/Skeleton";
import type {
  DetailedDonationStats,
  DonationCategory,
  DonationStatus,
  DonationUnit,
} from "../../lib/types";

function categoryLabel(value: DonationCategory) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}
function unitLabel(value: DonationUnit) {
  return UNITS.find((u) => u.value === value)?.label || value;
}
function statusLabel(value: DonationStatus) {
  return STATUSES[value]?.label || value;
}

function ProgressBar({
  value,
  max,
  color = "bg-ravively-green",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const DOT_GRID = {
  backgroundImage:
    "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
} as const;

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DetailedDonationStats | null>(null);
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
      } catch {
        router.push("/login");
      }
    }
    load();
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ravively-cream pl-[120px] pr-4">
        <p className="field-error">{error}</p>
      </main>
    );
  }

  if (!stats) {
    return <StatsSkeleton />;
  }

  const unitEntries = Object.entries(stats.quantitySavedByUnit || {}) as [
    DonationUnit,
    number,
  ][];
  const maxUnit = Math.max(...unitEntries.map(([, v]) => v), 1);

  const categoryEntries = Object.entries(stats.byCategory) as [
    DonationCategory,
    number,
  ][];
  const maxCategory = Math.max(...categoryEntries.map(([, v]) => v), 1);

  const statusEntries = Object.entries(stats.byStatus) as [
    DonationStatus,
    number,
  ][];
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1);

  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      <div>
        {/* ── Header banner ── */}
        <header className="relative mb-8 overflow-hidden rounded-2xl bg-linear-to-br from-ravively-green to-ravively-green-dark px-6 py-6 shadow-lg">
          <div
            className="pointer-events-none absolute inset-0"
            style={DOT_GRID}
          />
          {/* Image décorative coeurblanc */}
          <Image
            src="/coeurblanc.webp"
            alt=""
            width={180}
            height={180}
            className="pointer-events-none absolute -right-6 -top-6 w-28 select-none opacity-10"
            aria-hidden
          />
          <div className="relative text-white">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">
              Tableau de bord
            </p>
            <h1 className="text-2xl font-black tracking-tight">
              Statistiques de mon association
            </h1>
            <p className="mt-1 text-sm text-white/70">
              L'impact de vos dons en un coup d'œil.
            </p>
          </div>
        </header>

        {/* ── KPI cards — pleine largeur, 3 colonnes ── */}
        <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="font-bold text-ravively-green">Dons déclarés</p>
            <p className="mb-3 text-xs font-semibold text-gray-400">
              tous statuts confondus
            </p>
            <p className="text-4xl font-black text-gray-900">
              {stats.totalDonations}
            </p>
          </div>
          <div className="card">
            <p className="font-bold text-ravively-green">Dons récupérés</p>
            <p className="mb-3 text-xs font-semibold text-ravively-orange">
              transmis aux bénéficiaires
            </p>
            <p className="text-4xl font-black text-ravively-orange">
              {stats.byStatus.collected || 0}
            </p>
          </div>
          <div className="card">
            <p className="font-bold text-ravively-green">
              Repas estimés sauvés
            </p>
            <p className="mb-3 text-xs font-semibold text-gray-400">
              estimation indicative
            </p>
            <p className="text-4xl font-black text-gray-700">
              {stats.mealsEstimate}
            </p>
          </div>
        </section>

        {/* ── Répartition par statut — pleine largeur ── */}
        <section className="card mb-4">
          <h2 className="mb-4 font-bold text-gray-900">
            Répartition par statut
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statusEntries.map(([status, count]) => (
              <li key={status}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {statusLabel(status)}
                  </span>
                  <span className="text-sm font-bold text-gray-600">
                    {count}
                  </span>
                </div>
                <ProgressBar
                  value={count}
                  max={maxStatus}
                  color="bg-gray-300"
                />
              </li>
            ))}
          </ul>
        </section>

        {/* ── Quantités + Catégories — 2 colonnes ── */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Quantités par unité */}
          <section className="card">
            <h2 className="mb-4 font-bold text-gray-900">
              Quantités récupérées
            </h2>
            {unitEntries.length === 0 ? (
              <p className="text-sm text-gray-400">
                Aucun don récupéré pour le moment.
              </p>
            ) : (
              <ul className="space-y-4">
                {unitEntries.map(([unit, qty]) => (
                  <li key={unit}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {unitLabel(unit)}
                      </span>
                      <span className="text-sm font-bold text-ravively-green">
                        {qty}
                      </span>
                    </div>
                    <ProgressBar value={qty} max={maxUnit} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Répartition par catégorie */}
          <section className="card">
            <h2 className="mb-4 font-bold text-gray-900">
              Répartition par catégorie
            </h2>
            <ul className="space-y-4">
              {categoryEntries.map(([cat, count]) => (
                <li key={cat}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {categoryLabel(cat)}
                    </span>
                    <span className="text-sm font-bold text-gray-600">
                      {count}
                    </span>
                  </div>
                  <ProgressBar
                    value={count}
                    max={maxCategory}
                    color="bg-ravively-orange"
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="btn-secondary mt-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour au tableau de bord
        </button>
      </div>
    </main>
  );
}
