import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";

const DOT_GRID = {
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
} as const;


export default async function HomePage() {
  "use cache";
  cacheLife("static");

  return (
    <main className="flex min-h-screen flex-col">
      {/* ── Hero ── */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-linear-to-br from-ravively-green to-ravively-green-dark px-6 py-28 text-center text-white">
        <div className="pointer-events-none absolute inset-0" style={DOT_GRID} />
        {/* Image décorative coeurblanc */}
        <Image
          src="/coeurblanc.webp"
          alt=""
          width={360}
          height={360}
          className="pointer-events-none absolute -bottom-12 -right-12 w-64 select-none opacity-10 sm:w-80"
          aria-hidden
        />
        <Image
          src="/coeurblanc.webp"
          alt=""
          width={240}
          height={240}
          className="pointer-events-none absolute -left-10 -top-10 w-40 select-none opacity-[0.07] sm:w-52"
          aria-hidden
        />

        <div className="relative z-10 max-w-xl">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 shadow-2xl ring-1 ring-white/25 overflow-hidden">
            <Image src="/ravively.png" alt="Ravively" width={56} height={56} className="object-contain" />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-white/50">Portail Associations</p>
          <h1 className="mb-5 text-5xl font-black leading-tight tracking-tight sm:text-6xl">Ravively Pro</h1>
          <p className="mb-10 text-xl leading-relaxed text-white/75">
            Déclarez, suivez et gérez vos dons alimentaires en volume. Simple, rapide et solidaire.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-ravively-green shadow-2xl transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)] active:translate-y-0"
          >
            Accéder au portail
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
