/**
 * CURIO BACKEND - Server Entry
 * ✅ Express Server
 * ✅ Routes
 * ✅ Scheduler für Daily Tasks
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Middleware - mit Fallbacks falls nicht vorhanden
let corsMiddleware, honeypotMiddleware, errorHandler, notFoundHandler;

try {
    const corsModule = require('./middleware/cors');
    corsMiddleware = corsModule.corsMiddleware || corsModule;
} catch (e) {
    console.log('⚠️ Custom CORS not found, using default');
    corsMiddleware = cors();
}

try {
    const honeypotModule = require('./middleware/honeypot');
    honeypotMiddleware = honeypotModule.honeypotMiddleware || honeypotModule;
} catch (e) {
    console.log('⚠️ Honeypot not found, skipping');
    honeypotMiddleware = (req, res, next) => next();
}

try {
    const errorModule = require('./middleware/error');
    errorHandler = errorModule.errorHandler;
    notFoundHandler = errorModule.notFoundHandler;
} catch (e) {
    console.log('⚠️ Error handler not found, using default');
    errorHandler = (err, req, res, next) => {
        console.error('❌ Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    };
    notFoundHandler = (req, res) => {
        res.status(404).json({ success: false, error: 'Not found' });
    };
}

// Routes - mit Fallbacks
let authRoutes, contentRoutes, userRoutes, favoritesRoutes;

try {
    authRoutes = require('./routes/auth');
} catch (e) {
    console.log('⚠️ Auth routes not found');
    authRoutes = express.Router();
}

try {
    contentRoutes = require('./routes/content');
} catch (e) {
    console.log('⚠️ Content routes not found');
    contentRoutes = express.Router();
}

try {
    userRoutes = require('./routes/user');
} catch (e) {
    console.log('⚠️ User routes not found');
    userRoutes = express.Router();
}

try {
    favoritesRoutes = require('./routes/favorites');
} catch (e) {
    console.log('⚠️ Favorites routes not found');
    favoritesRoutes = express.Router();
}

// Services
let startScheduler, getDailyContent, isSchedulerRunning;

try {
    const scheduler = require('./services/scheduler');
    startScheduler = scheduler.startScheduler;
    isSchedulerRunning = scheduler.isSchedulerRunning;
} catch (e) {
    console.log('⚠️ Scheduler not found');
    startScheduler = () => console.log('Scheduler not available');
    isSchedulerRunning = () => false;
}

try {
    const dailyContent = require('./services/daily-content');
    getDailyContent = dailyContent.getDailyContent;
} catch (e) {
    console.log('⚠️ Daily content service not found');
    getDailyContent = async () => null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

// CORS - use custom or default
if (typeof corsMiddleware === 'function') {
    app.use(corsMiddleware);
} else {
    app.use(cors());
}

// Honeypot
if (typeof honeypotMiddleware === 'function') {
    app.use(honeypotMiddleware);
}

// =====================================================
// ROOT & HEALTH ROUTES (for Render health checks)
// =====================================================

app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'curio-backend',
        version: '2.0.0'
    });
});

app.head('/', (req, res) => {
    res.status(200).end();
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        scheduler: isSchedulerRunning ? isSchedulerRunning() : false
    });
});

// =====================================================
// API ROUTES
// =====================================================

app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/favorites', favoritesRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

if (notFoundHandler) app.use(notFoundHandler);
if (errorHandler) app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, async () => {
    console.log('═══════════════════════════════════════');
    console.log(`🚀 CURIO Backend running on port ${PORT}`);
    console.log(`📅 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════');
    
    // Start scheduler for daily tasks
    try {
        if (startScheduler) startScheduler();
    } catch (error) {
        console.error('⚠️ Failed to start scheduler:', error.message);
    }
    
    // Ensure we have daily content ready
    try {
        if (getDailyContent) {
            console.log('📅 Checking daily content...');
            await getDailyContent();
        }
    } catch (error) {
        console.error('⚠️ Failed to check daily content:', error.message);
    }
    
    console.log('═══════════════════════════════════════');
    console.log('✅ Server ready!');
    console.log('═══════════════════════════════════════');
});

module.exports = app;