/**
 * CURIO BACKEND - Content Routes
 * ✅ /daily/today = Tages-Content (ALLE User sehen dasselbe!)
 * ✅ /daily/art, /daily/quote = Random aus Cache
 * ✅ /art/fresh, /quote/fresh = Frisch + Limits
 */

const express = require('express');
const router = express.Router();

const { optionalAuth, getUserType } = require('../middleware/auth');
const { incrementLimit, getUserLimits } = require('../config/supabase');
const { supabase } = require('../config/db');
const { LIMITS } = require('../config/constants');

// Services
const { getQuote, cacheQuote, getRandomCachedQuote } = require('../services/quote-cache');
const { fetchRandomQuote } = require('../services/api-aggregator');
const { getArt, cacheArt, getRandomCachedArt } = require('../services/art-cache');
const { fetchRandomArtwork } = require('../services/art-api');
const { getDailyContent } = require('../services/daily-content');

// AI Service
let generateQuoteDescription = null;
let generateArtDescription = null;
try {
    const mistral = require('../services/mistral-ai');
    generateQuoteDescription = mistral.generateQuoteDescription;
    generateArtDescription = mistral.generateArtDescription;
    console.log('✅ Mistral AI available');
} catch (e) {
    console.warn('⚠️ Mistral AI not available');
}

// =====================================================
// HELPER: Check Limits (NUR für /fresh!)
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
// HELPER: Ensure AI Description
// =====================================================

async function ensureQuoteAI(quoteId, quoteData) {
    const { data: existing } = await supabase
        .from('quotes')
        .select('ai_description_de, ai_description_en')
        .eq('id', quoteId)
        .single();
    
    if (existing?.ai_description_de && existing?.ai_description_en) {
        return existing;
    }
    
    if (!generateQuoteDescription || !process.env.MISTRAL_API_KEY) {
        return { ai_description_de: null, ai_description_en: null };
    }
    
    console.log(`🤖 Generating AI for quote ${quoteId}...`);
    
    try {
        const descriptions = await generateQuoteDescription(quoteData);
        
        await supabase
            .from('quotes')
            .update({
                ai_description_de: descriptions.de,
                ai_description_en: descriptions.en
            })
            .eq('id', quoteId);
        
        console.log(`✅ AI saved for quote ${quoteId}`);
        return { ai_description_de: descriptions.de, ai_description_en: descriptions.en };
    } catch (error) {
        console.error(`❌ Quote AI failed:`, error.message);
        return { ai_description_de: null, ai_description_en: null };
    }
}

async function ensureArtAI(artId, artData) {
    const { data: existing } = await supabase
        .from('artworks')
        .select('ai_description_de, ai_description_en')
        .eq('id', artId)
        .single();
    
    if (existing?.ai_description_de && existing?.ai_description_en) {
        return existing;
    }
    
    if (!generateArtDescription || !process.env.MISTRAL_API_KEY) {
        return { ai_description_de: null, ai_description_en: null };
    }
    
    console.log(`🤖 Generating AI for artwork ${artId}...`);
    
    try {
        const descriptions = await generateArtDescription(artData);
        
        await supabase
            .from('artworks')
            .update({
                ai_description_de: descriptions.de,
                ai_description_en: descriptions.en
            })
            .eq('id', artId);
        
        console.log(`✅ AI saved for artwork ${artId}`);
        return { ai_description_de: descriptions.de, ai_description_en: descriptions.en };
    } catch (error) {
        console.error(`❌ Art AI failed:`, error.message);
        return { ai_description_de: null, ai_description_en: null };
    }
}

// =====================================================
// FORMAT RESPONSE HELPERS
// =====================================================

function formatQuoteResponse(quote, ai = {}) {
    return {
        id: quote.id,
        text: quote.text,
        author: quote.author,
        source: quote.source || 'Unknown',
        category: quote.category,
        ai_description_de: ai.ai_description_de || quote.ai_description_de || null,
        ai_description_en: ai.ai_description_en || quote.ai_description_en || null,
        backgroundInfo: ai.ai_description_de || ai.ai_description_en || quote.ai_description_de || null
    };
}

function formatArtResponse(art, ai = {}) {
    return {
        id: art.id,
        title: art.title,
        artist: art.artist,
        year: art.year,
        imageUrl: art.image_url || art.imageUrl,
        ai_description_de: ai.ai_description_de || art.ai_description_de || null,
        ai_description_en: ai.ai_description_en || art.ai_description_en || null,
        backgroundInfo: ai.ai_description_de || ai.ai_description_en || art.ai_description_de || null,
        metadata: art.metadata || {}
    };
}

// =====================================================
// DAILY TODAY - ALLE User sehen dasselbe!
// =====================================================

/**
 * GET /api/daily/today - Tages-Content für ALLE
 * Gibt das fixierte Art + Quote für heute zurück
 */
