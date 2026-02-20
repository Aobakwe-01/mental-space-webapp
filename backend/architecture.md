# MentalSpace Backend Architecture

## Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io for chat functionality
- **File Storage**: AWS S3 for user uploads
- **Email Service**: SendGrid for notifications
- **Deployment**: Heroku/Render

## Database Schema

### Users Table
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- firstName (String)
- lastName (String)
- dateOfBirth (Date)
- gender (String)
- avatar (String, URL)
- isPremium (Boolean, default: false)
- isAnonymous (Boolean, default: false)
- timezone (String)
- language (String, default: 'en')
- theme (String, default: 'light')
- fontSize (String, default: 'medium')
- createdAt (Date)
- updatedAt (Date)
```

### MoodEntries Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- mood (Integer, 1-5 scale)
- note (Text, optional)
- date (Date)
- timestamp (DateTime)
- location (String, optional)
- weather (String, optional)
```

### Programs Table
```sql
- id (UUID, Primary Key)
- title (String)
- description (Text)
- category (String)
- duration (Integer, in days)
- difficulty (String)
- isActive (Boolean, default: true)
- createdAt (Date)
- updatedAt (Date)
```

### ProgramModules Table
```sql
- id (UUID, Primary Key)
- programId (UUID, Foreign Key)
- title (String)
- description (Text)
- content (Text, JSON)
- duration (Integer, in minutes)
- orderIndex (Integer)
- type (String: 'video', 'audio', 'text', 'interactive')
- isRequired (Boolean, default: true)
```

### UserPrograms Table (Progress Tracking)
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- programId (UUID, Foreign Key)
- status (String: 'not_started', 'in_progress', 'completed')
- progress (Float, 0-100)
- startedAt (DateTime)
- completedAt (DateTime)
- lastAccessedAt (DateTime)
```

### ModuleCompletions Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- moduleId (UUID, Foreign Key)
- completedAt (DateTime)
- timeSpent (Integer, in seconds)
- score (Float, optional)
```

### ChatSessions Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- counselorId (UUID, Foreign Key, nullable)
- status (String: 'waiting', 'active', 'closed')
- priority (String: 'low', 'medium', 'high', 'emergency')
- topic (String)
- startedAt (DateTime)
- endedAt (DateTime)
- rating (Integer, 1-5, optional)
- feedback (Text, optional)
```

### ChatMessages Table
```sql
- id (UUID, Primary Key)
- sessionId (UUID, Foreign Key)
- senderId (UUID, Foreign Key)
- senderType (String: 'user', 'counselor')
- message (Text)
- messageType (String: 'text', 'image', 'file', 'resource')
- attachmentUrl (String, optional)
- isRead (Boolean, default: false)
- sentAt (DateTime)
```

### Counselors Table
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- firstName (String)
- lastName (String)
- licenseNumber (String)
- specializations (Array of Strings)
- bio (Text)
- avatar (String, URL)
- isOnline (Boolean, default: false)
- status (String: 'available', 'busy', 'offline')
- rating (Float, 0-5)
- totalSessions (Integer, default: 0)
- createdAt (Date)
- updatedAt (Date)
```

### BreathingSessions Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- duration (Integer, in seconds)
- completedAt (DateTime)
- technique (String)
```

### Achievements Table
```sql
- id (UUID, Primary Key)
- name (String)
- description (Text)
- icon (String)
- category (String)
- requirement (JSON)
- points (Integer)
```

### UserAchievements Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- achievementId (UUID, Foreign Key)
- earnedAt (DateTime)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete account
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update user preferences

### Mood Tracking
- `GET /api/moods` - Get mood history
- `POST /api/moods` - Create mood entry
- `GET /api/moods/stats` - Get mood statistics
- `GET /api/moods/insights` - Get mood insights

### Programs
- `GET /api/programs` - Get all programs
- `GET /api/programs/:id` - Get program details
- `POST /api/programs/:id/enroll` - Enroll in program
- `GET /api/programs/user/progress` - Get user progress
- `POST /api/programs/modules/:id/complete` - Complete module

### Chat
- `GET /api/chat/sessions` - Get chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions/:id/messages` - Get messages
- `POST /api/chat/sessions/:id/messages` - Send message
- `PUT /api/chat/sessions/:id/rate` - Rate session

### Breathing Exercises
- `GET /api/breathing/sessions` - Get breathing sessions
- `POST /api/breathing/sessions` - Create breathing session
- `GET /api/breathing/techniques` - Get breathing techniques

### Achievements
- `GET /api/achievements` - Get all achievements
- `GET /api/achievements/user` - Get user achievements
- `GET /api/achievements/progress` - Get achievement progress

## Real-time Events (Socket.io)

### Chat Events
- `chat:join` - Join chat session
- `chat:leave` - Leave chat session
- `chat:message` - Send/receive messages
- `chat:typing` - Typing indicators
- `chat:online` - Online status updates

### Notification Events
- `notification:new` - New notifications
- `notification:read` - Mark as read
- `notification:update` - Update preferences

## Security Features
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- HTTPS enforcement
- Data encryption for sensitive information

## Performance Optimizations
- Database indexing on frequently queried fields
- Redis caching for session management
- CDN for static assets
- Image compression and optimization
- Lazy loading for large datasets
- Pagination for list endpoints

## Monitoring & Analytics
- Error logging with Winston
- Performance monitoring
- User activity tracking
- Mood pattern analysis
- Engagement metrics
- System health checks