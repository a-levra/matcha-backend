const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/profiles');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (error) {
            console.error('Error creating upload directory:', error);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'), false);
        }
    }
});

// Obtenir les photos de profil du client
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [pictures] = await db.execute(
            'SELECT id, file_path, is_main, uploaded_at FROM profile_pictures WHERE user_id = ? ORDER BY is_main DESC, uploaded_at DESC',
            [req.user.id]
        );

        res.json(pictures);
    } catch (error) {
        throw error;
    }
});

// Obtenir les photos de profil d'un utilisateur
router.get('/:user_id', authenticateToken, async (req, res) => {
    try {
        const [pictures] = await db.execute(
            'SELECT id, file_path, is_main, uploaded_at FROM profile_pictures WHERE user_id = ? ORDER BY is_main DESC, uploaded_at DESC',
            [req.params.user_id]
        );

        res.json(pictures);
    } catch (error) {
        throw error;
    }
});

// Upload d'une photo de profil
router.post('/upload', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = `/uploads/profiles/${req.file.filename}`;
        
        // Si c'est la première photo, la définir comme principale
        const [existingPictures] = await db.execute(
            'SELECT COUNT(*) as count FROM profile_pictures WHERE user_id = ?',
            [req.user.id]
        );

        const isMain = existingPictures[0].count === 0;

        const [result] = await db.execute(
            'INSERT INTO profile_pictures (user_id, file_path, is_main) VALUES (?, ?, ?)',
            [req.user.id, filePath, isMain]
        );

        res.status(201).json({
            id: result.insertId,
            file_path: filePath,
            is_main: isMain,
            message: 'Photo uploaded successfully'
        });
    } catch (error) {
        throw error;
    }
});

// Définir une photo comme principale
router.put('/:id/main', authenticateToken, async (req, res) => {
    try {
        const pictureId = req.params.id;

        // Vérifier que la photo appartient à l'utilisateur
        const [pictures] = await db.execute(
            'SELECT id FROM profile_pictures WHERE id = ? AND user_id = ?',
            [pictureId, req.user.id]
        );

        if (pictures.length === 0) {
            return res.status(404).json({ error: 'Picture not found' });
        }

        // Retirer le statut principal de toutes les autres photos
        await db.execute(
            'UPDATE profile_pictures SET is_main = FALSE WHERE user_id = ?',
            [req.user.id]
        );

        // Définir cette photo comme principale
        await db.execute(
            'UPDATE profile_pictures SET is_main = TRUE WHERE id = ?',
            [pictureId]
        );

        res.json({ message: 'Main picture updated successfully' });
    } catch (error) {
        throw error;
    }
});

// Supprimer une photo
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const pictureId = req.params.id;

        // Récupérer les infos de la photo
        const [pictures] = await db.execute(
            'SELECT file_path FROM profile_pictures WHERE id = ? AND user_id = ?',
            [pictureId, req.user.id]
        );

        if (pictures.length === 0) {
            return res.status(404).json({ error: 'Picture not found' });
        }

        const filePath = pictures[0].file_path;

        // Supprimer de la base de données
        await db.execute(
            'DELETE FROM profile_pictures WHERE id = ?',
            [pictureId]
        );

        // Supprimer le fichier physique
        try {
            const fullPath = path.join(__dirname, '..', filePath);
            await fs.unlink(fullPath);
        } catch (fileError) {
            console.error('Error deleting file:', fileError);
        }

        res.json({ message: 'Picture deleted successfully' });
    } catch (error) {
        throw error;
    }
});

module.exports = router;
