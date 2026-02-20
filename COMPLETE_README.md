# MentalSpace - Complete Mental Health Application

A comprehensive mental health platform combining a user-friendly frontend with a robust backend infrastructure. Built with modern web technologies and designed with therapeutic principles in mind.

## 🌟 Features

### User Application
- **🧠 Mood Tracking**: Daily emotional check-ins with visual analytics
- **💬 Real-time Chat**: Anonymous counseling with licensed professionals
- **📚 Self-Help Programs**: Structured learning modules with progress tracking
- **🧘 Breathing Exercises**: Guided mindfulness sessions with visual cues
- **🏆 Achievement System**: Gamified progress tracking and motivation
- **📊 Analytics Dashboard**: Personal insights and mood patterns
- **🔒 Privacy-First**: Anonymous mode and secure data handling

### Counselor Dashboard
- **📈 Real-time Analytics**: Session metrics and performance tracking
- **💬 Multi-Chat Management**: Handle multiple client sessions simultaneously
- **🎯 Priority Management**: Emergency and high-priority client handling
- **📊 Professional Insights**: Detailed analytics for counselors
- **🔧 Status Management**: Available/Busy/Offline status controls

### Backend Infrastructure
- **🔐 Secure Authentication**: JWT-based auth with role-based access
- **📡 Real-time Communication**: Socket.io for live chat functionality
- **🗄️ Robust Database**: PostgreSQL with Sequelize ORM
- **📧 Email Integration**: SendGrid for notifications and verification
- **🚀 Scalable Architecture**: Microservices-ready design
- **📊 Comprehensive Logging**: Winston logging with error tracking

## 🛠️ Technology Stack

### Frontend
- **Framework**: Vanilla HTML/CSS/JavaScript (mobile-first)
- **Styling**: Tailwind CSS with custom therapeutic color palette
- **Animations**: Anime.js for smooth micro-interactions
- **Charts**: ECharts.js for mood visualization
- **Real-time**: Socket.io client for live chat
- **Icons**: Heroicons and custom SVG icons

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io for WebSocket connections
- **Email**: Nodemailer with SendGrid integration
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston with structured logging

### DevOps
- **Process Manager**: PM2 for production deployment
- **Monitoring**: Built-in health checks and metrics
- **Deployment**: Docker-ready with docker-compose
- **CI/CD**: GitHub Actions ready

## 📁 Project Structure

```
mentalspace/
├── index.html              # Main dashboard with mood tracking
├── chat.html               # Real-time chat interface
├── programs.html           # Self-help programs
├── settings.html           # User preferences and profile
├── admin.html              # Counselor dashboard
├── main.js                 # Core frontend functionality
├── js/
│   └── api.js              # API client for backend communication
├── backend/                # Complete Node.js backend
│   ├── server.js           # Main Express server
│   ├── models/             # Sequelize database models
│   ├── routes/             # API route handlers
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
├── resources/              # Images and assets
│   ├── hero-meditation.png
│   ├── community-support.png
│   └── app-icons.png
├── design.md               # Design philosophy and guidelines
├── interaction.md          # Interaction design specifications
├── architecture.md         # Backend architecture documentation
├── deploy.sh               # Production deployment script
├── serve.js                # Frontend development server
└── package.json            # Frontend dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mentalspace
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database configuration
   ```

4. **Start the backend**
   ```bash
   npm run dev
   # or
   npm start
   ```

5. **Start the frontend (in a new terminal)**
   ```bash
   cd ..
   npm start
   ```

6. **Access the application**
   - **User App**: http://localhost:3000
   - **Admin Dashboard**: http://localhost:3000/admin.html
   - **API**: http://localhost:3001

### Default Credentials

