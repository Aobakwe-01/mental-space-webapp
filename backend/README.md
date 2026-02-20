# MentalSpace Backend API

A comprehensive Node.js/Express backend for the MentalSpace mental health application.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - User registration and login
  - Email verification
  - Password reset functionality
  - Role-based access control (users, counselors, admins)

- 🧠 **Mental Health Tracking**
  - Daily mood tracking with notes
  - Mood analytics and insights
  - Weekly/monthly mood patterns
  - Progress visualization

- 📚 **Self-Help Programs**
  - Structured learning modules
  - Progress tracking
  - Achievement system
  - Personalized recommendations

- 💬 **Real-time Chat Support**
  - Anonymous counseling sessions
  - Real-time messaging with Socket.io
  - Counselor assignment system
  - Session rating and feedback

- 🧘 **Mindfulness Tools**
  - Guided breathing exercises
  - Session tracking
  - Multiple breathing techniques
  - Progress analytics

- 🏆 **Gamification**
  - Achievement system
  - Progress badges
  - Streak tracking
  - Motivational rewards

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Email**: Nodemailer with SendGrid
- **Logging**: Winston
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## Project Structure

```
backend/
├── config/                 # Configuration files
│   └── database.js        # Database configuration
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   └── errorHandler.js    # Error handling middleware
├── models/                 # Sequelize models
│   ├── User.js
│   ├── MoodEntry.js
│   ├── Program.js
│   ├── ChatSession.js
│   └── ...
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── moods.js           # Mood tracking routes
│   ├── programs.js        # Program routes
│   ├── chat.js            # Chat routes
│   └── ...
├── utils/                  # Utility functions
│   ├── logger.js          # Winston logger
│   └── email.js           # Email utilities
├── server.js              # Main server file
├── package.json
└── .env.example           # Environment variables template
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mentalspace/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb mentalspace_dev
   
   # Run migrations
   npm run migrate
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mentalspace_dev
DB_USERNAME=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@mentalspace.app

# Optional: SMTP Configuration (alternative to SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update user preferences

### Mood Tracking
- `GET /api/moods` - Get mood history
- `POST /api/moods` - Create mood entry
- `GET /api/moods/stats` - Get mood statistics
- `GET /api/moods/insights` - Get mood insights
- `DELETE /api/moods/:id` - Delete mood entry

### Programs
- `GET /api/programs` - Get all programs
- `GET /api/programs/:id` - Get program details
- `POST /api/programs/:id/enroll` - Enroll in program
- `GET /api/programs/user/progress` - Get user progress
- `POST /api/programs/modules/:id/complete` - Complete module
- `GET /api/programs/recommendations` - Get program recommendations

### Chat Support
- `GET /api/chat/sessions` - Get chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions/:id/messages` - Get messages
- `POST /api/chat/sessions/:id/messages` - Send message
- `PUT /api/chat/sessions/:id/rate` - Rate session
- `PUT /api/chat/sessions/:id/end` - End session
- `GET /api/chat/counselors/available` - Get available counselors

### Breathing Exercises
- `GET /api/breathing` - Get breathing sessions
- `POST /api/breathing` - Create breathing session
- `GET /api/breathing/stats` - Get breathing statistics

### Achievements
- `GET /api/achievements` - Get all achievements
- `GET /api/achievements/user` - Get user achievements
- `GET /api/achievements/progress` - Get achievement progress

## Real-time Events (Socket.io)

The backend supports real-time events for chat functionality:

### Client-side Events
- `chat:join` - Join chat session room
- `chat:leave` - Leave chat session room
- `chat:message` - Send message
- `chat:typing` - Typing indicator

### Server-side Events
- `chat:message` - New message received
- `chat:typing` - User typing status
- `user:joined` - User joined session
- `user:left` - User left session
- `counselor:online` - Counselor came online
- `counselor:offline` - Counselor went offline

## Database Schema

The backend uses PostgreSQL with the following main tables:

- **Users** - User accounts and profiles
- **MoodEntries** - Daily mood tracking data
- **Programs** - Self-help programs
- **ProgramModules** - Individual program modules
- **UserPrograms** - User program enrollment and progress
- **ChatSessions** - Chat session records
- **ChatMessages** - Chat messages
- **Counselors** - Counselor accounts
- **BreathingSessions** - Breathing exercise sessions
- **Achievements** - Available achievements
- **UserAchievements** - User earned achievements

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- Error handling without sensitive data exposure

## Development

### Running in Development Mode
```bash
npm run dev
```

This starts the server with nodemon for automatic reloading on file changes.

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
# Run pending migrations
npm run migrate

# Undo last migration
npm run migrate:undo
```

### Seeding the Database
```bash
npm run seed
```

## Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   PORT=3001
   ```

2. **Database Migration**
   ```bash
   npm run migrate
   ```

3. **Start Server**
   ```bash
   npm start
   ```

## Monitoring

The application includes comprehensive logging using Winston:

- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console output**: In development mode

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@mentalspace.app or join our Slack channel.