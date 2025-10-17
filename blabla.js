

// ====================================
// config/database.js - Configuration DB
// ====================================


// ====================================
// middleware/auth.js - Authentification JWT
// ====================================

// ====================================
// middleware/validation.js - Validation des données
// ====================================

// ====================================
// middleware/errorHandler.js - Gestion des erreurs
// ====================================

// ====================================
// routes/auth.js - Routes d'authentification
// ====================================

// ====================================
// routes/users.js - Gestion des utilisateurs
// ====================================

// ====================================
// routes/profiles.js - Gestion des photos de profil
// ====================================

// ====================================
// routes/interactions.js - Gestion des likes/matchs
// ====================================

// ====================================
// routes/messages.js - Gestion des messages
// ====================================


// ====================================
// routes/tags.js - Gestion des tags
// ====================================


// ====================================
// .env - Variables d'environnement (exemple)
// ====================================
/*


// ====================================
// utils/email.js - Utilitaires email (optionnel)
// ====================================

// ====================================
// Documentation API - README.md
// ====================================
/*
# Matcha Backend API

Backend RESTful pour l'application de rencontres Matcha.

## Installation

1. Cloner le projet
2. Installer les dépendances : `npm install`
3. Créer le fichier `.env` avec vos variables d'environnement
4. Créer la base de données MySQL avec le script SQL fourni
5. Lancer en développement : `npm run dev`
6. Lancer en production : `npm start`

## Structure du projet

```
matcha-backend/
├── server.js              # Point d'entrée
├── config/
│   └── database.js         # Configuration DB
├── middleware/
│   ├── auth.js            # Authentification JWT
│   ├── validation.js      # Validation des données
│   └── errorHandler.js    # Gestion des erreurs
├── routes/
│   ├── auth.js           # Routes d'authentification
│   ├── users.js          # Gestion utilisateurs
│   ├── profiles.js       # Photos de profil
│   ├── interactions.js   # Likes et matchs
│   ├── messages.js       # Messagerie
│   └── tags.js           # Gestion des tags
├── utils/
│   └── email.js          # Utilitaires email
├── uploads/
│   └── profiles/         # Photos uploadées
├── package.json
└── .env                  # Variables d'environnement
```

## Usage

### Exemple d'inscription
```javascript
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "gender": "male",
  "preference": "female",
  "birthdate": "1990-01-15",
  "bio": "Hello, I'm John!",
  "city": "Paris"
}
```

### Exemple de connexion
```javascript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Exemple d'upload de photo
```javascript
POST /api/profiles/upload
Content-Type: multipart/form-data
Authorization: Bearer your-jwt-token

photo: [fichier image]
```

### Exemple de like
```javascript
POST /api/interactions/like
Authorization: Bearer your-jwt-token
{
  "to_user_id": 123
}
```

### Exemple d'envoi de message
```javascript
POST /api/messages
Authorization: Bearer your-jwt-token
{
  "receiver_id": 123,
  "content": "Salut ! Comment ça va ?"
}
```

## Variables d'environnement requises

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=matcha
JWT_SECRET=your_jwt_secret
PORT=3000
FRONTEND_URL=http://localhost:3001
```

## Tests

Pour lancer les tests : `npm test`

## Déploiement

1. Configurer les variables d'environnement de production
2. Installer PM2 : `npm install -g pm2`
3. Lancer avec PM2 : `pm2 start server.js --name matcha-api`
4. Configurer un reverse proxy (nginx) si nécessaire

## Support

Pour toute question ou problème, consultez la documentation ou créez une issue.
*/