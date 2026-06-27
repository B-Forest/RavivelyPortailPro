function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// Affiche un badge d'alerte si la DLC est proche ou dépassée.
// Ne s'affiche pas pour les dons déjà récupérés/annulés (plus pertinent).
export default function ExpiryBadge({ expirationDate, status }) {
  if (status === "collected" || status === "cancelled") return null;

  const days = daysUntil(expirationDate);

  if (days < 0) {
    return <span className="ml-2 inline-block rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">DLC dépassée</span>;
  }
  if (days === 0) {
    return <span className="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">DLC aujourd'hui</span>;
  }
  if (days <= 2) {
    return (
      <span className="ml-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
        DLC dans {days} jour{days > 1 ? "s" : ""}
      </span>
    );
  }
  return null;
}
