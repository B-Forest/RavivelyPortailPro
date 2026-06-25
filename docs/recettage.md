# Recettage — Ravively Pro

Tests réalisés manuellement (Postman pour l'API, navigateur pour le front) avant la
présentation client, jour J5 du planning.

## 1. Authentification

| # | Scénario | Résultat attendu | Statut |
|---|----------|-------------------|--------|
| 1 | Création d'un compte association avec tous les champs requis | 201, association + user créés, cookie posé | ✅ |
| 2 | Création d'un compte avec un email déjà utilisé | 409 "Un compte existe déjà avec cet email." | ✅ |
| 3 | Connexion avec identifiants valides | 200, cookie `ravively_token` posé | ✅ |
| 4 | Connexion avec mauvais mot de passe | 401 "Email ou mot de passe incorrect." | ✅ |
| 5 | Accès à `/dashboard` sans être connecté | Redirection vers `/login` (middleware Next.js) | ✅ |

## 2. Gestion des dons

| # | Scénario | Résultat attendu | Statut |
|---|----------|-------------------|--------|
| 6 | Création d'un don avec tous les champs obligatoires | 201, don créé avec statut `available` | ✅ |
| 7 | Création d'un don sans quantité | 400, message "Veuillez indiquer la quantité." | ✅ |
| 8 | Création d'un don sans DLC | 400, message lié à la DLC obligatoire | ✅ |
| 9 | Un utilisateur "particulier" tente de créer un don (POST /donations) | 403 "Accès réservé aux associations..." | ✅ |
| 10 | Récupération des dons d'une association via `GET /donations/association/:id` | 200, liste + `DashboardStats` cohérents | ✅ |
| 11 | Une association A tente de lire les dons de l'association B | 403 "Accès interdit à cette association." | ✅ |
| 12 | Changement de statut d'un don (`available` → `collected`) | 200, statut mis à jour, reflété dans le tableau de bord | ✅ |

## 3. UX / Accessibilité

| # | Scénario | Résultat attendu | Statut |
|---|----------|-------------------|--------|
| 13 | Formulaire de don sur mobile (375px) | Champs lisibles, boutons larges, pas de scroll horizontal | ✅ |
| 14 | Erreur de saisie sur le champ quantité | Message rouge explicite affiché sous le champ | ✅ |
| 15 | Navigation clavier (tab) sur le formulaire | Tous les champs accessibles dans l'ordre logique | ✅ |

## 4. Responsive / Mobile first

Le tableau de bord et le formulaire ont été vérifiés à 3 largeurs : 375px (mobile),
768px (tablette), 1280px (desktop) via les outils de développement du navigateur.
Le tableau des dons devient scrollable horizontalement sous 600px pour rester lisible.

## 5. Hébergement

Déploiement de test effectué sur :
- Front : Vercel (preview deployment, build Next.js sans erreur)
- API : Render (Web Service Node, variables d'environnement configurées)
- DB : MongoDB Atlas (cluster M0, IP whitelist 0.0.0.0/0 pour la démo)
