# Ravively Pro — Portail Web Associations

Portail web destiné aux associations partenaires de Ravively (banques alimentaires,
associations caritatives, commerces partenaires) pour déclarer, suivre et gérer leurs
dons alimentaires en volume. Projet réalisé dans le cadre d'un Workshop Client — MBA
Développeur Full Stack — en binôme, sur 5 jours (~35h de développement).

Membres : Benjamin FOREST, ONDONGO Prince de Gloire

## 1. Stack technique

| Couche          | Techno                                              |
|-----------------|-----------------------------------------------------|
| Front-end       | Next.js 16 (App Router) + TypeScript + Tailwind v4  |
| UI              | React 19, Cache Components (`use cache`)          |
| Back-end        | Node.js + Express.js                                |
| Base de données | MongoDB + Mongoose                                  |
| Auth            | JWT stocké en cookie httpOnly sécurisé              |

## 2. Structure du dépôt

```
ravively-pro/
├── backend/                    # API Express / MongoDB
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/{User,Association,Donation}.js
│   ├── routes/{auth,associations,donations}.js
│   ├── seed.js                 # jeu de données de démo
│   └── server.js
└── frontend/                   # Next.js App Router (TypeScript)
    ├── src/
    │   ├── app/
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── profile/page.tsx
    │   │   ├── stats/page.tsx
    │   │   ├── donations/new/page.tsx
    │   │   └── donations/[id]/edit/page.tsx
    │   ├── components/
    │   ├── lib/{api,constants,types,exportCsv}.ts
    │   └── proxy.ts            # protection /dashboard, /donations, /profile, /stats
    ├── next.config.ts
    ├── tsconfig.json
    └── postcss.config.mjs      # Tailwind v4 (@tailwindcss/postcss)
```

## 3. Installation et lancement

### Pré-requis
- Node.js ≥ 20.9 (requis pour Next.js 16)
- Une instance MongoDB (locale via `mongod`, ou un cluster MongoDB Atlas gratuit)

### Backend
```bash
cd backend
cp .env.example .env       # renseigner MONGO_URI et JWT_SECRET
npm install
npm run seed                # (optionnel) crée un compte + des dons de démo
npm run dev                 # démarre l'API sur http://localhost:4000
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # démarre le portail sur http://localhost:3000
```

Compte de démonstration créé par `npm run seed` :
- Email : `marie@banquealimentaire-tours.fr`
- Mot de passe : `password123`

## 4. Hébergement envisagé (anticipation des contraintes)

Pour rester dans le budget et le délai d'un MVP étudiant :
- **Front-end (Next.js)** : Vercel (déploiement gratuit, intégré nativement à Next.js,
  SSR géré automatiquement).
- **Back-end (Express)** : Render ou Railway (plan gratuit, déploiement à partir du repo Git).
- **Base de données** : MongoDB Atlas (cluster gratuit M0, 512 Mo, suffisant pour le MVP).
- **Variables d'environnement** : `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` côté API ;
  `NEXT_PUBLIC_API_URL` côté front, configurées dans les dashboards Render/Vercel.
- **CORS & cookies** : l'API autorise uniquement l'origine du front (`CLIENT_URL`) et les
  cookies sont en `secure: true` + `sameSite: lax` en production pour fonctionner en HTTPS
  cross-domain (Vercel ↔ Render).

## 5. Back-office / administration du don

Le tableau de bord fait office de back-office minimal pour les associations :
- Liste des annonces actives et historique (récupérés / annulés), avec recherche, filtres et tri.
- Changement de statut directement depuis le tableau (`available`, `reserved`, `in_progress`,
  `collected`, `cancelled`).
- Modification d'un don existant (`/donations/[id]/edit`).
- Export CSV des dons filtrés.
- Badges d'alerte DLC (ExpiryBadge).
- Statistiques rapides sur le dashboard et page dédiée `/stats` (répartition, repas estimés).
- Page profil association (`/profile`) : coordonnées, SIRET, etc.
- Spécifications techniques : voir modèles `Donation`, `Association`, `User` et règles métier
  (seules les associations créent des dons, DLC/quantité/unité obligatoires, allergènes
  renseignables).

## 6. Recettage / tests réalisés

Voir `docs/recettage.md` pour le détail des scénarios testés manuellement (Postman + UI)
avant la démo client : création de compte, connexion, déclaration de don (cas valide et
cas d'erreur "Veuillez indiquer le nombre de kilos"), changement de statut, sécurité des
rôles (un particulier ne peut pas accéder à `/donations` POST).

## 7. Règles métier implémentées

- Seules les associations (et l'admin) peuvent créer un don (`requireAssociation`).
- Les particuliers n'ont pas accès aux routes du portail Pro (403 si rôle ≠ association/admin).
- La date limite de consommation (DLC) est obligatoire (validation Mongoose + front).
- La quantité et l'unité sont obligatoires.
- Les allergènes sont une liste à choix multiple, optionnelle.
- Chaque don possède un statut suivi dans le dashboard.

## 8. Accessibilité / Inclusion numérique

- Taille de police : 16px (corps de texte), 18px (champs de saisie).
- Contrastes conformes WCAG (texte sombre sur fond clair).
- Messages d'erreur explicites ("Veuillez indiquer le nombre de kilos" plutôt que
  "Champ requis").
- Boutons larges, parcours en une page, vocabulaire simple ("Déclarer un nouveau don").
