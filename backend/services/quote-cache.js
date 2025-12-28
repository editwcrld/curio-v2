/**
 * CURIO BACKEND - Quote Cache Service
 * ✅ Reduziert: MIN_CACHE_SIZE = 2
 * ✅ Längere Delays: 3 Sekunden
 * ✅ KEINE AI Generation hier!
 * ✅ excludeIds Support für Favorites-Ausschluss
 */

const { supabase } = require('../config/db');
const { fetchRandomQuote, fetchMultipleQuotes } = require('./quotes-api');

// ✅ REDUZIERT für API Schonung
const MIN_CACHE_SIZE = 2;
const BATCH_SIZE = 2;
const API_DELAY_MS = 3000;  // 3 Sekunden

// ===== CACHE FUNCTIONS =====

async function getCacheCount() {
    try {
        const { count, error } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('getCacheCount error:', error);
        return 0;
    }
}

async function isDuplicate(text, author) {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .select('id')
            .eq('text', text)
            .eq('author', author)
            .maybeSingle();
        
        if (error) throw error;
        return data ? data : null;
    } catch (error) {
        console.error('isDuplicate error:', error);
        return null;
    }
}

/**
 * Cache quote to DB - NO AI generation here!
 */
async function cacheQuote(quote) {
    try {
        console.log('📝 Caching quote:', quote.text.substring(0, 40) + '...');
        
        // Check for duplicates
        const existing = await isDuplicate(quote.text, quote.author);
        if (existing) {
            console.log('⚠️ Quote exists, returning ID:', existing.id);
            const { data } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', existing.id)
                .single();
            return data;
        }
        
        console.log('📤 Inserting with source_api:', quote.sourceApi);
        
        // Insert WITHOUT AI
        const { data, error } = await supabase
            .from('quotes')
            .insert({
                text: quote.text,
                author: quote.author,
                source: quote.source || null,
                category: quote.category || null,
                source_api: quote.sourceApi
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Insert error:', error);
            throw error;
        }
        
        console.log('✅ Quote cached with ID:', data.id);
        return data;
    } catch (error) {
        console.error('cacheQuote error:', error);
        return null;
    }
}

async function cacheMultipleQuotes(quotes) {
    let cached = 0;
    
    for (const quote of quotes) {
        const result = await cacheQuote(quote);
        if (result) cached++;
        // ✅ Längerer Delay
        await new Promise(r => setTimeout(r, API_DELAY_MS));
    }
    
    console.log(`📦 Cached ${cached}/${quotes.length} quotes`);
    return cached;
}

/**
 * Get random quote from cache
 * @param {string[]} excludeIds - Array of quote IDs to exclude (e.g., user's favorites)
 */
async function getRandomCachedQuote(excludeIds = []) {
    try {
        // Get count of available quotes (excluding favorites)
        let countQuery = supabase.from('quotes').select('*', { count: 'exact', head: true });
        
        if (excludeIds && excludeIds.length > 0) {
            countQuery = countQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        
        const { count: availableCount, error: countError } = await countQuery;
        
        if (countError) throw countError;
        
        if (!availableCount || availableCount === 0) {
            console.warn('⚠️ Quote cache empty or all excluded!');
            return null;
        }
        
        const randomOffset = Math.floor(Math.random() * availableCount);
        
        // Fetch with exclusions
        let fetchQuery = supabase.from('quotes').select('*');
        if (excludeIds && excludeIds.length > 0) {
            fetchQuery = fetchQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        
        const { data, error } = await fetchQuery
            .range(randomOffset, randomOffset)
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('getRandomCachedQuote error:', error);
        return null;
    }
}

async function ensureCacheFilled() {
    try {
        const count = await getCacheCount();
        console.log(`📊 Quote cache: ${count}/${MIN_CACHE_SIZE} quotes`);
        
        if (count >= MIN_CACHE_SIZE) {
            console.log('✅ Quote cache is healthy');
            return;
        }
        
        console.log('🔄 Filling quote cache...');
        
        const quotes = await fetchMultipleQuotes(BATCH_SIZE);
        
        if (quotes.length > 0) {
            await cacheMultipleQuotes(quotes);
        }
    } catch (error) {
        console.error('ensureCacheFilled error:', error);
    }
}

async function getQuote(excludeIds = []) {
    try {
        let quote = await getRandomCachedQuote(excludeIds);
        
        if (quote) {
            // Background refill wenn nötig
            getCacheCount().then(count => {
                if (count < MIN_CACHE_SIZE) {
                    ensureCacheFilled().catch(console.error);
                }
            });
            return quote;
        }
        
        // Cache miss - fetch from API
        console.warn('⚠️ Cache miss, fetching from API...');
        const freshQuote = await fetchRandomQuote();
        
        const cached = await cacheQuote(freshQuote);
        ensureCacheFilled().catch(console.error);
        
        return cached || freshQuote;
    } catch (error) {
        console.error('getQuote error:', error);
        throw error;
    }
}

module.exports = {
    getQuote,
    getRandomCachedQuote,
    cacheQuote,
    cacheMultipleQuotes,
    ensureCacheFilled,
    getCacheCount,
    isDuplicate
};