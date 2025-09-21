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
        TEXT bio
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