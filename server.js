require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const ws = require('ws')

// import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profiles');
const interactionRoutes = require('./routes/interactions');
const messageRoutes = require('./routes/messages');
const tagRoutes = require('./routes/tags');

// middleware d'erreur
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware de sécurité
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limite chaque IP à 100 requêtes par fenêtre //TODO reset to 100 after debug
});
app.use(limiter);

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pour intercepter les JSON mal formés
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON format' });
    }
    next(err);
});

// Servir les fichiers statiques (images de profil)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
	setHeaders: function(res, path){
		res.set("Cross-Origin-Resource-Policy", "cross-origin");
	}
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tags', tagRoutes);

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Matcha API is running' });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Gestion des routes non trouvées
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const wsServer = new ws.Server({ noServer: true })

wsServer.on('connection', function connection(ws) {
    console.log('New client connected');

    ws.on('message', function message(data) {
        const messageText = data.toString();
        console.log('Received:', messageText);
        ws.send(`Echo: ${messageText}`);
    });

    ws.on('close', function close() {
        console.log('Client disconnected');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('upgrade', (req, socket, head) => {
  wsServer.handleUpgrade(req, socket, head, (ws) => {
    wsServer.emit('connection', ws, req)
    
  })
});
