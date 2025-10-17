# Lancement

Serveur : ```npm start``` <br>
BDD : ```npx mysql -u root -p < database/schema.sql```


# Shéma de la bdd

Ce shéma est à lire avec un plugin [Mermaid](https://mermaid.live/). <br>
Plugin vscode adapté : [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=vstirbu.vscode-mermaid-preview).
```mermaid
erDiagram
    users ||--o{ profile_pictures : has
    users ||--o{ interactions : from_user
    users ||--o{ interactions : to_user
    users ||--o{ messages : sender
    users ||--o{ messages : receiver
    users ||--o{ user_tags : has
    tags ||--o{ user_tags : tagged
    users {
        INT id PK
        VARCHAR usernamea
        VARCHAR email
        VARCHAR password_hash
        ENUM gender
        ENUM preference
        TEXT bio``
        DATE birthdate
        VARCHAR city
        BOOLEAN is_confirmed
        DATETIME created_at
    }
    profile_pictures {
        INT id PK
        INT user_id FK
        VARCHAR file_path
        BOOLEAN is_main
        DATETIME uploaded_at
    }
    interactions {
        INT id PK
        INT from_user_id FK
        INT to_user_id FK
        DATETIME created_at
        BOOLEAN is_match
    }
    messages {
        INT id PK
        INT sender_id FK
        INT receiver_id FK
        TEXT content
        DATETIME sent_at
    }
    tags {
        INT id PK
        VARCHAR name
    }
    user_tags {
        INT user_id FK
        INT tag_id FK
    }
```


## Routes API

### Authentification (`/api/auth`)
- `POST /register` - Inscription
- `POST /login` - Connexion
- `GET /verify` - Vérification du token JWT

### Utilisateurs (`/api/users`)
- `GET /profile` - Obtenir son profil
- `PUT /profile` - Mettre à jour son profil
- `PUT /password` - Changer son mot de passe
- `GET /search` - Rechercher des utilisateurs

### Photos de profil (`/api/profiles`)
- `GET /` - Obtenir ses photos
- `POST /upload` - Upload une photo
- `PUT /:id/main` - Définir comme photo principale
- `DELETE /:id` - Supprimer une photo

### Interactions (`/api/interactions`)
- `POST /like` - Liker un utilisateur
- `GET /matches` - Obtenir ses matchs
- `GET /likes-received` - Obtenir les likes reçus

### Messages (`/api/messages`)
- `POST /` - Envoyer un message
- `GET /conversation/:user_id` - Conversation avec un utilisateur
- `GET /conversations` - Toutes les conversations

### Tags (`/api/tags`)
- `GET /` - Obtenir tous les tags
- `POST /` - Créer un tag
- `GET /user/:user_id` - Tags d'un utilisateur
- `POST /user` - Ajouter un tag à son profil
- `DELETE /user/:tag_id` - Supprimer un tag de son profil

## Fonctionnalités

### Sécurité
- Authentification JWT
- Hashage des mots de passe avec bcrypt
- Validation des données avec Joi
- Protection CORS et Helmet
- Rate limiting
- Gestion des erreurs centralisée

### Upload de fichiers
- Upload d'images de profil
- Validation des types de fichiers
- Limitation de taille (5MB)
- Gestion automatique des dossiers

### Base de données
- Pool de connexions MySQL
- Transactions pour les opérations critiques
- Relations avec clés étrangères
- Index pour les performances

### API Features
- Pagination pour les listes
- Filtres de recherche
- Gestion des matchs automatique
- Système de messages entre utilisateurs matchés
- Gestion des tags utilisateur
