import { cacheLife } from "next/cache";
import Link from "next/link";

export default async function NotFound() {
  "use cache";
  cacheLife("static");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ravively-cream px-6 text-center">
      <p className="mb-2 text-6xl font-bold text-ravively-green">404</p>
      <h1 className="mb-3 text-2xl font-bold text-gray-800">Page introuvable</h1>
      <p className="mb-8 max-w-md text-lg text-gray-600">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/dashboard" className="btn-primary">
        Retour au tableau de bord
      </Link>
    </main>
  );
}
