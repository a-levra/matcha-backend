const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtenir tous les tags
router.get('/', async (req, res) => {
    try {
        const [tags] = await db.execute('SELECT * FROM tags ORDER BY name');
        res.json(tags);
    } catch (error) {
        throw error;
    }
});

// Créer un nouveau tag
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Tag name is required' });
        }

        const [result] = await db.execute(
            'INSERT INTO tags (name) VALUES (?)',
            [name.trim().toLowerCase()]
        );

        res.status(201).json({
            id: result.insertId,
            name: name.trim().toLowerCase(),
            message: 'Tag created successfully'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Tag already exists' });
        }
        throw error;
    }
});

// Obtenir les tags d'un utilisateur
router.get('/user/:user_id', async (req, res) => {
    try {
        const userId = req.params.user_id;

        const [userTags] = await db.execute(`
            SELECT t.id, t.name 
            FROM user_tags ut
            JOIN tags t ON ut.tag_id = t.id
            WHERE ut.user_id = ?
            ORDER BY t.name
        `, [userId]);

        res.json(userTags);
    } catch (error) {
        throw error;
    }
});

// Ajouter un tag à l'utilisateur connecté
router.post('/user', authenticateToken, async (req, res) => {
    try {
        const { tag_id } = req.body;

        // Vérifier que le tag existe
        const [tags] = await db.execute('SELECT id FROM tags WHERE id = ?', [tag_id]);
        if (tags.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        // Ajouter le tag à l'utilisateur
        await db.execute(
            'INSERT IGNORE INTO user_tags (user_id, tag_id) VALUES (?, ?)',
            [req.user.id, tag_id]
        );

        res.json({ message: 'Tag added successfully' });
    } catch (error) {
        throw error;
    }
});

// Supprimer un tag de l'utilisateur connecté
router.delete('/user/:tag_id', authenticateToken, async (req, res) => {
    try {
        const tagId = req.params.tag_id;

        const [result] = await db.execute(
            'DELETE FROM user_tags WHERE user_id = ? AND tag_id = ?',
            [req.user.id, tagId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag not found for this user' });
        }

        res.json({ message: 'Tag removed successfully' });
    } catch (error) {
        throw error;
    }
});

module.exports = router;