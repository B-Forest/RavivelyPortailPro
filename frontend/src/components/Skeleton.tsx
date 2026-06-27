interface SkeletonBlockProps {
  className?: string;
}

// Petit bloc gris animé pour préfigurer le contenu pendant le chargement
export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

// Skeleton complet pour le tableau de bord (cartes stats + tableau)
export function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-ravively-cream px-4 py-8 sm:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonBlock className="h-9 w-64" />
        <div className="flex gap-3">
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-28" />
        </div>
      </div>

      <SkeletonBlock className="mb-8 h-12 w-56" />

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <SkeletonBlock className="mb-3 h-4 w-24" />
            <SkeletonBlock className="h-8 w-16" />
          </div>
        ))}
      </section>

      <div className="card">
        <SkeletonBlock className="mb-4 h-6 w-40" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-3 flex items-center gap-4 border-b border-gray-100 pb-3">
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="h-5 w-1/5" />
            <SkeletonBlock className="h-5 w-1/6" />
          </div>
        ))}
      </div>
    </main>
  );
}

// Skeleton générique pour une page de formulaire/carte simple (profil, stats, édition)
export function CardSkeleton() {
  return (
    <main className="min-h-screen bg-ravively-cream px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <SkeletonBlock className="mb-2 h-8 w-72" />
        <SkeletonBlock className="mb-6 h-5 w-96" />
        <div className="card space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
