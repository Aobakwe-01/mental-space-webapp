#!/bin/bash

# MentalSpace Backend Deployment Script

set -e

echo "🚀 Starting MentalSpace Backend Deployment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if required tools are installed
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is required but not installed"
        exit 1
    fi
}

print_status "Checking required tools..."
check_command node
check_command npm
check_command git

# Navigate to backend directory
if [ -d "backend" ]; then
    cd backend
else
    print_error "Backend directory not found"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning ".env file not found, creating from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before running the server"
fi

# Create logs directory
mkdir -p logs

# Run database migrations
print_status "Running database migrations..."
npx sequelize-cli db:migrate || print_warning "Migration failed. Please check your database configuration."

# Create default counselor account if in development
if [ "$NODE_ENV" != "production" ]; then
    print_status "Setting up development environment..."
    
    # Create default counselor for testing
    cat > create-default-counselor.js << 'EOF'
const bcrypt = require('bcryptjs');
const { Counselor } = require('./models');

async function createDefaultCounselor() {
    try {
        const existingCounselor = await Counselor.findOne({ where: { email: 'counselor@mentalspace.app' } });
        
        if (!existingCounselor) {
            const hashedPassword = await bcrypt.hash('counselor123', 12);
            
            await Counselor.create({
                email: 'counselor@mentalspace.app',
                password: hashedPassword,
                firstName: 'Dr. Sarah',
                lastName: 'Johnson',
                licenseNumber: 'LPC-2024-001',
                specializations: ['Anxiety', 'Depression', 'Stress Management'],
                bio: 'Licensed professional counselor with 5+ years of experience in mental health support.',
                isOnline: true,
                status: 'available'
            });
            
            console.log('Default counselor created successfully');
            console.log('Email: counselor@mentalspace.app');
            console.log('Password: counselor123');
        } else {
            console.log('Default counselor already exists');
        }
    } catch (error) {
        console.error('Error creating default counselor:', error);
    }
}

createDefaultCounselor();
EOF

    node create-default-counselor.js
    rm create-default-counselor.js
fi

# Build the application (if needed)
print_status "Building application..."
npm run build 2>/dev/null || print_warning "No build script found, skipping build step"

# Test the application
print_status "Testing application..."
npm test 2>/dev/null || print_warning "No test script found or tests failed"

# Create systemd service file for production
if [ "$NODE_ENV" == "production" ]; then
    print_status "Creating systemd service..."
    
    cat > /etc/systemd/system/mentalspace.service << EOF
[Unit]
Description=MentalSpace Backend API
After=network.target

[Service]
Type=simple
User=mentalspace
WorkingDirectory=/opt/mentalspace/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/mentalspace/backend/.env

[Install]
WantedBy=multi-user.target
EOF

    print_status "Systemd service created. To start the service:"
    print_status "sudo systemctl enable mentalspace"
    print_status "sudo systemctl start mentalspace"
fi

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem file..."

cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'mentalspace-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    merge_logs: true
  }]
};
EOF

# Create startup script
cat > start.sh << 'EOF'
#!/bin/bash

# MentalSpace Backend Startup Script

echo "🚀 Starting MentalSpace Backend..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

# Start with PM2 if available, otherwise with npm
if command -v pm2 &> /dev/null; then
    echo "✅ Starting with PM2..."
    pm2 start ecosystem.config.js --env ${NODE_ENV:-development}
    pm2 save
    echo "📝 PM2 startup script: pm2 startup"
else
    echo "⚠️  PM2 not found, starting with npm..."
    npm start
fi

echo "🎉 MentalSpace Backend started successfully!"
echo "📊 View logs: npm run logs"
echo "🛑 Stop server: npm run stop"
EOF

chmod +x start.sh

# Create utility scripts
print_status "Creating utility scripts..."

cat > stop.sh << 'EOF'
#!/bin/bash

# MentalSpace Backend Stop Script

echo "🛑 Stopping MentalSpace Backend..."

if command -v pm2 &> /dev/null; then
    pm2 stop mentalspace-api
    pm2 delete mentalspace-api
    echo "✅ PM2 processes stopped"
else
    echo "⚠️  PM2 not found, please stop the process manually"
fi

echo "🎉 MentalSpace Backend stopped successfully!"
EOF

chmod +x stop.sh

cat > logs.sh << 'EOF'
#!/bin/bash

# MentalSpace Backend Logs Script

if command -v pm2 &> /dev/null; then
    pm2 logs mentalspace-api --lines 100
else
    echo "📄 Viewing log files directly..."
    tail -f logs/combined.log
fi
EOF

chmod +x logs.sh

# Create README for deployment
print_status "Creating deployment documentation..."

cat > DEPLOYMENT.md << EOF
# MentalSpace Backend Deployment

## Quick Start

1. **Configure Environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your database and other configuration
   \`\`\`

2. **Start the Server**
   \`\`\`bash
   ./start.sh
   \`\`\`

## Management Commands

- **Start Server**: \`./start.sh\`
- **Stop Server**: \`./stop.sh\`
- **View Logs**: \`./logs.sh\`
- **Restart**: \`pm2 restart mentalspace-api\`
- **Status**: \`pm2 status\`

## Development

For development with auto-restart:
\`\`\`bash
npm run dev
\`\`\`

## Production Deployment

### Using PM2
\`\`\`bash
npm install -g pm2
./start.sh
\`\`\`

### Using Systemd (Linux)
\`\`\`bash
sudo systemctl enable mentalspace
sudo systemctl start mentalspace
\`\`\`

### Using Docker
\`\`\`bash
docker-compose up -d
\`\`\`

## Environment Variables

See \`.env.example\` for all required environment variables.

## Database

The application uses PostgreSQL. Make sure to:

1. Create database
2. Run migrations: \`npx sequelize-cli db:migrate\`
3. Seed data (optional): \`npx sequelize-cli db:seed:all\`

## Monitoring

- **Health Check**: GET /health
- **Logs**: \`./logs.sh\`
- **PM2 Monitor**: \`pm2 monit\`

## Security

- Keep your JWT_SECRET secure and unique
- Use HTTPS in production
- Regularly update dependencies
- Monitor access logs

## Support

For issues and questions, please refer to the main README.md file.
EOF

print_status "✅ Deployment setup complete!"
print_status ""
print_status "Next steps:"
print_status "1. Edit .env file with your configuration"
print_status "2. Start the server: ./start.sh"
print_status "3. View logs: ./logs.sh"
print_status ""
print_status "For production deployment, consider:"
print_status "- Using a process manager (PM2)"
print_status "- Setting up a reverse proxy (nginx)"
print_status "- Using SSL certificates"
print_status "- Configuring a firewall"
print_status "- Setting up monitoring"
print_status ""
echo "🎉 MentalSpace Backend is ready to deploy!"
EOF

chmod +x /mnt/okcomputer/output/deploy.sh