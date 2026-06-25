"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { CATEGORIES, UNITS } from "../../lib/constants";
import StatusBadge from "../../components/StatusBadge";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}
function unitLabel(value) {
  return UNITS.find((u) => u.value === value)?.label || value;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonations: 0, availableDonations: 0, collectedDonations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleStatusChange(id, status) {
    try {
      await api.updateDonationStatus(id, status);
      setDonations((prev) => prev.map((d) => (d._id === id ? { ...d, status } : d)));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await api.logout();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ravively-cream">
        <p className="text-lg text-gray-600">Chargement de votre tableau de bord...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ravively-cream px-4 py-8 sm:px-8">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-ravively-green">Où en sont mes dons ?</h1>
          {user && <p className="text-gray-600">Bonjour {user.firstname}, voici l'état de vos dons.</p>}
        </div>
        <button onClick={handleLogout} className="text-base font-medium text-gray-500 underline">
          Se déconnecter
        </button>
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

      {/* Tableau récapitulatif des annonces actives */}
      <section className="card overflow-x-auto" aria-label="Liste de vos dons">
        <h2 className="mb-4 text-xl font-semibold">Mes annonces</h2>
        {donations.length === 0 ? (
          <p className="text-gray-600">Aucun don déclaré pour le moment.</p>
        ) : (
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-gray-200 text-base text-gray-500">
                <th className="py-2">Produit / Volume</th>
                <th className="py-2">Date de péremption</th>
                <th className="py-2">Statut</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d._id} className="border-b border-gray-100 text-base">
                  <td className="py-3">
                    <span className="font-medium">{d.title}</span>
                    <br />
                    <span className="text-sm text-gray-500">
                      {d.quantity} {unitLabel(d.unit)} — {categoryLabel(d.category)}
                    </span>
                  </td>
                  <td className="py-3">{formatDate(d.expirationDate)}</td>
                  <td className="py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="py-3">
                    <select
                      value={d.status}
                      onChange={(e) => handleStatusChange(d._id, e.target.value)}
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
