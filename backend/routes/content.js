/**
 * CURIO BACKEND - Content Routes (UPDATED)
 * Endpoints: /api/daily/art, /api/daily/quote
 * 
 * UPDATED: Mit optionalAuth für Limit Tracking
 */

const express = require('express');
const router = express.Router();

const { optionalAuth, getUserType } = require('../middleware/auth');
const { incrementLimit, getUserLimits } = require('../config/supabase');
const { LIMITS } = require('../config/constants');

// =====================================================
// DUMMY DATA
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

const DUMMY_QUOTES = [
    {
        id: "quote_1",
        text: "In der Mitte von Schwierigkeiten liegen die Möglichkeiten.",
        author: "Albert Einstein",
        source: "Brief an einen Freund, 1940er",
        backgroundInfo: "Albert Einstein (1879-1955) war ein theoretischer Physiker."
    },
    {
        id: "quote_2",
        text: "Die einzige Art, großartige Arbeit zu leisten, ist zu lieben, was man tut.",
        author: "Steve Jobs",
        source: "Stanford Commencement Speech, 2005",
        backgroundInfo: "Steve Jobs (1955-2011) war Mitbegründer von Apple Inc."
    },
    {
        id: "quote_3",
        text: "Sei du selbst die Veränderung, die du dir wünschst für diese Welt.",
        author: "Mahatma Gandhi",
        source: "Zugeschrieben",
        backgroundInfo: "Mahatma Gandhi (1869-1948) war ein indischer Politiker."
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
        
        // Get art (currently dummy data)
        const art = getRandomItem(DUMMY_ART);
        
        res.json({
            success: true,
            data: art,
            cached: false,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/daily/quote
 * Daily quote (with optional limit tracking)
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
        
        // Get quote (currently dummy data)
        const quote = getRandomItem(DUMMY_QUOTES);
        
        res.json({
            success: true,
            data: quote,
            cached: false,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/art/next
 * Next random art
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
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/quote/next
 * Next random quote
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
        
        const quote = getRandomItem(DUMMY_QUOTES);
        res.json({
            success: true,
            data: quote,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;