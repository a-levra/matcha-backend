const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.code === 'ER_DUP_ENTRY') {
        if (err.message.includes('username')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        if (err.message.includes('email')) {
            return res.status(400).json({ error: 'Email already exists' });
        }
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
    }

    res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
