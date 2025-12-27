/**
 * CURIO BACKEND - Content Routes
 * ✅ /daily/quote - Random aus Cache (schnell)
 * ✅ /quote/fresh - Frisch + AI (wartet)
 * ✅ NUR EIN AI Call pro Quote!
 */

const express = require('express');
const router = express.Router();

const { optionalAuth, getUserType } = require('../middleware/auth');
const { incrementLimit, getUserLimits } = require('../config/supabase');
const { getQuote, cacheQuote, getRandomCachedQuote } = require('../services/quote-cache');
const { fetchRandomQuote } = require('../services/api-aggregator');
const { supabase } = require('../config/db');
const { LIMITS } = require('../config/constants');

// AI Import (optional)
let generateQuoteDescription = null;
try {
    const mistral = require('../services/mistral-ai');
    generateQuoteDescription = mistral.generateQuoteDescription;
    console.log('✅ Mistral AI available');
} catch (e) {
    console.warn('⚠️ Mistral AI not available');
}

// =====================================================
// DUMMY ART DATA
// =====================================================

const DUMMY_ART = [
    {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        title: "Sternennacht",
        artist: "Vincent van Gogh",
        year: "1889",
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
        ai_description_de: "Die Sternennacht ist eines der bekanntesten Werke von Vincent van Gogh, gemalt im Juni 1889.",
        ai_description_en: "The Starry Night is one of Vincent van Gogh's most famous works, painted in June 1889."
    },
    {
        id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        title: "Die große Welle vor Kanagawa",
        artist: "Katsushika Hokusai",
        year: "1831",
        imageUrl: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800&q=80",
        ai_description_de: "Dieses ikonische japanische Holzschnittwerk zeigt eine riesige Welle vor dem Berg Fuji.",
        ai_description_en: "This iconic Japanese woodblock print shows a massive wave with Mount Fuji in the background."
    },
    {
        id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
        title: "Mona Lisa",
        artist: "Leonardo da Vinci",
        year: "1503",
        imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80",
        ai_description_de: "Die Mona Lisa ist eines der berühmtesten Gemälde der Welt, gemalt von Leonardo da Vinci.",
        ai_description_en: "The Mona Lisa is one of the most famous paintings in the world, created by Leonardo da Vinci."
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
        return { canAccess: false, limitReached: true, userType, current: currentCount, max: limits[type] };
    }
    
    await incrementLimit(req.user.id, type);
    
    return { canAccess: true, limitReached: false, userType, current: currentCount + 1, max: limits[type] };
}

// =====================================================
// HELPER: Generate AI (EINMAL pro Quote!)
// =====================================================

async function ensureAIDescription(quoteId, quoteData) {
    // Check if AI already exists in DB
    const { data: existing } = await supabase
        .from('quotes')
        .select('ai_description_de, ai_description_en')
        .eq('id', quoteId)
        .single();
    
    // Already has AI? Return it!
    if (existing?.ai_description_de) {
        console.log(`✅ AI already exists for quote ${quoteId}`);
        return existing;
    }
    
    // No Mistral? Return empty
    if (!generateQuoteDescription || !process.env.MISTRAL_API_KEY) {
        console.log('⚠️ Mistral not available, skipping AI');
        return { ai_description_de: null, ai_description_en: null };
    }
    
    // Generate AI (ONLY ONCE!)
    console.log(`🤖 Generating AI for quote ${quoteId}...`);
    
    try {
        const descriptions = await generateQuoteDescription(quoteData);
        
        // Save to DB
        const { error } = await supabase
            .from('quotes')
            .update({
                ai_description_de: descriptions.de,
                ai_description_en: descriptions.en
            })
            .eq('id', quoteId);
        
        if (error) throw error;
        
        console.log(`✅ AI saved for quote ${quoteId}`);
        
        return {
            ai_description_de: descriptions.de,
            ai_description_en: descriptions.en
        };
    } catch (error) {
        console.error(`❌ AI generation failed:`, error.message);
        return { ai_description_de: null, ai_description_en: null };
    }
}

// =====================================================
// QUOTE ROUTES
// =====================================================

/**
 * GET /api/daily/quote
 * Random from cache - FAST, may not have AI
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
                backgroundInfo: quote.ai_description_de || quote.ai_description_en || null,
                ai_description_de: quote.ai_description_de || null,
                ai_description_en: quote.ai_description_en || null
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
 * Fresh quote - WAITS for AI!
 */
router.get('/quote/fresh', optionalAuth, async (req, res, next) => {
    try {
        // Check limits
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
        console.log('📥 Fetching fresh quote...');
        const freshQuote = await fetchRandomQuote();
        
        // Save to DB (NO AI here!)
        const cachedQuote = await cacheQuote(freshQuote);
        
        if (cachedQuote) {
            // Generate AI (ONCE!)
            const aiDescriptions = await ensureAIDescription(cachedQuote.id, {
                text: cachedQuote.text,
                author: cachedQuote.author
            });
            
            res.json({
                success: true,
                data: {
                    id: cachedQuote.id,
                    text: cachedQuote.text,
                    author: cachedQuote.author,
                    source: cachedQuote.source || 'Unknown',
                    category: cachedQuote.category || null,
                    backgroundInfo: aiDescriptions.ai_description_de || aiDescriptions.ai_description_en || null,
                    ai_description_de: aiDescriptions.ai_description_de,
                    ai_description_en: aiDescriptions.ai_description_en
                },
                cached: false,
                source: 'api+ai'
            });
        } else {
            // Duplicate - get from cache with AI
            const existingQuote = await getRandomCachedQuote();
            
            if (existingQuote) {
                const aiDescriptions = await ensureAIDescription(existingQuote.id, {
                    text: existingQuote.text,
                    author: existingQuote.author
                });
                
                res.json({
                    success: true,
                    data: {
                        id: existingQuote.id,
                        text: existingQuote.text,
                        author: existingQuote.author,
                        source: existingQuote.source || 'Unknown',
                        category: existingQuote.category || null,
                        backgroundInfo: aiDescriptions.ai_description_de || existingQuote.ai_description_de || null,
                        ai_description_de: aiDescriptions.ai_description_de || existingQuote.ai_description_de,
                        ai_description_en: aiDescriptions.ai_description_en || existingQuote.ai_description_en
                    },
                    cached: true,
                    source: 'cache-with-ai'
                });
            } else {
                throw new Error('No quotes available');
            }
        }
    } catch (error) {
        // Fallback
        try {
            const cachedQuote = await getRandomCachedQuote();
            if (cachedQuote) {
                res.json({
                    success: true,
                    data: {
                        id: cachedQuote.id,
                        text: cachedQuote.text,
                        author: cachedQuote.author,
                        source: cachedQuote.source || 'Unknown',
                        category: cachedQuote.category,
                        backgroundInfo: cachedQuote.ai_description_de || null,
                        ai_description_de: cachedQuote.ai_description_de,
                        ai_description_en: cachedQuote.ai_description_en
                    },
                    cached: true,
                    source: 'cache-fallback'
                });
            } else {
                next(error);
            }
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
                return res.status(429).json({ success: false, error: 'Daily limit reached', limitReached: true });
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