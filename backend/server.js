/**
 * CURIO BACKEND - Server Entry Point
 * FINAL Version mit Auth Integration
 */

require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARE (Reihenfolge wichtig!)
// =====================================================

// 1. CORS
const corsMiddleware = require('./middleware/cors');
app.use(corsMiddleware);

// 2. Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Honeypot Bot Protection
const honeypotMiddleware = require('./middleware/honeypot');
app.use(honeypotMiddleware);

// =====================================================
// ROUTES
// =====================================================

// Content Routes
app.use('/api', require('./routes/content'));

// User Routes (NEW!)
app.use('/api/user', require('./routes/user'));

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
            // Content
            daily_art: '/api/daily/art',
            daily_quote: '/api/daily/quote',
            art_next: '/api/art/next',
            quote_next: '/api/quote/next',
            // User (requires auth)
            user_profile: '/api/user/profile',
            user_limits: '/api/user/limits',
            user_status: '/api/user/status'
        }
    });
});

// =====================================================
// ERROR HANDLING
// =====================================================

const { notFoundHandler, errorHandler } = require('./middleware/error');

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

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
    console.log('🛡️  Middleware Active:');
    console.log('   ✅ CORS Policy');
    console.log('   ✅ Honeypot Bot Protection');
    console.log('   ✅ Error Handler');
    console.log('   ✅ Auth Middleware (optionalAuth, requireAuth)');
    console.log('');
    console.log('📍 Available Endpoints:');
    console.log('   GET  /                      - API Info');
    console.log('   GET  /health                - Health Check');
    console.log('');
    console.log('   📦 Content (Public/Optional Auth):');
    console.log('   GET  /api/daily/art         - Daily Art');
    console.log('   GET  /api/daily/quote       - Daily Quote');
    console.log('   GET  /api/art/next          - Next Art');
    console.log('   GET  /api/quote/next        - Next Quote');
    console.log('');
    console.log('   👤 User (Requires Auth):');
    console.log('   GET  /api/user/profile      - User Profile');
    console.log('   GET  /api/user/limits       - Daily Limits');
    console.log('   GET  /api/user/status       - User Status');
    console.log('');
    console.log('🎯 Press Ctrl+C to stop');
    console.log('');
});