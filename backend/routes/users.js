const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        logger.error('Get user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isString(),
    body('timezone').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.userId;
        const { firstName, lastName, dateOfBirth, gender, timezone } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            dateOfBirth: dateOfBirth || user.dateOfBirth,
            gender: gender || user.gender,
            timezone: timezone || user.timezone
        });

        logger.info(`User profile updated: ${userId}`);

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        logger.error('Update user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;