

-- Drop l'ancinenne base de données si elle existe
DROP DATABASE IF EXISTS matcha;
-- Création de la base de données
CREATE DATABASE IF NOT EXISTS matcha CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE matcha;


-- Table des genres
CREATE TABLE genders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

-- Insertion des genres par défaut
INSERT INTO genders (label) VALUES
    ('man'),
    ('woman'),
    ('non-binary'),
    ('other'),
    ('prefer not to say');

-- Table des utilisateurs
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    firstname VARCHAR(30) NOT NULL,
    lastname VARCHAR(30) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    gender_id INT,
    bio TEXT,
    birthdate DATE,
    city VARCHAR(100),
    location_latitude DECIMAL(9,6),
    location_longitude DECIMAL(9,6),
    is_confirmed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gender_id) REFERENCES genders(id)
);

-- Table des préférences (liaison many-to-many)
CREATE TABLE user_preferences (
    user_id INT NOT NULL,
    gender_id INT NOT NULL,
    PRIMARY KEY (user_id, gender_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gender_id) REFERENCES genders(id) ON DELETE CASCADE
);

-- Table profile_pictures
CREATE TABLE profile_pictures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table interactions
CREATE TABLE interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_match BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table messages
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table tags
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO tags (name) VALUES
    ('sports'),
    ('music'),
    ('travel'),
    ('reading'),
    ('gaming'),
    ('cooking'),
    ('fitness'),
    ('art'),
    ('technology'),
    ('movies');

-- Table user_tags (association entre utilisateurs et tags)
CREATE TABLE user_tags (
    user_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (user_id, tag_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
