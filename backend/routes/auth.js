const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Counselor } = require('../models');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, type = 'user') => {
    return jwt.sign(
        { userId, type },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// User Registration
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, dateOfBirth, gender } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            emailVerificationToken: crypto.randomBytes(32).toString('hex')
        });

        // Generate JWT token
        const token = generateToken(user.id);

        // Send verification email (in development, just log it)
        if (process.env.NODE_ENV === 'production') {
            await sendEmail({
                to: user.email,
                subject: 'Welcome to MentalSpace - Verify Your Email',
                template: 'email-verification',
                data: {
                    firstName: user.firstName,
                    verificationToken: user.emailVerificationToken
                }
            });
        } else {
            logger.info(`Email verification token for ${user.email}: ${user.emailVerificationToken}`);
        }

        logger.info(`New user registered: ${user.email}`);

        res.status(201).json({
            message: 'User registered successfully. Please check your email to verify your account.',
            user: user,
            token: token
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Update last login
        await user.update({ lastLoginAt: new Date() });

        // Generate JWT token
        const token = generateToken(user.id);

        logger.info(`User logged in: ${user.email}`);

        res.json({
            message: 'Login successful',
            user: user,
            token: token
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Email Verification
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ 
            where: { emailVerificationToken: token } 
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        await user.update({ 
            isEmailVerified: true, 
            emailVerificationToken: null 
        });

        logger.info(`Email verified for user: ${user.email}`);

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Forgot Password
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Don't reveal if email exists or not
            return res.json({ message: 'If the email exists, a password reset link has been sent' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await user.update({
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires
        });

        // Send reset email
        if (process.env.NODE_ENV === 'production') {
            await sendEmail({
                to: user.email,
                subject: 'MentalSpace - Password Reset Request',
                template: 'password-reset',
                data: {
                    firstName: user.firstName,
                    resetToken: resetToken
                }
            });
        } else {
            logger.info(`Password reset token for ${user.email}: ${resetToken}`);
        }

        res.json({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset Password
router.post('/reset-password', [
    body('token').exists().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token, newPassword } = req.body;

        const user = await User.findOne({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    [require('sequelize').Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        await user.update({
            password: newPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        });

        logger.info(`Password reset successful for user: ${user.email}`);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists and is active
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Generate new token
        const newToken = generateToken(user.id);

        res.json({ token: newToken });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        logger.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        // In a more complex setup, you might want to blacklist tokens
        // For now, we'll just return a success message
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;