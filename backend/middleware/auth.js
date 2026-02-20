const jwt = require('jsonwebtoken');
const { User, Counselor } = require('../models');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided, access denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if it's a user or counselor token
        let user;
        if (decoded.type === 'counselor') {
            user = await Counselor.findByPk(decoded.userId);
        } else {
            user = await User.findByPk(decoded.userId);
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid token, user not found' });
        }
        
        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }
        
        req.user = user;
        req.userType = decoded.type || 'user';
        req.userId = user.id;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        logger.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            let user;
            if (decoded.type === 'counselor') {
                user = await Counselor.findByPk(decoded.userId);
            } else {
                user = await User.findByPk(decoded.userId);
            }
            
            if (user && user.isActive) {
                req.user = user;
                req.userType = decoded.type || 'user';
                req.userId = user.id;
            }
        }
        
        next();
    } catch (error) {
        // For optional auth, we don't throw errors, just continue without user
        next();
    }
};

const counselorAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided, access denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'counselor') {
            return res.status(403).json({ error: 'Access denied, counselor privileges required' });
        }
        
        const counselor = await Counselor.findByPk(decoded.userId);
        
        if (!counselor) {
            return res.status(401).json({ error: 'Invalid token, counselor not found' });
        }
        
        if (!counselor.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }
        
        req.user = counselor;
        req.userType = 'counselor';
        req.userId = counselor.id;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        logger.error('Counselor auth middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    authMiddleware,
    optionalAuth,
    counselorAuth
};