/**
 * CURIO BACKEND - User Routes
 * User-specific endpoints (Profile, Limits, etc)
 */

const express = require('express');
const router = express.Router();

const { requireAuth, getCurrentUser, getUserType } = require('../middleware/auth');
const { getUserProfile, getUserLimits } = require('../config/supabase');
const { LIMITS } = require('../config/constants');

/**
 * GET /api/user/profile
 * Get current user's profile
 * Requires: Authentication
 */
router.get('/profile', requireAuth, async (req, res, next) => {
    try {
        const user = getCurrentUser(req);
        
        // Get full profile from DB
        const profile = await getUserProfile(user.email);
        
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                isPremium: user.isPremium,
                profile: profile || null
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/user/limits
 * Get current user's daily limits
 * Requires: Authentication
 */
router.get('/limits', requireAuth, async (req, res, next) => {
    try {
        const user = getCurrentUser(req);
        const userType = getUserType(req);
        
        // Get today's usage
        const usage = await getUserLimits(user.id);
        
        // Get max limits for user type
        const maxLimits = LIMITS[userType];
        
        res.json({
            success: true,
            data: {
                userType,
                limits: {
                    art: {
                        used: usage.art_count,
                        max: maxLimits.art,
                        remaining: maxLimits.art === null ? null : Math.max(0, maxLimits.art - usage.art_count)
                    },
                    quotes: {
                        used: usage.quote_count,
                        max: maxLimits.quotes,
                        remaining: maxLimits.quotes === null ? null : Math.max(0, maxLimits.quotes - usage.quote_count)
                    }
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/user/status
 * Get user type and premium status
 * Requires: Authentication
 */
router.get('/status', requireAuth, async (req, res, next) => {
    try {
        const user = getCurrentUser(req);
        const userType = getUserType(req);
        
        res.json({
            success: true,
            data: {
                userType,
                isPremium: user.isPremium,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;