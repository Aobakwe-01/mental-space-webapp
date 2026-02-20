const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(err);

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = {
            message: 'Validation Error',
            details: message
        };
        return res.status(400).json({
            error: 'Validation Error',
            details: message
        });
    }

    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = 'Duplicate field value entered';
        error = { message };
        return res.status(400).json({
            error: 'Duplicate field value entered'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message };
        return res.status(401).json({
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message };
        return res.status(401).json({
            error: 'Token expired'
        });
    }

    // Multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large';
        error = { message };
        return res.status(400).json({
            error: 'File too large'
        });
    }

    // General error response
    res.status(error.statusCode || 500).json({
        error: error.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;