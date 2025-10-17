const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); //todo enlever si pas utilisé
const db = require('../config/database');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Inscription
router.post('/register', validateRegistration, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { username, email, password, gender, preferences, birthdate, bio, city } = req.body;

        // Hasher le mot de passe
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        await connection.beginTransaction();

        // Récupérer l'id du genre (si le front envoie un label)
        const [genderRows] = await connection.execute(
            `SELECT id FROM genders WHERE label = ?`,
            [gender]
        );
        if (genderRows.length === 0) {
            throw new Error("Genre invalide.");
        }
        const genderId = genderRows[0].id;

        // Insérer l'utilisateur
        const [result] = await connection.execute(
            `INSERT INTO users (username, email, password_hash, gender_id, birthdate, bio, city)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, passwordHash, genderId, birthdate, bio, city]
        );
        const userId = result.insertId;

        // Insérer les préférences (plusieurs possibles)
        for (const prefLabel of preferences) {
            const [prefRows] = await connection.execute(
                `SELECT id FROM genders WHERE label = ?`,
                [prefLabel]
            );
            if (prefRows.length === 0) {
                throw new Error(`Préférence invalide: ${prefLabel}`);
            }
            const prefId = prefRows[0].id;

            await connection.execute(
                `INSERT INTO user_preferences (user_id, gender_id) VALUES (?, ?)`,
                [userId, prefId]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: 'User created successfully',
            userId: userId
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l’inscription' });
    } finally {
        connection.release();
    }
});


// Connexion
router.post('/login', validateLogin, async (req, res) => {
    console.log("Login request received :", req.body);
    try {
        const { email, password } = req.body;

        // Trouver l'utilisateur
        const [users] = await db.execute(
            'SELECT id, username, email, password_hash FROM users WHERE email = ?',
            [email]
        );

        console.log("User lookup result for {", email ,"}:", users);
        if (users.length === 0 || users.length > 1) {
            // 401 to protect against user enumeration
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        console.log("Found user:", user);

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log("Password valid for user:", user.username);

        // Générer le token JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        throw error;
    }
});

// Vérification du token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
