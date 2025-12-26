/**
 * CURIO BACKEND - Auth Middleware
 * JWT Token Verification mit Supabase Auth
 */

const { supabase } = require('../config/db');
const { isPremium } = require('../config/supabase');
const { UnauthorizedError, ForbiddenError } = require('./error');

/**
 * Get user from JWT token
 * @param {string} token - JWT Access Token
 * @returns {Promise<object|null>} - User object or null
 */
async function getUserFromToken(token) {
    if (!token) return null;
    
    try {
        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            console.warn('Invalid token:', error?.message);
            return null;
        }
        
        // Check premium status
        const premium = await isPremium(user.email);
        
        // Return user object with premium status
        return {
            id: user.id,
            email: user.email,
            isPremium: premium,
            metadata: user.user_metadata || {}
        };
    } catch (error) {
        console.error('getUserFromToken error:', error);
        return null;
    }
}

/**
 * Extract token from Authorization header
 * @param {object} req - Express request
 * @returns {string|null} - Token or null
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) return null;
    
    // Format: "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    
    return parts[1];
}

/**
 * Optional Auth Middleware
 * Adds user to req if token is valid, but allows guest access
 * 
 * Use for: Public endpoints that benefit from user context
 * Example: Daily content with limit tracking
 */
async function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req);
        
        if (token) {
            const user = await getUserFromToken(token);
            req.user = user;  // null if token invalid
        } else {
            req.user = null;  // Guest user
        }
        
        next();
    } catch (error) {
        // Don't block request on error, treat as guest
        req.user = null;
        next();
    }
}

/**
 * Require Auth Middleware
 * User MUST be authenticated, otherwise 401
 * 
 * Use for: User-specific endpoints
 * Example: Favorites, profile
 */
async function requireAuth(req, res, next) {
    try {
        const token = extractToken(req);
        
        if (!token) {
            throw new UnauthorizedError('No authorization token provided');
        }
        
        const user = await getUserFromToken(token);
        
        if (!user) {
            throw new UnauthorizedError('Invalid or expired token');
        }
        
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Require Premium Middleware
 * User MUST be premium, otherwise 403
 * 
 * Use for: Premium-only features
 * Example: Unlimited access, premium content
 */
async function requirePremium(req, res, next) {
    try {
        // First check if user is authenticated
        const token = extractToken(req);
        
        if (!token) {
            throw new UnauthorizedError('Authentication required');
        }
        
        const user = await getUserFromToken(token);
        
        if (!user) {
            throw new UnauthorizedError('Invalid or expired token');
        }
        
        // Check premium status
        if (!user.isPremium) {
            throw new ForbiddenError('Premium subscription required');
        }
        
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Get current user (for routes)
 * Helper to safely access req.user
 * 
 * @param {object} req - Express request
 * @returns {object|null} - User or null
 */
function getCurrentUser(req) {
    return req.user || null;
}

/**
 * Check if current user is premium
 * 
 * @param {object} req - Express request
 * @returns {boolean}
 */
function isCurrentUserPremium(req) {
    return req.user?.isPremium || false;
}

/**
 * Get user type for limit checking
 * 
 * @param {object} req - Express request
 * @returns {string} - 'guest', 'registered', 'premium'
 */
function getUserType(req) {
    if (!req.user) return 'guest';
    if (req.user.isPremium) return 'premium';
    return 'registered';
}

module.exports = {
    // Middleware
    optionalAuth,
    requireAuth,
    requirePremium,
    
    // Helpers
    getUserFromToken,
    extractToken,
    getCurrentUser,
    isCurrentUserPremium,
    getUserType
};