"use client";

import { useEffect, useMemo, useState } from "react";
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

  // 1. Filtre par onglet (actifs / archivés)
  const tabDonations = useMemo(() => {
    const statusesForTab = tab === "active" ? ACTIVE_STATUSES : ARCHIVED_STATUSES;
    return donations.filter((d) => statusesForTab.includes(d.status));
  }, [donations, tab]);

  // 2. Recherche + filtre statut
  const filteredDonations = useMemo(() => {
    return tabDonations.filter((d) => {
      const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tabDonations, search, statusFilter]);

  // 2bis. Filtre par période (date de déclaration du don)
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

  // 3. Tri
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

  // 4. Pagination ("Voir plus")
  const visibleDonations = sortedDonations.slice(0, visibleCount);
  const hasMore = visibleCount < sortedDonations.length;

  function handleExport() {
    exportDonationsToCSV(sortedDonations, `dons-ravively-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-ravively-cream px-4 py-8 sm:px-8">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-ravively-green">Où en sont mes dons ?</h1>
          {user && <p className="text-gray-600">Bonjour {user.firstname}, voici l'état de vos dons.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/stats" className="btn-secondary btn-sm">
            Statistiques
          </Link>
          <Link href="/profile" className="btn-secondary btn-sm">
            Mon profil
          </Link>
          <button onClick={handleLogout} className="btn-ghost btn-sm">
            Se déconnecter
          </button>
        </div>
      </header>

      {error && <p className="field-error mb-4">{error}</p>}

      {/* Zone d'action principale */}
      <Link href="/donations/new" className="btn-primary mb-8 inline-block">
        + Déclarer un nouveau don
      </Link>

      {/* Statistiques rapides (DashboardStats) */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Statistiques des dons">
        <div className="card">
          <p className="text-sm text-gray-500">Dons au total</p>
          <p className="text-3xl font-bold text-ravively-green">{stats.totalDonations}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Disponibles</p>
          <p className="text-3xl font-bold text-ravively-orange">{stats.availableDonations}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Récupérés</p>
          <p className="text-3xl font-bold text-gray-700">{stats.collectedDonations}</p>
        </div>
      </section>

      {/* Onglets Actifs / Archivés */}
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Filtrer par état">
        <button
          role="tab"
          aria-selected={tab === "active"}
          onClick={() => {
            setTab("active");
            setVisibleCount(PAGE_SIZE);
          }}
          className={tab === "active" ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
        >
          Dons actifs
        </button>
        <button
          role="tab"
          aria-selected={tab === "archived"}
          onClick={() => {
            setTab("archived");
            setVisibleCount(PAGE_SIZE);
          }}
          className={tab === "archived" ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
        >
          Historique (récupérés / annulés)
        </button>
      </div>

      {/* Tableau récapitulatif des annonces */}
      <section className="card overflow-x-auto" aria-label="Liste de vos dons">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">
            {tab === "active" ? "Mes annonces actives" : "Historique des dons"}
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Rechercher un don..."
              aria-label="Rechercher un don par titre"
              className="rounded-lg border border-gray-300 px-3 py-2 text-base sm:w-56"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value === "all" ? "all" : (value as DonationStatus));
                setVisibleCount(PAGE_SIZE);
              }}
              aria-label="Filtrer par statut"
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
            >
              <option value="all">Tous les statuts</option>
              {(Object.entries(STATUSES) as [DonationStatus, { label: string; color: string }][])
                .filter(([value]) => (tab === "active" ? ACTIVE_STATUSES : ARCHIVED_STATUSES).includes(value))
                .map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
            </select>
            <button onClick={handleExport} disabled={sortedDonations.length === 0} className="btn-secondary">
              Exporter en CSV
            </button>
          </div>
        </div>

        {/* Filtre par période (date de déclaration) */}
        <div className="mb-4 flex flex-col gap-2 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-end sm:gap-3">
          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-gray-600">
              Dons déclarés depuis le
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-gray-600">
              Jusqu'au
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setVisibleCount(PAGE_SIZE);
              }}
              className="btn-ghost btn-sm"
            >
              Réinitialiser la période
            </button>
          )}
          {(dateFrom || dateTo) && (
            <p className="text-sm text-gray-500 sm:ml-2">
              {sortedDonations.length} don{sortedDonations.length > 1 ? "s" : ""} dans cette période
            </p>
          )}
        </div>

        {tabDonations.length === 0 ? (
          <p className="text-gray-600">
            {tab === "active" ? "Aucun don actif pour le moment." : "Aucun don archivé pour le moment."}
          </p>
        ) : sortedDonations.length === 0 ? (
          <p className="text-gray-600">Aucun don ne correspond à votre recherche.</p>
        ) : (
          <>
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-gray-200 text-base text-gray-500">
                  <th className="cursor-pointer select-none py-2" onClick={() => handleSort("title")}>
                    Produit / Volume{sortIndicator("title")}
                  </th>
                  <th className="cursor-pointer select-none py-2" onClick={() => handleSort("expirationDate")}>
                    Date de péremption{sortIndicator("expirationDate")}
                  </th>
                  <th className="cursor-pointer select-none py-2" onClick={() => handleSort("status")}>
                    Statut{sortIndicator("status")}
                  </th>
                  <th className="py-2">Action</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {visibleDonations.map((d) => (
                  <tr key={d._id} className="border-b border-gray-100 text-base">
                    <td className="py-3">
                      <span className="font-medium">{d.title}</span>
                      <br />
                      <span className="text-sm text-gray-500">
                        {d.quantity} {unitLabel(d.unit)} — {categoryLabel(d.category)}
                      </span>
                    </td>
                    <td className="py-3">
                      {formatDate(d.expirationDate)}
                      <ExpiryBadge expirationDate={d.expirationDate} status={d.status} />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3">
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d._id, e.target.value as DonationStatus)}
                        className="rounded-lg border border-gray-300 px-2 py-2 text-base"
                        aria-label={`Changer le statut de ${d.title}`}
                      >
                        <option value="available">Disponible</option>
                        <option value="reserved">Réservé</option>
                        <option value="in_progress">En cours de récupération</option>
                        <option value="collected">Récupéré</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <Link href={`/donations/${d._id}/edit`} className="btn-secondary btn-sm">
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasMore && (
              <div className="mt-4 flex justify-center">
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
