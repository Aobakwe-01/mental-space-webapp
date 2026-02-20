const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { MoodEntry, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const router = express.Router();

// Get mood history
router.get('/', [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { startDate, endDate, limit = 30, offset = 0 } = req.query;
        const userId = req.userId;

        const whereClause = { userId };

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date[Op.gte] = startDate;
            if (endDate) whereClause.date[Op.lte] = endDate;
        }

        const moodEntries = await MoodEntry.findAndCountAll({
            where: whereClause,
            order: [['date', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            moods: moodEntries.rows,
            total: moodEntries.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        logger.error('Get mood history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create mood entry
router.post('/', [
    body('mood').isInt({ min: 1, max: 5 }).withMessage('Mood must be between 1 and 5'),
    body('note').optional().isString().isLength({ max: 1000 }).withMessage('Note must be less than 1000 characters'),
    body('date').optional().isISO8601(),
    body('location').optional().isString(),
    body('weather').optional().isString(),
    body('tags').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { mood, note, date, location, weather, tags } = req.body;
        const userId = req.userId;

        const entryDate = date ? new Date(date) : new Date();
        const dateOnly = entryDate.toISOString().split('T')[0];

        // Check if entry for this date already exists
        const existingEntry = await MoodEntry.findOne({
            where: { userId, date: dateOnly }
        });

        if (existingEntry) {
            // Update existing entry
            await existingEntry.update({
                mood,
                note: note || existingEntry.note,
                location: location || existingEntry.location,
                weather: weather || existingEntry.weather,
                tags: tags || existingEntry.tags,
                timestamp: new Date()
            });

            logger.info(`Mood entry updated for user ${userId} on date ${dateOnly}`);
            res.json({ message: 'Mood entry updated successfully', mood: existingEntry });
        } else {
            // Create new entry
            const moodEntry = await MoodEntry.create({
                userId,
                mood,
                note,
                date: dateOnly,
                location,
                weather,
                tags: tags || []
            });

            logger.info(`Mood entry created for user ${userId} on date ${dateOnly}`);
            res.status(201).json({ message: 'Mood entry created successfully', mood: moodEntry });
        }
    } catch (error) {
        logger.error('Create mood entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get mood statistics
router.get('/stats', async (req, res) => {
    try {
        const userId = req.userId;
        const { period = '30days' } = req.query;

        let startDate;
        const now = new Date();
        
        switch (period) {
            case '7days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90days':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const moodEntries = await MoodEntry.findAll({
            where: {
                userId,
                date: {
                    [Op.gte]: startDate.toISOString().split('T')[0]
                }
            },
            order: [['date', 'ASC']]
        });

        // Calculate statistics
        const totalEntries = moodEntries.length;
        const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalMood = 0;

        moodEntries.forEach(entry => {
            moodCounts[entry.mood]++;
            totalMood += entry.mood;
        });

        const averageMood = totalEntries > 0 ? (totalMood / totalEntries).toFixed(2) : 0;
        
        // Calculate trends
        const recentEntries = moodEntries.slice(-7); // Last 7 entries
        const olderEntries = moodEntries.slice(-14, -7); // Previous 7 entries
        
        const recentAverage = recentEntries.length > 0 
            ? recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length 
            : 0;
        const olderAverage = olderEntries.length > 0
            ? olderEntries.reduce((sum, entry) => sum + entry.mood, 0) / olderEntries.length
            : 0;
        
        const trend = recentAverage > olderAverage ? 'improving' : 
                     recentAverage < olderAverage ? 'declining' : 'stable';

        res.json({
            period,
            totalEntries,
            averageMood: parseFloat(averageMood),
            moodDistribution: moodCounts,
            trend,
            recentAverage: parseFloat(recentAverage.toFixed(2)),
            olderAverage: parseFloat(olderAverage.toFixed(2))
        });
    } catch (error) {
        logger.error('Get mood stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get mood insights
router.get('/insights', async (req, res) => {
    try {
        const userId = req.userId;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const moodEntries = await MoodEntry.findAll({
            where: {
                userId,
                date: {
                    [Op.gte]: startDate.toISOString().split('T')[0]
                }
            },
            order: [['date', 'DESC']]
        });

        if (moodEntries.length === 0) {
            return res.json({
                insights: [],
                recommendations: [
                    'Start tracking your daily mood to get personalized insights',
                    'Try to log your mood at the same time each day for consistency',
                    'Add notes to your mood entries to identify patterns'
                ]
            });
        }

        // Generate insights
        const insights = [];
        const recommendations = [];

        // Mood pattern analysis
        const lowMoodDays = moodEntries.filter(entry => entry.mood <= 2).length;
        const highMoodDays = moodEntries.filter(entry => entry.mood >= 4).length;
        const averageMood = moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length;

        if (lowMoodDays > moodEntries.length * 0.3) {
            insights.push({
                type: 'pattern',
                title: 'Low Mood Pattern Detected',
                description: `You've logged low mood (${lowMoodDays} out of ${moodEntries.length} days)`,
                severity: 'medium'
            });
            recommendations.push('Consider reaching out to a counselor for support');
        }

        if (highMoodDays >= moodEntries.length * 0.7) {
            insights.push({
                type: 'positive',
                title: 'Great Mood Consistency',
                description: `You've maintained positive mood ${highMoodDays} out of ${moodEntries.length} days`,
                severity: 'positive'
            });
            recommendations.push('Keep up the great work! Consider sharing your strategies with others');
        }

        // Streak analysis
        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;
        
        for (let i = 0; i < moodEntries.length; i++) {
            if (moodEntries[i].mood >= 3) {
                tempStreak++;
                if (i === 0) currentStreak = tempStreak;
            } else {
                maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 0;
            }
        }
        maxStreak = Math.max(maxStreak, tempStreak);

        if (currentStreak >= 7) {
            insights.push({
                type: 'streak',
                title: 'Mood Tracking Streak',
                description: `You've logged positive mood for ${currentStreak} consecutive days`,
                severity: 'positive'
            });
        }

        // Weekly pattern analysis
        const weeklyPattern = {};
        moodEntries.forEach(entry => {
            const dayOfWeek = new Date(entry.date).getDay();
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
            if (!weeklyPattern[dayName]) weeklyPattern[dayName] = [];
            weeklyPattern[dayName].push(entry.mood);
        });

        let bestDay = null;
        let bestAverage = 0;
        
        Object.keys(weeklyPattern).forEach(day => {
            const average = weeklyPattern[day].reduce((sum, mood) => sum + mood, 0) / weeklyPattern[day].length;
            if (average > bestAverage) {
                bestAverage = average;
                bestDay = day;
            }
        });

        if (bestDay && bestAverage >= 4) {
            insights.push({
                type: 'pattern',
                title: 'Best Day of the Week',
                description: `${bestDay}s tend to be your best days with an average mood of ${bestAverage.toFixed(1)}`,
                severity: 'positive'
            });
        }

        res.json({
            insights,
            recommendations: [
                ...recommendations,
                'Continue tracking your mood daily for more accurate insights',
                'Try mindfulness exercises when you notice mood patterns',
                'Consider talking to a counselor if you need additional support'
            ]
        });
    } catch (error) {
        logger.error('Get mood insights error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete mood entry
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const moodEntry = await MoodEntry.findOne({
            where: { id, userId }
        });

        if (!moodEntry) {
            return res.status(404).json({ error: 'Mood entry not found' });
        }

        await moodEntry.destroy();

        logger.info(`Mood entry deleted: ${id} for user ${userId}`);

        res.json({ message: 'Mood entry deleted successfully' });
    } catch (error) {
        logger.error('Delete mood entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;