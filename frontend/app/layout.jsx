import "./globals.css";

export const metadata = {
  title: "Ravively Pro — Portail Associations",
  description: "Portail web dédié aux associations pour la gestion des dons alimentaires en volume."
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
