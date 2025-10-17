const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Liker un utilisateur
router.post('/like', authenticateToken, async (req, res) => {
    try {
        const { to_user_id } = req.body;

        if (to_user_id == req.user.id) {
            return res.status(400).json({ error: 'Cannot like yourself' });
        }

        // Vérifier si l'utilisateur cible existe
        const [targetUser] = await db.execute(
            'SELECT id FROM users WHERE id = ?',
            [to_user_id]
        );

        if (targetUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Vérifier si l'interaction existe déjà
        const [existingInteraction] = await db.execute(
            'SELECT id FROM interactions WHERE from_user_id = ? AND to_user_id = ?',
            [req.user.id, to_user_id]
        );

        if (existingInteraction.length > 0) {
            return res.status(400).json({ error: 'Already liked this user' });
        }

        // Vérifier si l'autre utilisateur nous a déjà liké
        const [reverseInteraction] = await db.execute(
            'SELECT id FROM interactions WHERE from_user_id = ? AND to_user_id = ?',
            [to_user_id, req.user.id]
        );

        const isMatch = reverseInteraction.length > 0;

        // Créer l'interaction
        await db.execute(
            'INSERT INTO interactions (from_user_id, to_user_id, is_match) VALUES (?, ?, ?)',
            [req.user.id, to_user_id, isMatch]
        );

        // Si c'est un match, mettre à jour l'interaction inverse
        if (isMatch) {
            await db.execute(
                'UPDATE interactions SET is_match = TRUE WHERE from_user_id = ? AND to_user_id = ?',
                [to_user_id, req.user.id]
            );
        }

        res.json({
            message: isMatch ? 'It\'s a match!' : 'Like sent successfully',
            is_match: isMatch
        });
    } catch (error) {
        throw error;
    }
});

// Obtenir la liste des matchs
router.get('/matches', authenticateToken, async (req, res) => {
    try {
        const [matches] = await db.execute(`
            SELECT u.id, u.username, u.bio, pp.file_path as profile_picture,
                   i.created_at as matched_at
            FROM interactions i
            JOIN users u ON u.id = i.to_user_id
            LEFT JOIN profile_pictures pp ON u.id = pp.user_id AND pp.is_main = TRUE
            WHERE i.from_user_id = ? AND i.is_match = TRUE
            ORDER BY i.created_at DESC
        `, [req.user.id]);

        res.json(matches);
    } catch (error) {
        throw error;
    }
});

// Obtenir les likes reçus
router.get('/likes-received', authenticateToken, async (req, res) => {
    try {
        const [likes] = await db.execute(`
            SELECT u.id, u.username, u.bio, pp.file_path as profile_picture,
                   i.created_at as liked_at
            FROM interactions i
            JOIN users u ON u.id = i.from_user_id
            LEFT JOIN profile_pictures pp ON u.id = pp.user_id AND pp.is_main = TRUE
            WHERE i.to_user_id = ? AND i.is_match = FALSE
            ORDER BY i.created_at DESC
        `, [req.user.id]);

        res.json(likes);
    } catch (error) {
        throw error;
    }
});

module.exports = router;
