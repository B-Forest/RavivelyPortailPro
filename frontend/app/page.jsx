import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ravively-cream px-6 text-center">
      <h1 className="mb-3 text-4xl font-bold text-ravively-green">Ravively Pro</h1>
      <p className="mb-8 max-w-md text-lg text-gray-700">
        Le portail dédié aux associations pour déclarer, suivre et gérer vos dons alimentaires en volume.
      </p>
      <Link href="/login" className="btn-primary">
        Accéder au portail
      </Link>
    </main>
  );
}
