# 🏋️ Gym Management API - Express.js

API REST complète pour la gestion d'une salle de sport, utilisant Express.js

## 📋 Prérequis

- Node.js 18+


## 🚀 Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Configurer les variables d'environnement
# Éditez .env avec vos clés Supabase

# 4. Démarrer le serveur
npm run dev
```

## ⚙️ Configuration

Créez un fichier `.env` avec :

```env


## 📚 Endpoints API

### 🔐 Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil actuel |
| POST | `/api/auth/logout` | Déconnexion |

### 👤 Profils
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/profiles` | Liste (admin/coach) |
| GET | `/api/profiles/me` | Mon profil |
| PUT | `/api/profiles/me` | Modifier mon profil |
| DELETE | `/api/profiles/:userId` | Supprimer (admin) |

### 🏃 Coachs
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/coaches` | Liste des coachs actifs |
| GET | `/api/coaches/all` | Tous les coachs (admin) |
| POST | `/api/coaches` | Créer (admin) |
| PUT | `/api/coaches/:id` | Modifier |
| DELETE | `/api/coaches/:id` | Supprimer (admin) |

### 📚 Cours
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/courses` | Liste des cours |
| GET | `/api/courses/my` | Mes cours (coach) |
| POST | `/api/courses` | Créer (coach/admin) |
| PUT | `/api/courses/:id` | Modifier |
| DELETE | `/api/courses/:id` | Supprimer (admin) |

### 📅 Sessions
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sessions` | Liste des sessions |
| GET | `/api/sessions/upcoming` | Sessions à venir |
| GET | `/api/sessions/my` | Mes sessions (coach) |
| POST | `/api/sessions` | Créer |
| PUT | `/api/sessions/:id` | Modifier |
| DELETE | `/api/sessions/:id` | Supprimer |

### 📋 Réservations
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reservations` | Liste (admin) |
| GET | `/api/reservations/my` | Mes réservations |
| POST | `/api/reservations` | Réserver |
| PUT | `/api/reservations/:id` | Modifier |
| PUT | `/api/reservations/:id/attendance` | Marquer présence (coach) |
| DELETE | `/api/reservations/:id` | Annuler |

### 💳 Abonnements
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/subscriptions` | Liste (admin) |
| GET | `/api/subscriptions/my` | Mes abonnements |
| GET | `/api/subscriptions/my/active` | Mon abonnement actif |
| POST | `/api/subscriptions` | Souscrire |
| PUT | `/api/subscriptions/:id/cancel` | Annuler |

### 💰 Paiements
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/payments` | Liste (admin) |
| GET | `/api/payments/stats` | Statistiques (admin) |
| GET | `/api/payments/my` | Mes paiements |
| POST | `/api/payments` | Créer |

### 🏋️ Équipements
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/equipment` | Liste |
| GET | `/api/equipment/categories` | Catégories |
| POST | `/api/equipment` | Créer (admin) |
| PUT | `/api/equipment/:id` | Modifier (admin) |
| DELETE | `/api/equipment/:id` | Supprimer (admin) |

## 🔒 Authentification

Toutes les routes protégées nécessitent un header `Authorization`:

```
Authorization: Bearer <votre_jwt_token>
```

## 🎭 Rôles

- **admin** : Accès complet
- **coach** : Gestion de ses cours et sessions
- **member** : Réservations et abonnements

## 🚀 Déploiement



## 📝 Exemple d'utilisation

```javascript
// Login
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});

const { token } = await response.json();

// Utiliser le token
const courses = await fetch('http://localhost:3001/api/courses', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 📄 Licence

MIT
