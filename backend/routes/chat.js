const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { ChatSession, ChatMessage, User, Counselor } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const router = express.Router();

// Get user's chat sessions
router.get('/sessions', async (req, res) => {
    try {
        const userId = req.userId;
        const { status, limit = 20, offset = 0 } = req.query;

        const whereClause = { userId };
        if (status) {
            whereClause.status = status;
        }

        const sessions = await ChatSession.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Counselor,
                    as: 'counselor',
                    attributes: ['id', 'firstName', 'lastName', 'avatar', 'isOnline']
                }
            ],
            order: [['startedAt', 'DESC']],
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
        logger.error('Get chat sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new chat session
router.post('/sessions', [
    body('topic').optional().isString().isLength({ max: 100 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'emergency']),
    body('isAnonymous').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { topic, description, priority = 'medium', isAnonymous = false } = req.body;
        const userId = req.userId;

        // Check for existing active session
        const existingSession = await ChatSession.findOne({
            where: {
                userId,
                status: ['waiting', 'active']
            }
        });

        if (existingSession) {
            return res.status(400).json({ 
                error: 'You already have an active chat session',
                sessionId: existingSession.id 
            });
        }

        // Find available counselor
        let counselorId = null;
        const availableCounselor = await Counselor.findOne({
            where: {
                isOnline: true,
                status: 'available',
                isActive: true
            },
            order: [['totalSessions', 'ASC']] // Assign to counselor with fewest sessions
        });

        if (availableCounselor) {
            counselorId = availableCounselor.id;
            // Update counselor status
            await availableCounselor.update({ status: 'busy' });
        }

        const session = await ChatSession.create({
            userId,
            counselorId,
            topic,
            description,
            priority,
            isAnonymous,
            status: counselorId ? 'active' : 'waiting'
        });

        // Create welcome message if counselor is assigned
        if (counselorId) {
            await ChatMessage.create({
                sessionId: session.id,
                senderId: counselorId,
                senderType: 'counselor',
                message: `Hello! I'm here to help you today. How are you feeling?`,
                messageType: 'text'
            });
        }

        logger.info(`Chat session created: ${session.id} for user ${userId}`);

        res.status(201).json({
            message: 'Chat session created successfully',
            session: session,
            counselorAssigned: !!counselorId
        });
    } catch (error) {
        logger.error('Create chat session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get chat messages
router.get('/sessions/:id/messages', [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('before').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const userId = req.userId;
        const { limit = 50, before } = req.query;

        // Verify user owns this session
        const session = await ChatSession.findOne({
            where: { id, userId }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const whereClause = { sessionId: id };
        if (before) {
            whereClause.sentAt = { [Op.lt]: before };
        }

        const messages = await ChatMessage.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'firstName', 'lastName', 'avatar'],
                    required: false
                },
                {
                    model: Counselor,
                    as: 'counselor',
                    attributes: ['id', 'firstName', 'lastName', 'avatar'],
                    required: false
                }
            ],
            order: [['sentAt', 'DESC']],
            limit: parseInt(limit)
        });

        // Mark messages as read
        await ChatMessage.update(
            { isRead: true },
            { 
                where: { 
                    sessionId: id, 
                    senderId: { [Op.ne]: userId },
                    isRead: false
                } 
            }
        );

        res.json({
            messages: messages.reverse(), // Reverse to get chronological order
            session: {
                id: session.id,
                status: session.status,
                counselorId: session.counselorId
            }
        });
    } catch (error) {
        logger.error('Get chat messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send chat message
router.post('/sessions/:id/messages', [
    body('message').isString().isLength({ min: 1, max: 2000 }),
    body('messageType').optional().isIn(['text', 'image', 'file']),
    body('attachmentUrl').optional().isURL()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const userId = req.userId;
        const { message, messageType = 'text', attachmentUrl } = req.body;

        // Verify user owns this session
        const session = await ChatSession.findOne({
            where: { id, userId }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Cannot send messages in inactive session' });
        }

        const chatMessage = await ChatMessage.create({
            sessionId: id,
            senderId: userId,
            senderType: 'user',
            message,
            messageType,
            attachmentUrl
        });

        // Update session last activity
        await session.update({ lastActivityAt: new Date() });

        // Emit real-time message if user is online
        const io = req.app.get('io');
        io.to(`chat:${id}`).emit('chat:message', {
            senderId: userId,
            message,
            messageType,
            timestamp: chatMessage.sentAt
        });

        res.status(201).json({
            message: 'Message sent successfully',
            chatMessage
        });
    } catch (error) {
        logger.error('Send chat message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rate chat session
router.put('/sessions/:id/rate', [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').optional().isString().isLength({ max: 1000 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const userId = req.userId;
        const { rating, feedback } = req.body;

        const session = await ChatSession.findOne({
            where: { id, userId }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status !== 'closed') {
            return res.status(400).json({ error: 'Can only rate closed sessions' });
        }

        await session.update({ rating, feedback });

        // Update counselor rating
        if (session.counselorId) {
            const counselor = await Counselor.findByPk(session.counselorId);
            if (counselor) {
                const allRatings = await ChatSession.findAll({
                    where: { 
                        counselorId: session.counselorId, 
                        rating: { [Op.not]: null } 
                    },
                    attributes: ['rating']
                });

                const averageRating = allRatings.reduce((sum, session) => sum + session.rating, 0) / allRatings.length;
                await counselor.update({ rating: averageRating });
            }
        }

        logger.info(`Session ${id} rated by user ${userId}: ${rating}/5`);

        res.json({ message: 'Session rated successfully' });
    } catch (error) {
        logger.error('Rate chat session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// End chat session
router.put('/sessions/:id/end', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const session = await ChatSession.findOne({
            where: { id, userId }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status === 'closed') {
            return res.status(400).json({ error: 'Session already closed' });
        }

        const endedAt = new Date();
        const duration = Math.round((endedAt - session.startedAt) / 60000); // Duration in minutes

        await session.update({
            status: 'closed',
            endedAt,
            duration
        });

        // Free up counselor
        if (session.counselorId) {
            await Counselor.update(
                { status: 'available' },
                { where: { id: session.counselorId } }
            );
        }

        logger.info(`Chat session ended: ${id} by user ${userId}`);

        res.json({ message: 'Session ended successfully' });
    } catch (error) {
        logger.error('End chat session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available counselors
router.get('/counselors/available', async (req, res) => {
    try {
        const availableCounselors = await Counselor.findAll({
            where: {
                isOnline: true,
                status: 'available',
                isActive: true
            },
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'bio', 'specializations', 'rating', 'totalSessions']
        });

        res.json(availableCounselors);
    } catch (error) {
        logger.error('Get available counselors error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;