const express = require('express');
const { body, validationResult } = require('express-validator');
const { BreathingSession } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Get breathing sessions
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 30, offset = 0 } = req.query;

        const sessions = await BreathingSession.findAndCountAll({
            where: { userId },
            order: [['completedAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            sessions: sessions.rows,
            total: sessions.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        logger.error('Get breathing sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create breathing session
router.post('/', [
    body('duration').isInt({ min: 60, max: 3600 }).withMessage('Duration must be between 1 and 60 minutes'),
    body('technique').isString().isIn(['box', '4-7-8', 'equal', 'triangle']).withMessage('Invalid breathing technique')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.userId;
        const { duration, technique } = req.body;

        const session = await BreathingSession.create({
            userId,
            duration,
            technique,
            completedAt: new Date()
        });

        logger.info(`Breathing session completed: ${session.id} for user ${userId}`);

        res.status(201).json({
            message: 'Breathing session recorded successfully',
            session
        });
    } catch (error) {
        logger.error('Create breathing session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get breathing statistics
router.get('/stats', async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const sessions = await BreathingSession.findAll({
            where: {
                userId,
                completedAt: {
                    [Op.gte]: startDate
                }
            }
        });

        const totalSessions = sessions.length;
        const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
        const averageDuration = totalSessions > 0 ? totalTime / totalSessions : 0;

        // Group by technique
        const techniqueStats = {};
        sessions.forEach(session => {
            if (!techniqueStats[session.technique]) {
                techniqueStats[session.technique] = {
                    count: 0,
                    totalTime: 0
                };
            }
            techniqueStats[session.technique].count++;
            techniqueStats[session.technique].totalTime += session.duration;
        });

        res.json({
            totalSessions,
            totalTime,
            averageDuration: Math.round(averageDuration),
            techniqueStats,
            period: `${days} days`
        });
    } catch (error) {
        logger.error('Get breathing stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;