router.get('/daily/today', optionalAuth, async (req, res, next) => {
    try {
        console.log('📅 Loading daily content for today...');
        
        const dailyContent = await getDailyContent();
        
        res.json({
            success: true,
            data: {
                date: dailyContent.date,
                art: formatArtResponse(dailyContent.art),
                quote: formatQuoteResponse(dailyContent.quote)
            },
            source: 'daily'
        });
    } catch (error) {
        console.error('❌ Failed to get daily content:', error);
        next(error);
    }
});

// =====================================================
// QUOTE ROUTES
// =====================================================

/**
 * GET /api/daily/quote - Random aus Cache + AI (NO LIMITS)
 */
router.get('/daily/quote', optionalAuth, async (req, res, next) => {
    try {
        console.log('📥 Loading daily quote...');
        
        let quote = await getRandomCachedQuote();
        
        if (!quote) {
            console.log('⚠️ Cache empty, fetching fresh...');
            const freshQuote = await fetchRandomQuote();
            quote = await cacheQuote(freshQuote);
        }
        
        const ai = await ensureQuoteAI(quote.id, { text: quote.text, author: quote.author });
        
        res.json({
            success: true,
            data: formatQuoteResponse(quote, ai),
            cached: true,
            source: 'daily'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/quote/fresh - Fresh + AI (WITH LIMITS)
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
        
        console.log('📥 Fetching fresh quote...');
        const freshQuote = await fetchRandomQuote();
        const cachedQuote = await cacheQuote(freshQuote);
        
        if (cachedQuote) {
            const ai = await ensureQuoteAI(cachedQuote.id, { 
                text: cachedQuote.text, 
                author: cachedQuote.author 
            });
            
            res.json({
                success: true,
                data: formatQuoteResponse(cachedQuote, ai),
                cached: false,
                source: 'fresh'
            });
        } else {
            const existingQuote = await getRandomCachedQuote();
            if (existingQuote) {
                const ai = await ensureQuoteAI(existingQuote.id, { 
                    text: existingQuote.text, 
                    author: existingQuote.author 
                });
                res.json({
                    success: true,
                    data: formatQuoteResponse(existingQuote, ai),
                    cached: true,
                    source: 'fallback'
                });
            } else {
                throw new Error('No quotes available');
            }
        }
    } catch (error) {
        next(error);
    }
});

router.get('/quote/next', optionalAuth, (req, res, next) => {
    req.url = '/quote/fresh';
    router.handle(req, res, next);
});

// =====================================================
// ART ROUTES
// =====================================================

/**
 * GET /api/daily/art - Random aus Cache + AI (NO LIMITS)
 */
router.get('/daily/art', optionalAuth, async (req, res, next) => {
    try {
        console.log('🎨 Loading daily art...');
        
        let art = await getRandomCachedArt();
        
        if (!art) {
            console.log('⚠️ Art cache empty, fetching fresh...');
            const freshArt = await fetchRandomArtwork();
            art = await cacheArt(freshArt);
        }
        
        const ai = await ensureArtAI(art.id, { 
            title: art.title, 
            artist: art.artist, 
            year: art.year 
        });
        
        res.json({
            success: true,
            data: formatArtResponse(art, ai),
            cached: true,
            source: 'daily'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/art/fresh - Fresh + AI (WITH LIMITS)
 */
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
        
        console.log('🎨 Fetching fresh artwork...');
        const freshArt = await fetchRandomArtwork();
        const cachedArt = await cacheArt(freshArt);
        
        if (cachedArt) {
            const ai = await ensureArtAI(cachedArt.id, { 
                title: cachedArt.title, 
                artist: cachedArt.artist, 
                year: cachedArt.year 
            });
            
            res.json({
                success: true,
                data: formatArtResponse(cachedArt, ai),
                cached: false,
                source: 'fresh'
            });
        } else {
            const existingArt = await getRandomCachedArt();
            if (existingArt) {
                const ai = await ensureArtAI(existingArt.id, { 
                    title: existingArt.title, 
                    artist: existingArt.artist, 
                    year: existingArt.year 
                });
                res.json({
                    success: true,
                    data: formatArtResponse(existingArt, ai),
                    cached: true,
                    source: 'fallback'
                });
            } else {
                throw new Error('No artworks available');
            }
        }
    } catch (error) {
        next(error);
    }
});

router.get('/art/next', optionalAuth, (req, res, next) => {
    req.url = '/art/fresh';
    router.handle(req, res, next);
});

// =====================================================
// ADMIN: Manual trigger for daily tasks
// =====================================================

router.post('/admin/trigger-daily', async (req, res, next) => {
    try {
        // Simple auth check (could be improved)
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        
        const { triggerDailyTasks } = require('../services/scheduler');
        const result = await triggerDailyTasks();
        
        res.json({
            success: result,
            message: result ? 'Daily tasks completed' : 'Daily tasks failed'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;