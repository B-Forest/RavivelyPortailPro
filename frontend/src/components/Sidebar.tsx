"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

const AUTH_ROUTES = ["/", "/login", "/register"];

const NAV = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  },
  {
    href: "/donations/new",
    label: "Nouveau don",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  },
  {
    href: "/donations/import",
    label: "Import en masse",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <polyline points="9 14 12 17 15 14" />
      </svg>
    )
  },
  {
    href: "/stats",
    label: "Statistiques",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  },
  {
    href: "/profile",
    label: "Mon profil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    api.me().then(({ user }) => {
      const f = user.firstname?.[0] ?? "";
      const l = user.lastname?.[0] ?? "";
      setInitials((f + l).toUpperCase() || "?");
    }).catch(() => {});
  }, []);

  if (AUTH_ROUTES.includes(pathname)) return null;

  return (
    <aside className="fixed left-3 top-3 z-40 flex h-[calc(100vh-1.5rem)] w-[72px] flex-col items-center rounded-[2rem] bg-ravively-green py-4 shadow-xl">
      {/* Logo */}
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 overflow-hidden">
        <Image src="/ravively.png" alt="Ravively" width={48} height={48} className="object-contain" />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-2" aria-label="Navigation principale">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                active
                  ? "bg-[#2d9e65] text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              {icon}
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-[calc(100%+10px)] whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User avatar */}
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2d9e65] text-sm font-bold text-white">
        {initials}
      </div>
    </aside>
  );
}
