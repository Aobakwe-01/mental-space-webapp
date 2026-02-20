const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
let transporter;

if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
    // Use SendGrid in production
    transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
        }
    });
} else if (process.env.SMTP_HOST) {
    // Use custom SMTP configuration
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    // Use test account in development
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: process.env.ETHEREAL_USER || 'test@example.com',
            pass: process.env.ETHEREAL_PASS || 'testpassword'
        }
    });
}

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        logger.error('Email transporter configuration error:', error);
    } else {
        logger.info('Email transporter is ready to take messages');
    }
});

// Send email function
const sendEmail = async ({ to, subject, text, html, template, data }) => {
    try {
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'MentalSpace <noreply@mentalspace.app>',
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject || 'Message from MentalSpace'
        };

        // Add text or HTML content
        if (html) {
            mailOptions.html = html;
        } else if (text) {
            mailOptions.text = text;
        } else if (template && data) {
            // Generate HTML based on template
            mailOptions.html = generateEmailTemplate(template, data);
        } else {
            mailOptions.text = 'Hello from MentalSpace!';
        }

        const info = await transporter.sendMail(mailOptions);
        
        logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        
        // Preview URL in development
        if (process.env.NODE_ENV === 'development' && info.preview) {
            logger.info(`Email preview URL: ${info.preview}`);
        }

        return info;
    } catch (error) {
        logger.error('Error sending email:', error);
        throw error;
    }
};

// Generate email templates
const generateEmailTemplate = (template, data) => {
    const baseTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MentalSpace</title>
            <style>
                body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #f8f8ff; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #8FBC8F, #E6E6FA); padding: 30px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .content { padding: 30px; }
                .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8FBC8F, #E6E6FA); color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>MentalSpace</h1>
                </div>
                <div class="content">
                    {{CONTENT}}
                </div>
                <div class="footer">
                    <p>This email was sent from MentalSpace. If you didn't request this, please ignore it.</p>
                    <p>&copy; 2024 MentalSpace. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    let content = '';

    switch (template) {
        case 'email-verification':
            content = `
                <h2>Welcome to MentalSpace, ${data.firstName}!</h2>
                <p>Thank you for joining our community dedicated to mental wellness.</p>
                <p>Please verify your email address by clicking the button below:</p>
                <a href="${process.env.FRONTEND_URL}/verify-email/${data.verificationToken}" class="button">Verify Email Address</a>
                <p>If the button doesn't work, you can copy and paste this link:</p>
                <p>${process.env.FRONTEND_URL}/verify-email/${data.verificationToken}</p>
                <p>This link will expire in 24 hours.</p>
            `;
            break;

        case 'password-reset':
            content = `
                <h2>Password Reset Request</h2>
                <p>Hello ${data.firstName},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="${process.env.FRONTEND_URL}/reset-password/${data.resetToken}" class="button">Reset Password</a>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                <p>This link will expire in 1 hour.</p>
            `;
            break;

        case 'welcome':
            content = `
                <h2>Welcome to MentalSpace, ${data.firstName}!</h2>
                <p>We're excited to have you join our community focused on mental wellness and personal growth.</p>
                <p>Here are some things you can do to get started:</p>
                <ul>
                    <li>Complete your daily mood check-in</li>
                    <li>Explore our self-help programs</li>
                    <li>Try a guided breathing exercise</li>
                    <li>Connect with a counselor if needed</li>
                </ul>
                <p>Remember, taking care of your mental health is just as important as your physical health.</p>
                <p>We're here to support you on your journey!</p>
            `;
            break;

        default:
            content = `
                <h2>Hello from MentalSpace!</h2>
                <p>This is a default email template.</p>
            `;
    }

    return baseTemplate.replace('{{CONTENT}}', content);
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
    return sendEmail({
        to: user.email,
        subject: 'Welcome to MentalSpace!',
        template: 'welcome',
        data: {
            firstName: user.firstName
        }
    });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
    return sendEmail({
        to: user.email,
        subject: 'Reset Your MentalSpace Password',
        template: 'password-reset',
        data: {
            firstName: user.firstName,
            resetToken
        }
    });
};

// Send verification email
const sendVerificationEmail = async (user, verificationToken) => {
    return sendEmail({
        to: user.email,
        subject: 'Verify Your MentalSpace Email',
        template: 'email-verification',
        data: {
            firstName: user.firstName,
            verificationToken
        }
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendVerificationEmail
};