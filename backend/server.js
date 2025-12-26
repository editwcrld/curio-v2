/**
 * CURIO BACKEND - Server Entry Point
 * Minimal server.js - alle Logik in separaten Modulen!
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS - Allow Frontend
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// ROUTES
// =====================================================

// Content Routes (Daily Art & Quote)
app.use('/api', require('./routes/content'));

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'Curio Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            daily_art: '/api/daily/art',
            daily_quote: '/api/daily/quote'
        }
    });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableRoutes: [
            'GET /',
            'GET /health',
            'GET /api/daily/art',
            'GET /api/daily/quote'
        ]
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================');
    console.log('   CURIO BACKEND STARTED');
    console.log('🚀 ================================');
    console.log('');
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
    console.log('');
    console.log('📍 Available Endpoints:');
    console.log(`   GET  /                    - API Info`);
    console.log(`   GET  /health              - Health Check`);
    console.log(`   GET  /api/daily/art       - Daily Art`);
    console.log(`   GET  /api/daily/quote     - Daily Quote`);
    console.log('');
    console.log('🎯 Press Ctrl+C to stop');
    console.log('');
});