For development, the backend creates a default counselor account:
- **Email**: `counselor@mentalspace.app`
- **Password**: `counselor123`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

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
```

### Database Setup

1. **Create PostgreSQL database**
   ```bash
   createdb mentalspace_dev
   ```

2. **Run migrations**
   ```bash
   cd backend
   npx sequelize-cli db:migrate
   ```

3. **Seed data (optional)**
   ```bash
   npx sequelize-cli db:seed:all
   ```

## 📱 User Guide

### For Users

1. **Registration & Login**
   - Create an account with email and password
   - Verify email address
   - Login to access features

2. **Daily Mood Check-in**
   - Select your mood using emoji scale (1-5)
   - Add optional notes about your feelings
   - View weekly mood patterns in the chart

3. **Breathing Exercises**
   - Choose from 1, 3, or 5-minute sessions
   - Follow the animated breathing guide
   - Track your progress over time

4. **Chat Support**
   - Create anonymous or identified sessions
   - Get matched with available counselors
   - Real-time messaging with typing indicators

5. **Self-Help Programs**
   - Browse available programs by category
   - Enroll in programs that interest you
   - Complete modules at your own pace
   - Earn achievements and badges

### For Counselors

1. **Dashboard Access**
   - Login with counselor credentials
   - View real-time session analytics
   - Manage availability status

2. **Session Management**
   - Accept incoming client sessions
   - Handle multiple chats simultaneously
   - Prioritize emergency cases

3. **Client Interaction**
   - Real-time messaging with users
   - View client mood history (if permitted)
   - Provide professional support

4. **Analytics & Reporting**
   - Track session metrics
   - View client satisfaction ratings
   - Monitor performance statistics

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permissions for users and counselors
- **Data Encryption**: Sensitive data protection
- **Rate Limiting**: API abuse prevention
- **Input Validation**: XSS and injection attack prevention
- **CORS Configuration**: Cross-origin request security
- **HTTPS Ready**: Production-ready security

## 📊 Analytics & Insights

### User Analytics
- **Mood Patterns**: Weekly/monthly mood trends
- **Progress Tracking**: Program completion rates
- **Session History**: Chat and breathing exercise logs
- **Achievement Progress**: Gamification metrics

### Counselor Analytics
- **Session Volume**: Daily/weekly session counts
- **Performance Metrics**: Average session ratings
- **Response Times**: Chat engagement statistics
- **Client Outcomes**: Success rate tracking

## 🎯 Design Principles

### Therapeutic Design
- **Calming Colors**: Sage green, soft lavender, warm cream
- **Gentle Animations**: Smooth, non-jarring transitions
- **Accessible Interface**: WCAG 2.1 AA compliance
- **Mobile-First**: Optimized for smartphone use
- **Non-Clinical Aesthetic**: Welcoming and supportive design

### User Experience
- **Intuitive Navigation**: Clear information architecture
- **Minimal Cognitive Load**: Simple, focused interactions
- **Privacy-First**: Anonymous options and data protection
- **Personalization**: Customizable preferences and settings
- **Progressive Enhancement**: Works without JavaScript

## 🚀 Deployment

### Development
```bash
# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
npm start
```

### Production
```bash
# Run deployment script
./deploy.sh

# Or manually with PM2
npm install -g pm2
cd backend && pm2 start server.js
cd .. && pm2 start serve.js
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔍 Monitoring & Maintenance

### Health Checks
- **API Health**: GET `/api/health`
- **Frontend Health**: GET `/health`
- **Database Connection**: Automatic retry with exponential backoff

### Logging
- **Application Logs**: Winston with structured logging
- **Access Logs**: HTTP request tracking
- **Error Logs**: Comprehensive error reporting
- **Performance Metrics**: Response time monitoring

### Maintenance Tasks
- **Database Backups**: Regular automated backups
- **Dependency Updates**: Monthly security updates
- **Performance Optimization**: Query optimization and caching
- **Security Audits**: Regular penetration testing

## 🌟 Future Enhancements

### Planned Features
- **AI-Powered Insights**: Machine learning mood predictions
- **Video Therapy**: Secure video counseling sessions
- **Community Features**: Peer support groups and forums
- **Wearable Integration**: Apple Health and Google Fit sync
- **Multi-language Support**: Internationalization
- **Crisis Detection**: Automated emergency response

### Technical Improvements
- **Microservices Architecture**: Service decomposition
- **GraphQL API**: More efficient data fetching
- **Kubernetes Deployment**: Container orchestration
- **CDN Integration**: Global content delivery
- **Advanced Analytics**: Predictive modeling
- **Blockchain Integration**: Decentralized data storage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- **User Guide**: [docs/user-guide.md](docs/user-guide.md)
- **API Documentation**: [docs/api.md](docs/api.md)
- **Deployment Guide**: [docs/deployment.md](docs/deployment.md)

### Community
- **Discord**: [Join our community](https://discord.gg/mentalspace)
- **Issues**: [GitHub Issues](https://github.com/mentalspace/app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mentalspace/app/discussions)

### Professional Support
- **Email**: support@mentalspace.app
- **Business Inquiries**: business@mentalspace.app
- **Security Issues**: security@mentalspace.app

## 🙏 Acknowledgments

- **Design Inspiration**: Calm, Headspace, and other wellness apps
- **Technical Inspiration**: Modern web development best practices
- **Mental Health Professionals**: Licensed counselors who provided insights
- **Open Source Community**: Contributors and maintainers

---

**MentalSpace** - Digital care for a healthier mind ❤️

*Built with empathy, designed for healing, crafted with care.*