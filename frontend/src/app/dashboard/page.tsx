"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { CATEGORIES, UNITS, STATUSES } from "../../lib/constants";
import { exportDonationsToCSV } from "../../lib/exportCsv";
import StatusBadge from "../../components/StatusBadge";
import ExpiryBadge from "../../components/ExpiryBadge";
import { DashboardSkeleton } from "../../components/Skeleton";
import type { Donation, DonationCategory, DonationStats, DonationStatus, DonationUnit, User } from "../../lib/types";
import { getErrorMessage } from "../../lib/types";

const PAGE_SIZE = 8;
const ARCHIVED_STATUSES: DonationStatus[] = ["collected", "cancelled"];
const ACTIVE_STATUSES: DonationStatus[] = ["available", "reserved", "in_progress"];

type SortKey = "title" | "expirationDate" | "status";
type SortDirection = "asc" | "desc";
type Tab = "active" | "archived";

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function categoryLabel(value: DonationCategory): string {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}
function unitLabel(value: DonationUnit): string {
  return UNITS.find((u) => u.value === value)?.label || value;
}

const DOT_GRID = {
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
} as const;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats>({ totalDonations: 0, availableDonations: 0, collectedDonations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DonationStatus | "all">("all");
  const [tab, setTab] = useState<Tab>("active");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "expirationDate", direction: "asc" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const meRes = await api.me();
        setUser(meRes.user);

        if (!meRes.user.associationId) {
          setError("Aucune association rattachée à ce compte.");
          return;
        }

        const { donations, stats } = await api.getDonationsByAssociation(meRes.user.associationId);
        setDonations(donations);
        setStats(stats);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleStatusChange(id: string, status: DonationStatus) {
    try {
      await api.updateDonationStatus(id, status);
      setDonations((prev) => prev.map((d) => (d._id === id ? { ...d, status } : d)));
    } catch (err) {
      const message = err instanceof Error ? getErrorMessage(err, "Impossible de mettre à jour le statut.") : "Impossible de mettre à jour le statut.";
      alert(message);
    }
  }

  async function handleLogout() {
    await api.logout();
    router.push("/login");
  }

  function handleSort(key: SortKey) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
    setVisibleCount(PAGE_SIZE);
  }

  function sortIndicator(key: SortKey): string {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  }

  const tabDonations = useMemo(() => {
    const statusesForTab = tab === "active" ? ACTIVE_STATUSES : ARCHIVED_STATUSES;
    return donations.filter((d) => statusesForTab.includes(d.status));
  }, [donations, tab]);

  const filteredDonations = useMemo(() => {
    return tabDonations.filter((d) => {
      const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tabDonations, search, statusFilter]);

  const dateFilteredDonations = useMemo(() => {
    if (!dateFrom && !dateTo) return filteredDonations;
    return filteredDonations.filter((d) => {
      if (!d.createdAt) return false;
      const createdAt = new Date(d.createdAt).getTime();
      if (dateFrom && createdAt < new Date(dateFrom).getTime()) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (createdAt > endOfDay.getTime()) return false;
      }
      return true;
    });
  }, [filteredDonations, dateFrom, dateTo]);

  const sortedDonations = useMemo(() => {
    const sorted = [...dateFilteredDonations];
    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      let valA: string | number = a[key];
      let valB: string | number = b[key];
      if (key === "expirationDate") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [dateFilteredDonations, sortConfig]);

  const visibleDonations = sortedDonations.slice(0, visibleCount);
  const hasMore = visibleCount < sortedDonations.length;

  function handleExport() {
    exportDonationsToCSV(sortedDonations, `dons-ravively-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">

      {/* ── Header banner ── */}
      <header className="relative mb-8 overflow-hidden rounded-2xl bg-linear-to-br from-ravively-green to-ravively-green-dark px-6 py-6 shadow-lg">
        {/* texture & decorative blobs */}
        <div className="pointer-events-none absolute inset-0" style={DOT_GRID} />
        {/* Image décorative coeurblanc */}
        <Image
          src="/coeurblanc.webp"
          alt=""
          width={200}
          height={200}
          className="pointer-events-none absolute -right-6 -top-6 w-32 select-none opacity-10"
          aria-hidden
        />
        <Image
          src="/coeurblanc.webp"
          alt=""
          width={120}
          height={120}
          className="pointer-events-none absolute -bottom-4 right-28 w-20 select-none opacity-[0.07]"
          aria-hidden
        />

        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="text-white">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/50">{today}</p>
            <h1 className="text-2xl font-black tracking-tight">Où en sont mes dons ?</h1>
            {user && <p className="mt-1 text-sm text-white/70">Bonjour {user.firstname}, voici l'état de vos dons.</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/donations/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-ravively-green shadow-sm transition hover:bg-white/90 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nouveau don
            </Link>
            <Link
              href="/stats"
              className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Statistiques
            </Link>
            <Link
              href="/profile"
              className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Mon profil
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── CTA standalone ── */}
      <Link href="/donations/new" className="btn-primary mb-8 inline-flex">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Déclarer un nouveau don
      </Link>

      {/* ── Stat cards — style Ravively ── */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Statistiques des dons">
        <div className="card">
          <p className="font-bold text-ravively-green">Dons au total</p>
          <p className="mb-3 text-xs font-semibold text-gray-400">tous statuts confondus</p>
          <p className="text-4xl font-black text-gray-900">{stats.totalDonations}</p>
        </div>

        <div className="card">
          <p className="font-bold text-ravively-green">Disponibles</p>
          <p className="mb-3 text-xs font-semibold text-ravively-orange">à récupérer maintenant</p>
          <p className="text-4xl font-black text-ravively-orange">{stats.availableDonations}</p>
        </div>

        <div className="card">
          <p className="font-bold text-ravively-green">Récupérés</p>
          <p className="mb-3 text-xs font-semibold text-gray-400">transmis avec succès</p>
          <p className="text-4xl font-black text-gray-700">{stats.collectedDonations}</p>
        </div>
      </section>

      {/* ── Tab nav ── */}
      <div className="mb-4 tab-nav" role="tablist" aria-label="Filtrer par état">
        <button
          role="tab"
          aria-selected={tab === "active"}
          onClick={() => { setTab("active"); setVisibleCount(PAGE_SIZE); }}
          className={`tab-btn ${tab === "active" ? "tab-btn-active" : ""}`}
        >
          Dons actifs
        </button>
        <button
          role="tab"
          aria-selected={tab === "archived"}
          onClick={() => { setTab("archived"); setVisibleCount(PAGE_SIZE); }}
          className={`tab-btn ${tab === "archived" ? "tab-btn-active" : ""}`}
        >
          Historique (récupérés / annulés)
        </button>
      </div>

      {/* ── Table card ── */}
      <section className="card" aria-label="Liste de vos dons">
        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-800">
            {tab === "active" ? "Mes annonces actives" : "Historique des dons"}
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Rechercher un don..."
              aria-label="Rechercher un don par titre"
              className="input-base py-2 w-48"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value === "all" ? "all" : (value as DonationStatus));
                setVisibleCount(PAGE_SIZE);
              }}
              aria-label="Filtrer par statut"
              className="input-base py-2 w-40"
            >
              <option value="all">Tous les statuts</option>
              {(Object.entries(STATUSES) as [DonationStatus, { label: string; color: string }][])
                .filter(([value]) => (tab === "active" ? ACTIVE_STATUSES : ARCHIVED_STATUSES).includes(value))
                .map(([value, info]) => (
                  <option key={value} value={value}>{info.label}</option>
                ))}
            </select>
            <button onClick={handleExport} disabled={sortedDonations.length === 0} className="btn-secondary btn-md whitespace-nowrap">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter en CSV
            </button>
          </div>
        </div>

        {/* Date filter */}
        <div className="mb-5 flex flex-col gap-3 rounded-xl bg-gray-50 px-4 py-3.5 sm:flex-row sm:items-end sm:gap-4">
          <div>
            <label htmlFor="dateFrom" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Déclarés depuis le
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-ravively-green focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Jusqu'au
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-ravively-green focus:outline-none"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setVisibleCount(PAGE_SIZE); }}
              className="btn-ghost btn-sm"
            >
              Réinitialiser la période
            </button>
          )}
          {(dateFrom || dateTo) && (
            <p className="text-xs text-gray-400 sm:ml-1">
              {sortedDonations.length} don{sortedDonations.length > 1 ? "s" : ""} dans cette période
            </p>
          )}
        </div>

        {/* Table / empty states */}
        {tabDonations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="font-medium text-gray-500">
              {tab === "active" ? "Aucun don actif pour le moment." : "Aucun don archivé pour le moment."}
            </p>
            {tab === "active" && (
              <Link href="/donations/new" className="btn-primary mt-4">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Déclarer un don
              </Link>
            )}
          </div>
        ) : sortedDonations.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucun don ne correspond à votre recherche.</p>
        ) : (
          <>
            {/* Header row */}
            <div className="mb-1 flex items-center gap-4 border-b-2 border-gray-100 pb-3">
              <button
                onClick={() => handleSort("title")}
                className="flex-1 cursor-pointer select-none text-left text-xs font-bold uppercase tracking-wider text-gray-400 transition hover:text-gray-600"
              >
                Produit / Volume{sortIndicator("title")}
              </button>
              <button
                onClick={() => handleSort("expirationDate")}
                className="w-52 cursor-pointer select-none text-left text-xs font-bold uppercase tracking-wider text-gray-400 transition hover:text-gray-600"
              >
                Péremption{sortIndicator("expirationDate")}
              </button>
              <button
                onClick={() => handleSort("status")}
                className="w-28 whitespace-nowrap cursor-pointer select-none text-left text-xs font-bold uppercase tracking-wider text-gray-400 transition hover:text-gray-600"
              >
                Statut{sortIndicator("status")}
              </button>
              <span className="w-44 text-xs font-bold uppercase tracking-wider text-gray-400">Action</span>
              <span className="w-20" />
            </div>

            {/* Data rows */}
            <div className="divide-y divide-gray-50">
              {visibleDonations.map((d) => (
                <div key={d._id} className="group flex items-center gap-4 py-4 transition-colors hover:bg-gray-50/80 rounded-xl -mx-1 px-1">
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold text-gray-900 truncate">{d.title}</span>
                    <span className="mt-0.5 block text-xs text-gray-400">
                      {d.quantity} {unitLabel(d.unit)} — {categoryLabel(d.category)}
                    </span>
                  </div>
                  <div className="w-52 shrink-0 flex items-center gap-2">
                    <span className="text-sm text-gray-700 whitespace-nowrap">{formatDate(d.expirationDate)}</span>
                    <ExpiryBadge expirationDate={d.expirationDate} status={d.status} />
                  </div>
                  <div className="w-28 shrink-0">
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="w-44 shrink-0">
                    <select
                      value={d.status}
                      onChange={(e) => handleStatusChange(d._id, e.target.value as DonationStatus)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-ravively-green focus:outline-none"
                      aria-label={`Changer le statut de ${d.title}`}
                    >
                      <option value="available">Disponible</option>
                      <option value="reserved">Réservé</option>
                      <option value="in_progress">En cours de récupération</option>
                      <option value="collected">Récupéré</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                  <div className="w-20 shrink-0 flex justify-end">
                    <Link href={`/donations/${d._id}/edit`} className="btn-secondary btn-sm">
                      Modifier
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="btn-secondary">
                  Voir plus ({sortedDonations.length - visibleCount} restants)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
