const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
// TODO modifier pour inclure les changements liés aux préférences et genres
// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, username, email, gender, preference, bio, birthdate, city, 
                    is_confirmed, created_at 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        throw error;
    }
});

// Mettre à jour le profil
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { bio, city, gender, preference } = req.body;
        
        const [result] = await db.execute(
            `UPDATE users SET bio = ?, city = ?, gender = ?, preference = ? 
             WHERE id = ?`,
            [bio, city, gender, preference, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        throw error;
    }
});

// Changer le mot de passe
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Vérifier le mot de passe actuel
        const [users] = await db.execute(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        const user = users[0];
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hasher le nouveau mot de passe
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Mettre à jour
        await db.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        throw error;
    }
});

// Rechercher des utilisateurs
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { age_min, age_max, city, limit = 20, offset = 0 } = req.query;
        
        let query = `
            SELECT u.id, u.username, u.bio, u.birthdate, u.city, u.gender,
                   pp.file_path as profile_picture
            FROM users u
            LEFT JOIN profile_pictures pp ON u.id = pp.user_id AND pp.is_main = TRUE
            WHERE u.id != ?
        `;
        const params = [req.user.id];

        if (age_min || age_max) {
            if (age_min) {
                query += ' AND TIMESTAMPDIFF(YEAR, u.birthdate, CURDATE()) >= ?';
                params.push(age_min);
            }
            if (age_max) {
                query += ' AND TIMESTAMPDIFF(YEAR, u.birthdate, CURDATE()) <= ?';
                params.push(age_max);
            }
        }

        if (city) {
            query += ' AND u.city LIKE ?';
            params.push(`%${city}%`);
        }

        query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await db.execute(query, params);
        res.json(users);
    } catch (error) {
        throw error;
    }
});

module.exports = router;
