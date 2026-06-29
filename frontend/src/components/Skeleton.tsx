interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

// Dashboard : header banner + 3 stat cards + toolbar + liste de dons
export function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      {/* Header banner */}
      <SkeletonBlock className="mb-8 h-24 w-full rounded-2xl" />

      {/* CTA button */}
      <SkeletonBlock className="mb-8 h-11 w-52" />

      {/* Stat cards */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-40" />
            <SkeletonBlock className="h-9 w-16" />
          </div>
        ))}
      </section>

      {/* Tab nav */}
      <SkeletonBlock className="mb-4 h-10 w-72 rounded-xl" />

      {/* Table card */}
      <div className="card">
        {/* Toolbar */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <SkeletonBlock className="h-5 w-40" />
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-9 w-48" />
            <SkeletonBlock className="h-9 w-40" />
            <SkeletonBlock className="h-9 w-32" />
          </div>
        </div>
        {/* Date filter */}
        <SkeletonBlock className="mb-5 h-14 w-full rounded-xl" />
        {/* Header row */}
        <div className="mb-1 flex items-center gap-4 border-b-2 border-gray-100 pb-3">
          <SkeletonBlock className="h-3 flex-1" />
          <SkeletonBlock className="h-3 w-52" />
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-3 w-44" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
        {/* Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-50 py-4">
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock className="h-4 w-2/5" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
            <SkeletonBlock className="h-5 w-52" />
            <SkeletonBlock className="h-6 w-28 rounded-full" />
            <SkeletonBlock className="h-8 w-44 rounded-lg" />
            <SkeletonBlock className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}

// Profil : header banner + identité (full) + contact/adresse (2 cols) + boutons
export function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      {/* Header banner */}
      <SkeletonBlock className="mb-8 h-24 w-full rounded-2xl" />

      <div className="space-y-4">
        {/* Identité — pleine largeur */}
        <div className="card">
          <SkeletonBlock className="mb-4 h-3 w-16" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-11 w-full" />
          </div>
        </div>

        {/* Contact + Adresse — 2 colonnes */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card space-y-4">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-11 w-full" />
          </div>
          <div className="card space-y-4">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-11 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonBlock className="h-11 w-full" />
              <SkeletonBlock className="h-11 w-full" />
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <SkeletonBlock className="h-11 w-32" />
          <SkeletonBlock className="h-11 w-24" />
        </div>
      </div>
    </main>
  );
}

// Stats : header banner + 3 KPI + 2 cols (quantités/catégories) + statut full width
export function StatsSkeleton() {
  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      {/* Header banner */}
      <SkeletonBlock className="mb-8 h-24 w-full rounded-2xl" />

      {/* KPI cards */}
      <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-36" />
            <SkeletonBlock className="h-9 w-16" />
          </div>
        ))}
      </section>

      {/* Quantités + Catégories */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card space-y-4">
          <SkeletonBlock className="h-4 w-40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-3 w-8" />
              </div>
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="card space-y-4">
          <SkeletonBlock className="h-4 w-40" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="h-3 w-8" />
              </div>
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Statut — pleine largeur */}
      <div className="card space-y-4">
        <SkeletonBlock className="h-4 w-44" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-3 w-8" />
              </div>
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// Générique (formulaire simple, ex: donation new/edit)
export function CardSkeleton() {
  return (
    <main className="min-h-screen bg-ravively-cream py-8 pl-[120px] pr-4 sm:pr-8">
      <SkeletonBlock className="mb-2 h-8 w-64" />
      <SkeletonBlock className="mb-6 h-5 w-80" />
      <div className="card space-y-5">
        <SkeletonBlock className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBlock key={i} className="h-12 w-full" />
          ))}
          <SkeletonBlock className="h-24 w-full lg:col-span-2" />
        </div>
        <div className="flex gap-4">
          <SkeletonBlock className="h-11 w-32" />
          <SkeletonBlock className="h-11 w-24" />
        </div>
      </div>
    </main>
  );
}
