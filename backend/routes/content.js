/**
 * CURIO BACKEND - Content Routes
 * ✅ /daily/today = Tages-Content (ALLE User sehen dasselbe!)
 * ✅ /daily/art, /daily/quote = Random aus Cache
 * ✅ /art/fresh, /quote/fresh = Sofort aus Cache
 * ✅ /art/fresh?prefetch=true = Frisch von API + AI (für Prefetch)
 * ✅ Favorites werden ausgeschlossen!
 */

const express = require('express');
const router = express.Router();

const { optionalAuth, getUserType } = require('../middleware/auth');
const { incrementLimit, getUserLimits } = require('../config/supabase');
const { supabase } = require('../config/db');
const { LIMITS } = require('../config/constants');

// Services
const { getQuote, cacheQuote, getRandomCachedQuote } = require('../services/quote-cache');
const { fetchRandomQuote } = require('../services/quotes-api');
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
// HELPER: Get User's Favorite IDs
// =====================================================

async function getUserFavoriteIds(userId, type) {
    if (!userId) return [];
    
    try {
        const column = type === 'art' ? 'artwork_id' : 'quote_id';
        
        const { data, error } = await supabase
            .from('favorites')
            .select(column)
            .eq('user_id', userId)
            .not(column, 'is', null);
        
        if (error) throw error;
        
        return data ? data.map(f => f[column]) : [];
    } catch (error) {
        console.error('getUserFavoriteIds error:', error);
        return [];
    }
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

function getAttribution(sourceApi) {
    const attributions = {
        'artic': {
            text: 'Image courtesy of the Art Institute of Chicago',
            url: 'https://www.artic.edu',
            license: 'CC0 Public Domain'
        },
        'rijks': {
            text: 'Image courtesy of the Rijksmuseum',
            url: 'https://www.rijksmuseum.nl',
            license: 'CC0 Public Domain'
        }
    };
    return attributions[sourceApi] || null;
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
        metadata: art.metadata || {},
        source_api: art.source_api || null,
        external_id: art.external_id || null,
        attribution: getAttribution(art.source_api),
        medium: art.medium || null,
        dimensions: art.dimensions || null
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
        
        // Get user's favorite quote IDs to exclude
        const excludeIds = req.user ? await getUserFavoriteIds(req.user.id, 'quote') : [];
        
        let quote = await getRandomCachedQuote(excludeIds);
        
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
 * GET /api/quote/fresh - Quote Content (WITH LIMITS)
 * 
 * Without ?prefetch=true:
 *   → Instant from DB Cache (for immediate display)
 * 
 * With ?prefetch=true:
 *   → Fresh from API + AI (for prefetching next content)
 *   → User will see this on NEXT "Next" click
 */
router.get('/quote/fresh', optionalAuth, async (req, res, next) => {
    try {
        const isPrefetch = req.query.prefetch === 'true';
        
        // Check limits for logged-in users
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
        
        // Get user's favorite IDs to exclude
        const excludeIds = req.user ? await getUserFavoriteIds(req.user.id, 'quote') : [];
        
        // =====================================================
        // PREFETCH MODE: Fetch fresh from API + generate AI
        // =====================================================
        if (isPrefetch) {
            console.log('📥 Quote PREFETCH request (fresh from API)...');
            
            try {
                const freshQuote = await fetchRandomQuote();
                const cachedQuote = await cacheQuote(freshQuote);
                
                if (cachedQuote) {
                    // Check if it's a favorite (shouldn't happen but safety check)
                    if (excludeIds.includes(cachedQuote.id)) {
                        console.log('⚠️ Prefetched quote is favorite, fetching another...');
                        const anotherQuote = await fetchRandomQuote();
                        const anotherCached = await cacheQuote(anotherQuote);
                        
                        if (anotherCached) {
                            const ai = await ensureQuoteAI(anotherCached.id, {
                                text: anotherCached.text,
                                author: anotherCached.author
                            });
                            
                            return res.json({
                                success: true,
                                data: formatQuoteResponse(anotherCached, ai),
                                cached: false,
                                source: 'prefetch-fresh'
                            });
                        }
                    }
                    
                    // Generate AI for the fresh quote
                    const ai = await ensureQuoteAI(cachedQuote.id, {
                        text: cachedQuote.text,
                        author: cachedQuote.author
                    });
                    
                    return res.json({
                        success: true,
                        data: formatQuoteResponse(cachedQuote, ai),
                        cached: false,
                        source: 'prefetch-fresh'
                    });
                }
            } catch (apiError) {
                console.warn('⚠️ Prefetch API failed, falling back to cache:', apiError.message);
            }
            
            // Fallback: Return from cache if API fails
            const fallbackQuote = await getRandomCachedQuote(excludeIds);
            if (fallbackQuote) {
                return res.json({
                    success: true,
                    data: formatQuoteResponse(fallbackQuote),
                    cached: true,
                    source: 'prefetch-fallback'
                });
            }
            
            throw new Error('No quotes available');
        }
        
        // =====================================================
        // NORMAL MODE: Instant from DB Cache
        // =====================================================
        console.log('📥 Quote fresh request (from cache)...');
        if (excludeIds.length > 0) {
            console.log(`   Excluding ${excludeIds.length} favorite quotes`);
        }
        
        const cachedQuote = await getRandomCachedQuote(excludeIds);
        
        if (!cachedQuote) {
            // Edge case: Empty cache - must fetch synchronously
            console.log('⚠️ Cache empty, fetching synchronously...');
            const freshQuote = await fetchRandomQuote();
            const newQuote = await cacheQuote(freshQuote);
            const ai = await ensureQuoteAI(newQuote.id, { 
                text: newQuote.text, 
                author: newQuote.author 
            });
            
            return res.json({
                success: true,
                data: formatQuoteResponse(newQuote, ai),
                cached: false,
                source: 'fresh-sync'
            });
        }
        
        // Return cached quote immediately
        res.json({
            success: true,
            data: formatQuoteResponse(cachedQuote),
            cached: true,
            source: 'cache-instant'
        });
        
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
        
        // Get user's favorite art IDs to exclude
        const excludeIds = req.user ? await getUserFavoriteIds(req.user.id, 'art') : [];
        
        let art = await getRandomCachedArt(excludeIds);
        
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
 * GET /api/art/fresh - Art Content (WITH LIMITS)
 * 
 * Without ?prefetch=true:
 *   → Instant from DB Cache (for immediate display)
 * 
 * With ?prefetch=true:
 *   → Fresh from API + AI (for prefetching next content)
 *   → User will see this on NEXT "Next" click
 */
router.get('/art/fresh', optionalAuth, async (req, res, next) => {
    try {
        const isPrefetch = req.query.prefetch === 'true';
        
        // Check limits for logged-in users
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
        
        // Get user's favorite IDs to exclude
        const excludeIds = req.user ? await getUserFavoriteIds(req.user.id, 'art') : [];
        
        // =====================================================
        // PREFETCH MODE: Fetch fresh from API + generate AI
        // =====================================================
        if (isPrefetch) {
            console.log('🎨 Art PREFETCH request (fresh from API)...');
            
            try {
                const freshArt = await fetchRandomArtwork();
                const cachedArt = await cacheArt(freshArt);
                
                if (cachedArt) {
                    // Check if it's a favorite (shouldn't happen but safety check)
                    if (excludeIds.includes(cachedArt.id)) {
                        console.log('⚠️ Prefetched art is favorite, fetching another...');
                        const anotherArt = await fetchRandomArtwork();
                        const anotherCached = await cacheArt(anotherArt);
                        
                        if (anotherCached) {
                            const ai = await ensureArtAI(anotherCached.id, {
                                title: anotherCached.title,
                                artist: anotherCached.artist,
                                year: anotherCached.year
                            });
                            
                            return res.json({
                                success: true,
                                data: formatArtResponse(anotherCached, ai),
                                cached: false,
                                source: 'prefetch-fresh'
                            });
                        }
                    }
                    
                    // Generate AI for the fresh art
                    const ai = await ensureArtAI(cachedArt.id, {
                        title: cachedArt.title,
                        artist: cachedArt.artist,
                        year: cachedArt.year
                    });
                    
                    return res.json({
                        success: true,
                        data: formatArtResponse(cachedArt, ai),
                        cached: false,
                        source: 'prefetch-fresh'
                    });
                }
            } catch (apiError) {
                console.warn('⚠️ Prefetch API failed, falling back to cache:', apiError.message);
            }
            
            // Fallback: Return from cache if API fails
            const fallbackArt = await getRandomCachedArt(excludeIds);
            if (fallbackArt) {
                return res.json({
                    success: true,
                    data: formatArtResponse(fallbackArt),
                    cached: true,
                    source: 'prefetch-fallback'
                });
            }
            
            throw new Error('No artworks available');
        }
        
        // =====================================================
        // NORMAL MODE: Instant from DB Cache
        // =====================================================
        console.log('🎨 Art fresh request (from cache)...');
        if (excludeIds.length > 0) {
            console.log(`   Excluding ${excludeIds.length} favorite artworks`);
        }
        
        const cachedArt = await getRandomCachedArt(excludeIds);
        
        if (!cachedArt) {
            // Edge case: Empty cache - must fetch synchronously
            console.log('⚠️ Art cache empty, fetching synchronously...');
            const freshArt = await fetchRandomArtwork();
            const newArt = await cacheArt(freshArt);
            const ai = await ensureArtAI(newArt.id, { 
                title: newArt.title, 
                artist: newArt.artist, 
                year: newArt.year 
            });
            
            return res.json({
                success: true,
                data: formatArtResponse(newArt, ai),
                cached: false,
                source: 'fresh-sync'
            });
        }
        
        // Return cached art immediately
        res.json({
            success: true,
            data: formatArtResponse(cachedArt),
            cached: true,
            source: 'cache-instant'
        });
        
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