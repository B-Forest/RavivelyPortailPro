# Rétroplanning — 5 jours (~35h) — Binôme

Conforme au cahier des charges (répartition Développeur A / Développeur B).

## J1 — Initialisation (7h)

- Setup Git (repo + branches `main`/`dev`), structure des dossiers `backend`/`frontend`.
- Dev A : configuration MongoDB Atlas, modèles Mongoose (`User`, `Association`, `Donation`).
- Dev B : init Next.js (App Router) + Tailwind, charte graphique (vert Ravively, police 16/18px).
- Mise en place de l'authentification JWT (cookie httpOnly) côté API.

## J2 — API métier (7h)

- Dev A : endpoints `POST /donations`, `GET /donations/association/:id`, middleware
  de rôles (`requireAssociation`), tests Postman des cas valides/invalides.
- Dev B : pages `/login` et `/register`, appels API, gestion des erreurs côté formulaire.

## J3 — Tableau de bord (7h)

- Dev A : endpoint `PATCH /donations/:id/status`, calcul des `DashboardStats`.
- Dev B : page `/dashboard` — bouton "Déclarer un nouveau don", tableau récapitulatif
  (Produit/Volume, DLC, Statut), badges de statut.

## J4 — Formulaire de don (7h)

- Dev B : formulaire "Zéro Erreur" (`/donations/new`) — dénomination, catégorie,
  quantité/unité, DLC, allergènes, consignes de récupération, messages d'erreur explicites.
- Dev A : branchement et validations serveur (Mongoose + middleware d'erreurs).
- Pair programming sur la sécurisation des rôles (point critique du cahier des charges).

## J5 — Tests, recettage, déploiement, présentation (7h)

- Tests de bout en bout (parcours complet : inscription → connexion → déclaration de don
  → suivi dans le dashboard → changement de statut).
- Corrections de bugs, vérifications responsive/mobile-first et accessibilité (WCAG).
- Déploiement (Vercel + Render + MongoDB Atlas).
- Préparation de la présentation client + recettage formalisé (voir `recettage.md`).

## KPI de réussite du projet

- 100% des règles métier du cahier des charges respectées (rôles, DLC obligatoire, etc.).
- Parcours "déclarer un don" réalisable en moins de 2 minutes par un utilisateur non-technophile.
- Aucune erreur bloquante lors du recettage final (J5).
- Démo fonctionnelle déployée en ligne, accessible au client lors de la soutenance.

## Outil de suivi

Suivi de l'avancement avec le client via **Trello** (colonnes : Backlog / En cours /
À valider / Terminé), mise à jour quotidienne en fin de journée.
