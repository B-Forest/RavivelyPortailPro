import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  cacheLife: {
    static: {
      stale: 300,
      revalidate: 3600,
      expire: 86400
    }
  },
  // Toutes les requêtes /api/* côté frontend sont automatiquement redirigées vers l'API backend.
  // Ainsi, le navigateur ne communique jamais directement avec le backend : les cookies d'authentification restent sur le domaine frontend.
  // Cela garantit le fonctionnement de SameSite=Lax pour les cookies, même en production avec des domaines séparés (Vercel ↔ Render).
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
