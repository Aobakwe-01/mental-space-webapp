// Simple static file server for MentalSpace frontend
// This demonstrates how the frontend connects to the backend API

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// API endpoint configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Middleware to inject API configuration
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        const filePath = path.join(__dirname, req.path);
        
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Inject API configuration
            const apiScript = `
                <script>
                    window.MENTALSPACE_CONFIG = {
                        API_BASE_URL: '${API_BASE_URL}',
                        NODE_ENV: '${process.env.NODE_ENV || 'development'}'
                    };
                </script>
            `;
            
            // Add API script before closing head tag
            content = content.replace('</head>', `${apiScript}\n</head>`);
            
            res.send(content);
            return;
        }
    }
    next();
});

// Serve static files
app.use(express.static(__dirname));

// Handle SPA routing
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        
        // Inject API configuration
        const apiScript = `
            <script>
                window.MENTALSPACE_CONFIG = {
                    API_BASE_URL: '${API_BASE_URL}',
                    NODE_ENV: '${process.env.NODE_ENV || 'development'}'
                };
            </script>
        `;
        
        content = content.replace('</head>', `${apiScript}\n</head>`);
        res.send(content);
    } else {
        res.status(404).send('Index file not found');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        api_url: API_BASE_URL,
        node_env: process.env.NODE_ENV || 'development'
    });
});

// Configuration endpoint
app.get('/config', (req, res) => {
    res.json({
        api_url: API_BASE_URL,
        node_env: process.env.NODE_ENV || 'development',
        ws_url: API_BASE_URL.replace('http', 'ws')
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MentalSpace Frontend Server running on port ${PORT}`);
    console.log(`📡 Connected to API: ${API_BASE_URL}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`⚙️  Config: http://localhost:${PORT}/config`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});