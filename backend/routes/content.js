/**
 * CURIO BACKEND - Content Routes (UPDATED with Cache)
 * Endpoints: /api/daily/art, /api/daily/quote
 * 
 * UPDATED: Nutzt jetzt Quote Cache statt Dummy Data!
 */

const express = require('express');
const router = express.Router();

const { optionalAuth, getUserType } = require('../middleware/auth');
const { incrementLimit, getUserLimits } = require('../config/supabase');
const { getQuote } = require('../services/quote-cache');
const { LIMITS } = require('../config/constants');

// =====================================================
// DUMMY DATA (nur für Art - bis Step 9!)
// =====================================================

const DUMMY_ART = [
    {
        id: "art_1",
        title: "Sternennacht",
        artist: "Vincent van Gogh",
        year: "1889",
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
        description: "Die Sternennacht ist eines der bekanntesten Werke von Vincent van Gogh."
    },
    {
        id: "art_2",
        title: "Die große Welle vor Kanagawa",
        artist: "Katsushika Hokusai",
        year: "1831",
        imageUrl: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800&q=80",
        description: "Dieses ikonische japanische Holzschnittwerk zeigt eine riesige Welle."
    },
    {
        id: "art_3",
        title: "Mona Lisa",
        artist: "Leonardo da Vinci",
        year: "1503",
        imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80",
        description: "Die Mona Lisa ist eines der berühmtesten Gemälde der Welt."
    }
];

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// =====================================================
// HELPER: Check Limits
// =====================================================

async function checkAndIncrementLimit(req, type) {
    // Guest users: No tracking
    if (!req.user) {
        return {
            canAccess: true,
            limitReached: false,
            userType: 'guest'
        };
    }
    
    const userType = getUserType(req);
    const limits = LIMITS[userType];
    
    // Premium: Unlimited
    if (limits[type] === null) {
        return {
            canAccess: true,
            limitReached: false,
            userType: 'premium'
        };
    }
    
    // Get current usage
    const usage = await getUserLimits(req.user.id);
    const currentCount = type === 'art' ? usage.art_count : usage.quote_count;
    
    // Check if limit reached
    if (currentCount >= limits[type]) {
        return {
            canAccess: false,
            limitReached: true,
            userType,
            current: currentCount,
            max: limits[type]
        };
    }
    
    // Increment limit
    await incrementLimit(req.user.id, type);
    
    return {
        canAccess: true,
        limitReached: false,
        userType,
        current: currentCount + 1,
        max: limits[type]
    };
}

// =====================================================
// ROUTES
// =====================================================

/**
 * GET /api/daily/art
 * Daily artwork (with optional limit tracking)
 * 
 * TODO (Step 9): Replace dummy data with real Art API
 */
router.get('/daily/art', optionalAuth, async (req, res, next) => {
    try {
        // Check limits (only for authenticated users)
        if (req.user) {
            const limitCheck = await checkAndIncrementLimit(req, 'art');
            
            if (!limitCheck.canAccess) {
                return res.status(429).json({
                    success: false,
                    error: 'Daily limit reached',
                    limitReached: true,
                    userType: limitCheck.userType,
                    limits: {
                        current: limitCheck.current,
                        max: limitCheck.max
                    }
                });
            }
        }
        
        // Get art (currently dummy data - TODO: Art API in Step 9)
        const art = getRandomItem(DUMMY_ART);
        
        res.json({
            success: true,
            data: art,
            cached: false,
            source: 'dummy',  // TODO: Change to 'cache' in Step 9
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/daily/quote
 * Daily quote (with limit tracking)
 * 
 * UPDATED: Now uses real Quote Cache! ✅
 */
router.get('/daily/quote', optionalAuth, async (req, res, next) => {
    try {
        // Check limits (only for authenticated users)
        if (req.user) {
            const limitCheck = await checkAndIncrementLimit(req, 'quotes');
            
            if (!limitCheck.canAccess) {
                return res.status(429).json({
                    success: false,
                    error: 'Daily limit reached',
                    limitReached: true,
                    userType: limitCheck.userType,
                    limits: {
                        current: limitCheck.current,
                        max: limitCheck.max
                    }
                });
            }
        }
        
        // Get quote from cache (REAL DATA!)
        const quote = await getQuote();
        
        res.json({
            success: true,
            data: {
                id: quote.id,
                text: quote.text,
                author: quote.author,
                source: quote.source || 'Unknown',
                category: quote.category,
                backgroundInfo: quote.ai_description || null  // Will be filled in Step 14
            },
            cached: true,
            source: 'cache',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/art/next
 * Next random art
 * 
 * TODO (Step 9): Replace with real Art API
 */
router.get('/art/next', optionalAuth, async (req, res, next) => {
    try {
        // Same limit check as /daily/art
        if (req.user) {
            const limitCheck = await checkAndIncrementLimit(req, 'art');
            
            if (!limitCheck.canAccess) {
                return res.status(429).json({
                    success: false,
                    error: 'Daily limit reached',
                    limitReached: true
                });
            }
        }
        
        const art = getRandomItem(DUMMY_ART);
        res.json({
            success: true,
            data: art,
            source: 'dummy',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/quote/next
 * Next random quote (REAL DATA!)
 */
router.get('/quote/next', optionalAuth, async (req, res, next) => {
    try {
        // Same limit check as /daily/quote
        if (req.user) {
            const limitCheck = await checkAndIncrementLimit(req, 'quotes');
            
            if (!limitCheck.canAccess) {
                return res.status(429).json({
                    success: false,
                    error: 'Daily limit reached',
                    limitReached: true
                });
            }
        }
        
        const quote = await getQuote();
        res.json({
            success: true,
            data: {
                id: quote.id,
                text: quote.text,
                author: quote.author,
                source: quote.source || 'Unknown',
                category: quote.category,
                backgroundInfo: quote.ai_description || null
            },
            cached: true,
            source: 'cache',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;