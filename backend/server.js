/**
 * CURIO BACKEND - Server Entry Point
 * COMPLETE VERSION - Ready for Production!
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

// Auth Routes (NEW!)
app.use('/api/auth', require('./routes/auth'));

// User Routes
app.use('/api/user', require('./routes/user'));

// Favorites Routes (NEW!)
app.use('/api/favorites', require('./routes/favorites'));

// Content Routes
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
        status: 'running',
        endpoints: {
            // Public
            health: 'GET /health',
            
            // Auth
            signup: 'POST /api/auth/signup',
            login: 'POST /api/auth/login',
            logout: 'POST /api/auth/logout',
            session: 'GET /api/auth/session',
            refresh: 'POST /api/auth/refresh',
            
            // Content (Public/Optional Auth)
            daily_art: 'GET /api/daily/art',
            daily_quote: 'GET /api/daily/quote',
            art_next: 'GET /api/art/next',
            quote_next: 'GET /api/quote/next',
            
            // User (Requires Auth)
            user_profile: 'GET /api/user/profile',
            user_limits: 'GET /api/user/limits',
            user_status: 'GET /api/user/status',
            
            // Favorites (Requires Auth)
            favorites_list: 'GET /api/favorites',
            favorites_add: 'POST /api/favorites',
            favorites_remove: 'DELETE /api/favorites/:id',
            favorites_check: 'GET /api/favorites/check/:type/:id'
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
    console.log('   CURIO BACKEND - READY!');
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
    console.log('   ✅ Auth Middleware');
    console.log('');
    console.log('🔐 Authentication:');
    console.log('   POST /api/auth/signup         - Create Account');
    console.log('   POST /api/auth/login          - Sign In');
    console.log('   POST /api/auth/logout         - Sign Out');
    console.log('   GET  /api/auth/session        - Validate Token');
    console.log('   POST /api/auth/refresh        - Refresh Token');
    console.log('');
    console.log('📦 Content (Public/Optional Auth):');
    console.log('   GET  /api/daily/art           - Daily Art');
    console.log('   GET  /api/daily/quote         - Daily Quote');
    console.log('   GET  /api/art/next            - Next Art');
    console.log('   GET  /api/quote/next          - Next Quote');
    console.log('');
    console.log('👤 User (Requires Auth):');
    console.log('   GET  /api/user/profile        - User Profile');
    console.log('   GET  /api/user/limits         - Daily Limits');
    console.log('   GET  /api/user/status         - User Status');
    console.log('');
    console.log('⭐ Favorites (Requires Auth):');
    console.log('   GET    /api/favorites         - List All');
    console.log('   POST   /api/favorites         - Add Favorite');
    console.log('   DELETE /api/favorites/:id     - Remove Favorite');
    console.log('   GET    /api/favorites/check   - Check Status');
    console.log('');
    console.log('🎯 Press Ctrl+C to stop');
    console.log('');
});