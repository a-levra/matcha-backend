const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { validateProfileUpdate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, username, firstname, lastname, email, gender_id, bio, birthdate, city, 
                    is_confirmed, created_at 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        users[0].birthdate = users[0].birthdate ? users[0].birthdate.toISOString().split('T')[0] : null;

        const [rows] = await db.execute(
            `SELECT g.label
            FROM user_preferences up
            JOIN genders g ON up.gender_id = g.id
            WHERE up.user_id = ?`,
            [req.user.id]
        );
        users[0].preferences = rows.map(r => r.label);

        res.json(users[0]);
    } catch (error) {
        throw error;
    }
});

// Obtenir les info d'un utilisateur
router.get('/profile/:user_id', async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, username, firstname, lastname, email, gender_id, bio, birthdate, city, 
                    is_confirmed, created_at 
             FROM users WHERE id = ?`,
            [req.params.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        users[0].birthdate = users[0].birthdate ? users[0].birthdate.toISOString().split('T')[0] : null;

        const [rows] = await db.execute(
            `SELECT g.label
            FROM user_preferences up
            JOIN genders g ON up.gender_id = g.id
            WHERE up.user_id = ?`,
            [req.params.user_id]
        );
        users[0].preferences = rows.map(r => r.label);

        res.json(users[0]);
    } catch (error) {
        throw error;
    }
});

router.post('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { username, firstname, lastname, bio, city, gender, preferences, birthdate } = req.body;
        const userId = req.user.id;

        await connection.beginTransaction();

        // Trouver l'id du genre principal
        const [genderRows] = await connection.execute(
            `SELECT id FROM genders WHERE label = ?`,
            [gender]
        );
        if (genderRows.length === 0) {
            throw new Error("Genre invalide.");
        }
        const genderId = genderRows[0].id;

        await connection.execute(
            `UPDATE users SET username = ?, firstname = ?, lastname = ?, bio = ?, city = ?, gender_id = ?, birthdate = ? WHERE id = ?`,
            [username, firstname, lastname, bio, city, genderId, birthdate, userId]
        );

        await connection.execute(
            `DELETE FROM user_preferences WHERE user_id = ?`,
            [userId]
        );

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

	// profile must have each of it's field filled, at least one interest and one image to be considered valid
	var is_confirmed = true;	
        const [users] = await connection.execute(
            `SELECT id, username, firstname, lastname, email, gender_id, bio, birthdate, city
             FROM users WHERE id = ?`,
            [userId]
        );
	if (users.length != 0){
	    Object.values(users[0]).forEach((value)=>{
		    if (value == null || value == undefined){
			is_confirmed = false;
		    }
	    });
    	}
	
        const [pictures] = await db.execute(
            'SELECT id FROM profile_pictures WHERE user_id = ? LIMIT 1',
            [userId]
        );
	if (pictures.length == 0){
	    is_confirmed = false;
	    console.log("Not enough pictures to be a confirmed user")
	}
	
        const [userTags] = await db.execute(`
            SELECT t.id, t.name 
            FROM user_tags ut
            JOIN tags t ON ut.tag_id = t.id
            WHERE ut.user_id = ?
            ORDER BY t.name
        `, [userId]);
	if (userTags.length == 0){
	    is_confirmed = false;
	    console.log("Not enough tags to be a confirmed user")
	}
	
	if (is_confirmed){
	    await connection.execute(
                `UPDATE users SET is_confirmed = ? WHERE id = ?`,
	        [is_confirmed, userId]
	    );
	    console.log("User is confirmed!");
	}

        await connection.commit();
        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    } finally {
        connection.release();
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
            SELECT u.id, u.username, u.bio, u.birthdate, u.city, u.gender_id,
                   pp.file_path as profile_picture
            FROM users u
            LEFT JOIN profile_pictures pp ON u.id = pp.user_id AND pp.is_main = TRUE
            WHERE u.id != ? AND u.is_confirmed=true
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
