/**
 * CURIO BACKEND - Honeypot Middleware
 * Bot Detection & Protection
 * 
 * Prüft unsichtbare "website" Felder:
 * - req.body.website (POST forms)
 * - req.query.website (URL parameters)
 * - req.headers['x-website'] (Custom headers)
 * 
 * Wenn gefüllt → BOT DETECTED! 🤖
 */

/**
 * Check if request is from a bot
 * @param {object} req - Express request
 * @returns {boolean} - true if bot detected
 */
function checkHoneypot(req) {
    // Check all 3 possible locations
    const honeypot = req.body?.website || 
                     req.query?.website || 
                     req.headers['x-website'];
    
    if (honeypot) {
        console.log('🤖 BOT DETECTED! Honeypot triggered:', {
            value: honeypot,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            path: req.path,
            timestamp: new Date().toISOString()
        });
        return true;
    }
    
    return false;
}

/**
 * Honeypot Middleware
 * Blocks requests if honeypot field is filled
 */
function honeypotMiddleware(req, res, next) {
    // Only check POST/PUT requests (forms)
    if (req.method === 'POST' || req.method === 'PUT') {
        if (checkHoneypot(req)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid form submission'
            });
        }
    }
    
    next();
}

module.exports = honeypotMiddleware;