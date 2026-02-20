const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const moodRoutes = require('./routes/moods');
const programRoutes = require('./routes/programs');
const chatRoutes = require('./routes/chat');
const breathingRoutes = require('./routes/breathing');
const achievementRoutes = require('./routes/achievements');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import database
const { sequelize } = require('./models');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.'
    },
    skipSuccessfulRequests: true
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: require('./package.json').version
    });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/moods', authMiddleware, moodRoutes);
app.use('/api/programs', authMiddleware, programRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/breathing', authMiddleware, breathingRoutes);
app.use('/api/achievements', authMiddleware, achievementRoutes);

// Socket.io setup for real-time chat
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }
});

// Socket.io authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    
    const jwt = require('jsonwebtoken');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userType = decoded.type || 'user';
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Update online status
    if (socket.userType === 'counselor') {
        socket.broadcast.emit('counselor:online', socket.userId);
    }
    
    // Chat events
    socket.on('chat:join', (sessionId) => {
        socket.join(`chat:${sessionId}`);
        socket.to(`chat:${sessionId}`).emit('user:joined', socket.userId);
    });
    
    socket.on('chat:leave', (sessionId) => {
        socket.leave(`chat:${sessionId}`);
        socket.to(`chat:${sessionId}`).emit('user:left', socket.userId);
    });
    
    socket.on('chat:message', (data) => {
        const { sessionId, message } = data;
        socket.to(`chat:${sessionId}`).emit('chat:message', {
            senderId: socket.userId,
            message: message,
            timestamp: new Date()
        });
    });
    
    socket.on('chat:typing', (data) => {
        const { sessionId, isTyping } = data;
        socket.to(`chat:${sessionId}`).emit('chat:typing', {
            userId: socket.userId,
            isTyping: isTyping
        });
    });
    
    // Disconnect handling
    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.userId}`);
        if (socket.userType === 'counselor') {
            socket.broadcast.emit('counselor:offline', socket.userId);
        }
    });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Database connection and server startup
sequelize.authenticate()
    .then(() => {
        logger.info('Database connection established successfully');
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        logger.info('Database synchronized');
        server.listen(PORT, () => {
            logger.info(`MentalSpace server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch(err => {
        logger.error('Unable to start server:', err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        sequelize.close().then(() => {
            logger.info('Server and database connections closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        sequelize.close().then(() => {
            logger.info('Server and database connections closed');
            process.exit(0);
        });
    });
});

module.exports = app;