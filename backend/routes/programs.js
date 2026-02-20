const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Program, ProgramModule, UserProgram, ModuleCompletion, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const router = express.Router();

// Get all programs
router.get('/', async (req, res) => {
    try {
        const programs = await Program.findAll({
            where: { isActive: true },
            include: [{
                model: ProgramModule,
                as: 'modules',
                attributes: ['id', 'title', 'duration', 'orderIndex', 'type']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json(programs);
    } catch (error) {
        logger.error('Get programs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get program details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const program = await Program.findOne({
            where: { id, isActive: true },
            include: [{
                model: ProgramModule,
                as: 'modules',
                order: [['orderIndex', 'ASC']]
            }]
        });

        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        // Get user's progress for this program
        const userProgram = await UserProgram.findOne({
            where: { userId, programId: id }
        });

        // Get completed modules for this user
        const completedModules = await ModuleCompletion.findAll({
            where: { userId },
            attributes: ['moduleId']
        });

        const completedModuleIds = completedModules.map(cm => cm.moduleId);

        res.json({
            ...program.toJSON(),
            userProgress: userProgram,
            completedModules: completedModuleIds
        });
    } catch (error) {
        logger.error('Get program details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enroll in program
router.post('/:id/enroll', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const program = await Program.findByPk(id);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        // Check if already enrolled
        const existingEnrollment = await UserProgram.findOne({
            where: { userId, programId: id }
        });

        if (existingEnrollment) {
            return res.status(400).json({ error: 'Already enrolled in this program' });
        }

        const userProgram = await UserProgram.create({
            userId,
            programId: id,
            status: 'not_started',
            progress: 0
        });

        logger.info(`User ${userId} enrolled in program ${id}`);

        res.status(201).json({
            message: 'Successfully enrolled in program',
            enrollment: userProgram
        });
    } catch (error) {
        logger.error('Enroll in program error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's program progress
router.get('/user/progress', async (req, res) => {
    try {
        const userId = req.userId;

        const userPrograms = await UserProgram.findAll({
            where: { userId },
            include: [
                {
                    model: Program,
                    as: 'program',
                    attributes: ['id', 'title', 'category', 'duration', 'difficulty', 'icon', 'color']
                }
            ],
            order: [['lastAccessedAt', 'DESC']]
        });

        // Calculate additional statistics
        const totalPrograms = userPrograms.length;
        const completedPrograms = userPrograms.filter(up => up.status === 'completed').length;
        const inProgressPrograms = userPrograms.filter(up => up.status === 'in_progress').length;

        res.json({
            programs: userPrograms,
            statistics: {
                total: totalPrograms,
                completed: completedPrograms,
                inProgress: inProgressPrograms,
                completionRate: totalPrograms > 0 ? Math.round((completedPrograms / totalPrograms) * 100) : 0
            }
        });
    } catch (error) {
        logger.error('Get user program progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Complete module
router.post('/modules/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { timeSpent = 0, score } = req.body;

        const module = await ProgramModule.findByPk(id);
        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Check if already completed
        const existingCompletion = await ModuleCompletion.findOne({
            where: { userId, moduleId: id }
        });

        if (existingCompletion) {
            return res.status(400).json({ error: 'Module already completed' });
        }

        // Create completion record
        const completion = await ModuleCompletion.create({
            userId,
            moduleId: id,
            timeSpent,
            score,
            completedAt: new Date()
        });

        // Update user program progress
        const userProgram = await UserProgram.findOne({
            where: { 
                userId, 
                programId: module.programId 
            }
        });

        if (userProgram) {
            // Calculate new progress
            const totalModules = await ProgramModule.count({
                where: { programId: module.programId }
            });

            const completedModules = await ModuleCompletion.count({
                where: { 
                    userId,
                    moduleId: {
                        [Op.in]: sequelize.literal(`(
                            SELECT id FROM "ProgramModules" 
                            WHERE "programId" = '${module.programId}'
                        )`)
                    }
                }
            });

            const newProgress = Math.round((completedModules / totalModules) * 100);
            const newStatus = newProgress === 100 ? 'completed' : 'in_progress';

            await userProgram.update({
                progress: newProgress,
                status: newStatus,
                lastAccessedAt: new Date(),
                completedAt: newProgress === 100 ? new Date() : userProgram.completedAt
            });
        }

        logger.info(`Module ${id} completed by user ${userId}`);

        res.status(201).json({
            message: 'Module completed successfully',
            completion
        });
    } catch (error) {
        logger.error('Complete module error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get program recommendations
router.get('/recommendations', async (req, res) => {
    try {
        const userId = req.userId;

        // Get user's current programs and mood history
        const userPrograms = await UserProgram.findAll({
            where: { userId },
            include: [{
                model: Program,
                as: 'program',
                attributes: ['id', 'category']
            }]
        });

        const moodEntries = await MoodEntry.findAll({
            where: { userId },
            order: [['date', 'DESC']],
            limit: 30
        });

        const completedCategories = userPrograms
            .filter(up => up.status === 'completed')
            .map(up => up.program.category);

        const averageMood = moodEntries.length > 0 
            ? moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length
            : 3;

        // Find recommended programs
        let recommendations = await Program.findAll({
            where: { 
                isActive: true,
                id: {
                    [Op.notIn]: userPrograms.map(up => up.programId)
                }
            },
            include: [{
                model: ProgramModule,
                as: 'modules',
                attributes: ['id']
            }]
        });

        // Score recommendations based on various factors
        recommendations = recommendations.map(program => {
            let score = 0;

            // Boost programs in categories user hasn't completed
            if (!completedCategories.includes(program.category)) {
                score += 10;
            }

            // Recommend based on mood patterns
            if (averageMood < 2.5 && ['stress', 'anxiety', 'depression'].includes(program.category)) {
                score += 15;
            }

            if (averageMood > 3.5 && ['mindfulness', 'productivity', 'relationships'].includes(program.category)) {
                score += 10;
            }

            // Prefer shorter programs for new users
            if (userPrograms.length === 0 && program.duration <= 7) {
                score += 5;
            }

            return {
                ...program.toJSON(),
                recommendationScore: score
            };
        });

        // Sort by recommendation score
        recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

        // Return top 6 recommendations
        res.json(recommendations.slice(0, 6));
    } catch (error) {
        logger.error('Get program recommendations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;