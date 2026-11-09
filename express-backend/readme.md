# 🏋️ Gym Management API

API REST de gestion de salle de sport, construite avec **Node.js**, **Express.js** et **MySQL**. Le backend gère les comptes et rôles, les coachs, les cours et leurs horaires, les sessions, les réservations, les abonnements, les paiements, les équipements et les messages de contact.

## Prérequis

- Node.js 18 ou supérieur
- npm
- MySQL 8+ ou XAMPP avec MySQL activé

## Installation et démarrage

Depuis le dossier `express-backend` :

```bash
cd express-backend
npm install
```

Créez un fichier `.env` à la racine de `express-backend` (voir [Configuration](#configuration)), puis configurez la base de données :

1. Démarrez MySQL (ou XAMPP).
2. Dans phpMyAdmin ou le client MySQL, importez `database/schema.sql`. Le script crée la base `gym_management` et ses tables.
3. Démarrez le serveur en mode développement :

```bash
npm run dev
```

Pour lancer le serveur sans `nodemon` :

```bash
npm start
```

Par défaut, l'API écoute sur `http://localhost:3001`. Le point de contrôle `/health` indique également si MySQL est connecté. Le serveur peut démarrer sans connexion à la base, mais les routes qui nécessitent MySQL ne fonctionneront pas.

## Configuration

Créez `express-backend/.env` avec les variables suivantes et adaptez-les à votre installation :

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gym_management

JWT_SECRET=replace-this-with-a-long-random-secret

PORT=3001
NODE_ENV=development
```

Ne réutilisez pas l'exemple de clé JWT en production et ne publiez pas de secrets réels. Le fichier `.env` n'est pas nécessairement fourni sous le nom `.env.example`.

## API

Sauf mention contraire, les routes signalées comme protégées nécessitent un jeton JWT. Les routes admin et coach vérifient également le rôle de l'utilisateur.

### Santé du serveur

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/health` | Public | État du serveur et de la connexion MySQL |

### Authentification — `/api/auth`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/register` | Public | Créer un compte membre |
| POST | `/login` | Public | Se connecter et obtenir un JWT |
| GET | `/me` | Protégé | Obtenir le compte et le profil courants |
| POST | `/logout` | Protégé | Confirmer la déconnexion côté client (JWT stateless) |
| POST | `/change-password` | Protégé | Changer le mot de passe |

### Profils — `/api/profiles`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Coach/admin | Lister les profils |
| GET | `/me` | Protégé | Obtenir son profil |
| PUT | `/me` | Protégé | Modifier son profil |
| GET | `/:id` | Protégé | Obtenir un profil par son ID de profil |
| PUT | `/:userId` | Admin | Modifier le profil d'un utilisateur |
| DELETE | `/:userId` | Admin | Supprimer un utilisateur (et ses données liées) |

### Coachs — `/api/coaches`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Public | Lister les coachs actifs |
| GET | `/all` | Admin | Lister tous les coachs |
| GET | `/:id` | Public | Obtenir un coach par ID |
| POST | `/` | Admin | Créer un coach à partir d'un utilisateur existant |
| PUT | `/:id` | Coach propriétaire/admin | Modifier un coach |
| DELETE | `/:id` | Admin | Supprimer un coach |

### Cours — `/api/courses`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Public (auth facultative) | Lister les cours actifs; un admin peut aussi voir les cours inactifs |
| GET | `/my` | Coach/admin | Lister les cours du coach connecté |
| GET | `/:id` | Public | Obtenir un cours par ID |
| POST | `/` | Coach/admin | Créer un cours (un coach est associé à ses propres cours) |
| PUT | `/:id` | Coach propriétaire/admin | Modifier un cours |
| DELETE | `/:id` | Coach propriétaire/admin | Supprimer un cours, ses horaires, ses sessions et réservations associées |

### Horaires — `/api/schedules`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Public | Lister les horaires actifs; filtre facultatif `?courseId=...` |
| GET | `/:id` | Public | Obtenir un horaire par ID |
| POST | `/` | Admin | Créer un horaire de cours |
| PUT | `/:id` | Admin | Modifier un horaire |
| DELETE | `/:id` | Admin | Supprimer un horaire |

### Sessions — `/api/sessions`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Public | Lister les sessions; filtres facultatifs `courseId`, `date`, `status` |
| GET | `/upcoming` | Public | Lister jusqu'à 20 sessions programmées à venir |
| GET | `/my` | Coach/admin | Lister les sessions des cours du coach connecté |
| GET | `/:id` | Public | Obtenir une session par ID |
| POST | `/` | Coach/admin | Créer une session |
| PUT | `/:id` | Coach/admin | Modifier une session |
| DELETE | `/:id` | Coach propriétaire/admin | Supprimer une session et ses réservations |

### Réservations — `/api/reservations`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Admin | Lister les réservations; filtres facultatifs `sessionId`, `userId`, `status` |
| GET | `/my` | Protégé | Lister ses réservations |
| GET | `/session/:sessionId` | Coach/admin | Lister les réservations d'une session |
| POST | `/` | Protégé | Réserver une session (corps : `sessionId`) |
| PUT | `/:id` | Propriétaire/coach/admin | Modifier le statut d'une réservation |
| PUT | `/:id/attendance` | Coach/admin | Marquer la présence (`attended: true` ou `false`) |
| DELETE | `/:id` | Propriétaire/admin | Annuler une réservation |

### Types d'abonnement — `/api/subscription-types`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Public | Lister les types actifs |
| GET | `/all` | Admin | Lister tous les types |
| GET | `/:id` | Public | Obtenir un type par ID |
| POST | `/` | Admin | Créer un type |
| PUT | `/:id` | Admin | Modifier un type |
| DELETE | `/:id` | Admin | Désactiver un type sans le supprimer |

### Abonnements — `/api/subscriptions`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Admin | Lister les abonnements; filtres facultatifs `status`, `userId` |
| GET | `/my` | Protégé | Lister ses abonnements |
| GET | `/my/active` | Protégé | Obtenir son abonnement actif, ou `null` |
| POST | `/` | Protégé | Souscrire à un type actif (`subscriptionTypeId`, `autoRenew` facultatif) |
| PUT | `/:id` | Admin | Modifier le statut, la date de fin ou le renouvellement automatique |
| PUT | `/:id/cancel` | Propriétaire/admin | Annuler un abonnement |

### Paiements — `/api/payments`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Admin | Lister les paiements; filtres facultatifs `userId`, `status`, `limit` |
| GET | `/stats` | Admin | Obtenir les statistiques de paiement |
| GET | `/my` | Protégé | Lister ses paiements |
| GET | `/:id` | Propriétaire/admin | Obtenir un paiement par ID |
| POST | `/` | Protégé | Enregistrer un paiement (`amount`, `subscriptionId`, `paymentMethod`, `notes`) |
| PUT | `/:id` | Admin | Modifier le statut ou les notes |

> La route de création enregistre un paiement dans la base; elle n'intègre pas à elle seule un prestataire de paiement ni ne traite une transaction par carte.

### Équipements — `/api/equipment`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Public | Lister les équipements; filtres facultatifs `category`, `status` |
| GET | `/categories` | Public | Lister les catégories |
| GET | `/:id` | Public | Obtenir un équipement par ID |
| POST | `/` | Admin | Créer un équipement |
| PUT | `/:id` | Admin | Modifier un équipement |
| DELETE | `/:id` | Admin | Supprimer un équipement |

### Rôles utilisateurs — `/api/user-roles`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Admin | Lister les rôles |
| GET | `/:userId` | Propriétaire/admin | Obtenir le rôle d'un utilisateur |
| PUT | `/:userId` | Admin | Définir le rôle (`admin`, `coach` ou `member`) |

### Messages de contact — `/api/contact-messages`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/` | Admin | Lister les messages |
| GET | `/stats` | Admin | Obtenir les statistiques des messages |
| POST | `/` | Public | Envoyer un message de contact |
| PUT | `/:id/read` | Admin | Marquer un message comme lu |
| DELETE | `/:id` | Admin | Supprimer un message |

### Exports — `/api/export`

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/reservations` | Coach/admin | Exporter les réservations |
| GET | `/reservations/my` | Protégé | Exporter ses réservations |
| GET | `/courses` | Admin | Exporter les cours |
| GET | `/subscriptions` | Admin | Exporter les abonnements |
| GET | `/members` | Admin | Exporter les profils et rôles |
| GET | `/payments` | Admin | Exporter les paiements |
| GET | `/payments/my` | Protégé | Exporter ses paiements |
| GET | `/sessions/my` | Protégé | Exporter les sessions associées à l'utilisateur |
| GET | `/attendance/:sessionId` | Coach/admin | Exporter les réservations d'une session |

## Authentification

Après l'inscription ou la connexion, l'API renvoie un JWT. Envoyez-le dans l'en-tête des requêtes protégées :

```http
Authorization: Bearer <votre_jwt_token>
```

Les jetons expirent après 7 jours. La déconnexion est gérée côté client, car le serveur ne révoque pas les JWT stateless.

### Exemple de connexion

```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});

const { token } = await response.json();

const courses = await fetch('http://localhost:3001/api/courses', {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Rôles

- **admin** : administration de la salle et accès aux opérations réservées à l'administration.
- **coach** : gestion de ses cours, sessions et présences selon les contrôles de propriété des routes.
- **member** : profil personnel, réservations, abonnements et paiements personnels.

## Structure principale

```text
express-backend/
├── database/schema.sql    # Schéma MySQL et données initiales
├── src/config/            # Configuration MySQL
├── src/middleware/        # Authentification et rôles
├── src/routes/            # Routes de l'API
├── src/utils/              # Utilitaires
├── src/index.js            # Point d'entrée Express
├── package.json
└── readme.md
```

## Licence

MIT
