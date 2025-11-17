const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');

const router = express.Router();

// Envoyer un message
router.post('/', authenticateToken, validateMessage, async (req, res) => {
    try {
        const { receiver_id, content } = req.body;

        // Vérifier que c'est un match
        const [match] = await db.execute(`
            SELECT 1 FROM interactions 
            WHERE ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
            AND is_match = TRUE
        `, [req.user.id, receiver_id, receiver_id, req.user.id]);

        if (match.length === 0) {
            return res.status(403).json({ error: 'Can only message matched users' });
        }

        // Envoyer le message
        const [result] = await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [req.user.id, receiver_id, content]
        );

        res.status(201).json({
            id: result.insertId,
            sender_id: req.user.id,
            receiver_id,
            content,
            sent_at: new Date(),
            message: 'Message sent successfully'
        });
    } catch (error) {
        throw error;
    }
});

// Obtenir la conversation avec un utilisateur
router.get('/conversation/:user_id', authenticateToken, async (req, res) => {
    try {
        const otherUserId = req.params.user_id;
        const { limit = 50, offset = 0 } = req.query;

        // Vérifier que c'est un match
        const [match] = await db.execute(`
            SELECT 1 FROM interactions 
            WHERE ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
            AND is_match = TRUE
        `, [req.user.id, otherUserId, otherUserId, req.user.id]);

        if (match.length === 0) {
            return res.status(403).json({ error: 'Not matched with this user' });
        }

        // Récupérer les messages
        // Messages need to be sorted by id (and date if possible), if only by date then mixup can appear
        const [messages] = await db.execute(`
            SELECT m.*, u.username as sender_username
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.id DESC 
            LIMIT ? OFFSET ?
        `, [req.user.id, otherUserId, otherUserId, req.user.id, parseInt(limit), parseInt(offset)]);

        res.json(messages.reverse());
    } catch (error) {
        throw error;
    }
});

// Obtenir toutes les conversations
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const [conversations] = await db.execute(`
            SELECT 
                u.id, u.username, pp.file_path as profile_picture,
                m.content as last_message,
                m.sent_at as last_message_at,
                (SELECT COUNT(*) FROM messages 
                 WHERE sender_id = u.id AND receiver_id = ? 
                 AND sent_at > COALESCE(
                    (SELECT MAX(sent_at) FROM messages WHERE sender_id = ? AND receiver_id = u.id), 
                    '1970-01-01'
                 )) as unread_count
            FROM users u
            JOIN interactions i ON (
                (i.from_user_id = u.id AND i.to_user_id = ?) OR 
                (i.from_user_id = ? AND i.to_user_id = u.id)
            ) AND i.is_match = TRUE
            LEFT JOIN profile_pictures pp ON u.id = pp.user_id AND pp.is_main = TRUE
            LEFT JOIN messages m ON (
                (m.sender_id = u.id AND m.receiver_id = ?) OR 
                (m.sender_id = ? AND m.receiver_id = u.id)
            )
            WHERE m.id = (
                SELECT MAX(id) FROM messages 
                WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
            ) OR m.id IS NULL
            ORDER BY m.sent_at DESC
        `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

        res.json(conversations);
    } catch (error) {
        throw error;
    }
});

module.exports = router;
