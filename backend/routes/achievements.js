const express = require('express');
const { Achievement, UserAchievement, User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Get all achievements
router.get('/', async (req, res) => {
    try {
        const achievements = await Achievement.findAll({
            where: { isActive: true },
            order: [['category', 'ASC'], ['points', 'DESC']]
        });

        res.json(achievements);
    } catch (error) {
        logger.error('Get achievements error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's achievements
router.get('/user', async (req, res) => {
    try {
        const userId = req.userId;

        const userAchievements = await UserAchievement.findAll({
            where: { userId },
            include: [{
                model: Achievement,
                as: 'achievement'
            }],
            order: [['earnedAt', 'DESC']]
        });

        const totalPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

        res.json({
            achievements: userAchievements,
            totalPoints,
            count: userAchievements.length
        });
    } catch (error) {
        logger.error('Get user achievements error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get achievement progress
router.get('/progress', async (req, res) => {
    try {
        const userId = req.userId;

        // This is a simplified version - in a real app, you'd calculate progress
        // based on user activity, mood entries, program completions, etc.
        const allAchievements = await Achievement.findAll({
            where: { isActive: true }
        });

        const userAchievements = await UserAchievement.findAll({
            where: { userId },
            attributes: ['achievementId']
        });

        const earnedIds = userAchievements.map(ua => ua.achievementId);

        const progress = allAchievements.map(achievement => ({
            ...achievement.toJSON(),
            earned: earnedIds.includes(achievement.id),
            progress: earnedIds.includes(achievement.id) ? 100 : 0
        }));

        res.json(progress);
    } catch (error) {
        logger.error('Get achievement progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;