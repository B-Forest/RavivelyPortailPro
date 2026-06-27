import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Sidebar } from "../components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ravively Pro — Portail Associations",
  description: "Portail web dédié aux associations pour la gestion des dons alimentaires en volume."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <Suspense><Sidebar /></Suspense>
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
