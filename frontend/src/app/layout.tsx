import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Sidebar } from "../components/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Ravively Pro — Portail Associations",
  description: "Portail web dédié aux associations pour la gestion des dons alimentaires en volume.",
  openGraph: {
    title: "Ravively Pro — Portail Associations",
    description: "Portail web dédié aux associations pour la gestion des dons alimentaires en volume.",
    images: [{ url: "/OpenGraph.png", width: 1200, height: 630, alt: "Ravively Pro" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ravively Pro — Portail Associations",
    description: "Portail web dédié aux associations pour la gestion des dons alimentaires en volume.",
    images: ["/OpenGraph.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={`min-h-screen ${inter.className}`}>
        <Suspense><Sidebar /></Suspense>
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
