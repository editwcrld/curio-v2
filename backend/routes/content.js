/**
 * CURIO BACKEND - Content Routes
 * ✅ /daily/quote - Random aus Cache
 * ✅ /quote/fresh - Frisch von API + speichert in DB + ECHTE UUID!
 * ✅ /daily/art - Aus Cache
 * ✅ /art/fresh - Frisch (TODO: Art API)
 */

const express = require('express');
const router = express.Router();

const { optionalAuth, getUserType } = require('../middleware/auth');
const { incrementLimit, getUserLimits } = require('../config/supabase');
const { getQuote } = require('../services/quote-cache');
const { fetchRandomQuote } = require('../services/api-aggregator');
const { cacheQuote } = require('../services/quote-cache');
const { LIMITS } = require('../config/constants');

// =====================================================
// DUMMY DATA - STATIC UUIDs!
// =====================================================

const DUMMY_ART = [
    {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        title: "Sternennacht",
        artist: "Vincent van Gogh",
        year: "1889",
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
        description: "Die Sternennacht ist eines der bekanntesten Werke von Vincent van Gogh."
    },
    {
        id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        title: "Die große Welle vor Kanagawa",
        artist: "Katsushika Hokusai",
        year: "1831",
        imageUrl: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800&q=80",
        description: "Dieses ikonische japanische Holzschnittwerk zeigt eine riesige Welle."
    },
    {
        id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
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
    if (!req.user) {
        return { canAccess: true, limitReached: false, userType: 'guest' };
    }
    
    const userType = getUserType(req);
    const limits = LIMITS[userType];
    
    if (limits[type] === null) {
        return { canAccess: true, limitReached: false, userType: 'premium' };
    }
    
    const usage = await getUserLimits(req.user.id);
    const currentCount = type === 'art' ? usage.art_count : usage.quote_count;
    
    if (currentCount >= limits[type]) {
        return {
            canAccess: false,
            limitReached: true,
            userType,
            current: currentCount,
            max: limits[type]
        };
    }
    
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
// QUOTE ROUTES
// =====================================================

/**
 * GET /api/daily/quote
 */
router.get('/daily/quote', optionalAuth, async (req, res, next) => {
    try {
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
            source: 'cache'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/quote/fresh
 * ✅ FIXED: Wartet auf DB Insert, gibt echte UUID zurück!
 */
router.get('/quote/fresh', optionalAuth, async (req, res, next) => {
    try {
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
        
        // Fetch fresh from API
        const freshQuote = await fetchRandomQuote();
        
        // Save to DB and GET THE REAL ID!
        const cachedQuote = await cacheQuote(freshQuote);
        
        if (cachedQuote) {
            res.json({
                success: true,
                data: {
                    id: cachedQuote.id,
                    text: cachedQuote.text,
                    author: cachedQuote.author,
                    source: cachedQuote.source || 'Unknown',
                    category: cachedQuote.category || null,
                    backgroundInfo: cachedQuote.ai_description || null
                },
                cached: false,
                source: 'api'
            });
        } else {
            // Duplicate - get from cache
            const existingQuote = await getQuote();
            
            res.json({
                success: true,
                data: {
                    id: existingQuote.id,
                    text: existingQuote.text,
                    author: existingQuote.author,
                    source: existingQuote.source || 'Unknown',
                    category: existingQuote.category || null,
                    backgroundInfo: existingQuote.ai_description || null
                },
                cached: true,
                source: 'cache-duplicate'
            });
        }
    } catch (error) {
        try {
            const cachedQuote = await getQuote();
            res.json({
                success: true,
                data: {
                    id: cachedQuote.id,
                    text: cachedQuote.text,
                    author: cachedQuote.author,
                    source: cachedQuote.source || 'Unknown',
                    category: cachedQuote.category,
                    backgroundInfo: cachedQuote.ai_description || null
                },
                cached: true,
                source: 'cache-fallback'
            });
        } catch (fallbackError) {
            next(error);
        }
    }
});

router.get('/quote/next', optionalAuth, async (req, res, next) => {
    req.url = '/quote/fresh';
    router.handle(req, res, next);
});

// =====================================================
// ART ROUTES
// =====================================================

router.get('/daily/art', optionalAuth, async (req, res, next) => {
    try {
        const art = getRandomItem(DUMMY_ART);
        res.json({ success: true, data: art, cached: true, source: 'dummy' });
    } catch (error) {
        next(error);
    }
});

router.get('/art/fresh', optionalAuth, async (req, res, next) => {
    try {
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
        res.json({ success: true, data: art, cached: false, source: 'dummy-fresh' });
    } catch (error) {
        next(error);
    }
});

router.get('/art/next', optionalAuth, async (req, res, next) => {
    req.url = '/art/fresh';
    router.handle(req, res, next);
});

module.exports = router;