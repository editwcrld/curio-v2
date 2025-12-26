/**
 * CURIO BACKEND - CORS Middleware
 * Cross-Origin Resource Sharing Policy
 * 
 * Erlaubt Frontend-Backend Communication
 * Automatische Origin-Erkennung (Local + Production)
 */

const { ALLOWED_ORIGINS } = require('../config/constants');

/**
 * CORS Middleware
 * Prüft ob Request von erlaubtem Origin kommt
 */
function corsMiddleware(req, res, next) {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        );
        res.setHeader(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );
    }
    
    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
}

/**
 * Development: Log CORS rejections
 */
if (process.env.NODE_ENV === 'development') {
    const originalMiddleware = corsMiddleware;
    corsMiddleware = function(req, res, next) {
        const origin = req.headers.origin;
        
        if (origin && !ALLOWED_ORIGINS.includes(origin)) {
            console.warn(`⚠️  CORS: Rejected origin: ${origin}`);
            console.warn(`   Allowed origins:`, ALLOWED_ORIGINS);
        }
        
        return originalMiddleware(req, res, next);
    };
}

module.exports = corsMiddleware;