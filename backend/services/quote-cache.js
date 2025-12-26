/**
 * CURIO BACKEND - Quote Cache Service
 * Caching System für Quotes in DB
 * 
 * Strategy:
 * 1. Keep 10+ quotes in cache at all times
 * 2. Serve from cache when available
 * 3. Fetch from API when cache is low
 * 4. Auto-fill cache in background
 */

const { supabase } = require('../config/db');
const { fetchRandomQuote, fetchMultipleQuotes } = require('./api-aggregator');

// =====================================================
// CONSTANTS
// =====================================================

const MIN_CACHE_SIZE = 10;  // Minimum quotes in cache
const BATCH_SIZE = 20;       // Fetch this many at once

// =====================================================
// CACHE MANAGEMENT
// =====================================================

/**
 * Get count of cached quotes
 * @returns {Promise<number>}
 */
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

/**
 * Check if quote is duplicate
 * @param {string} text - Quote text
 * @param {string} author - Quote author
 * @returns {Promise<boolean>}
 */
async function isDuplicate(text, author) {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .select('id')
            .eq('text', text)
            .eq('author', author)
            .maybeSingle();
        
        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('isDuplicate error:', error);
        return false;
    }
}

/**
 * Cache single quote
 * @param {object} quote - Quote object from API
 * @returns {Promise<object|null>} - Cached quote or null
 */
async function cacheQuote(quote) {
    try {
        // Check for duplicates
        const duplicate = await isDuplicate(quote.text, quote.author);
        if (duplicate) {
            console.log('⚠️  Quote already cached, skipping');
            return null;
        }
        
        // Insert into DB
        const { data, error } = await supabase
            .from('quotes')
            .insert({
                text: quote.text,
                author: quote.author,
                source: quote.source || null,
                category: quote.category || null,
                source_api: quote.source
            })
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('✅ Quote cached:', quote.text.substring(0, 50) + '...');
        return data;
    } catch (error) {
        console.error('cacheQuote error:', error);
        return null;
    }
}

/**
 * Cache multiple quotes (batch)
 * @param {array} quotes - Array of quote objects
 * @returns {Promise<number>} - Number of quotes cached
 */
async function cacheMultipleQuotes(quotes) {
    let cached = 0;
    
    for (const quote of quotes) {
        const result = await cacheQuote(quote);
        if (result) cached++;
        
        // Small delay to avoid overwhelming DB
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`📦 Cached ${cached}/${quotes.length} quotes`);
    return cached;
}

/**
 * Get random quote from cache
 * @returns {Promise<object|null>}
 */
async function getRandomCachedQuote() {
    try {
        // Get total count
        const count = await getCacheCount();
        
        if (count === 0) {
            console.warn('⚠️  Cache is empty!');
            return null;
        }
        
        // Get random offset
        const randomOffset = Math.floor(Math.random() * count);
        
        // Fetch one quote at random offset
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .range(randomOffset, randomOffset)
            .single();
        
        if (error) throw error;
        
        console.log('✅ Serving from cache:', data.text.substring(0, 50) + '...');
        return data;
    } catch (error) {
        console.error('getRandomCachedQuote error:', error);
        return null;
    }
}

/**
 * Ensure cache has minimum quotes
 * Fills cache if below MIN_CACHE_SIZE
 * 
 * @returns {Promise<void>}
 */
async function ensureCacheFilled() {
    try {
        const count = await getCacheCount();
        console.log(`📊 Cache status: ${count}/${MIN_CACHE_SIZE} quotes`);
        
        if (count >= MIN_CACHE_SIZE) {
            console.log('✅ Cache is healthy!');
            return;
        }
        
        console.log('🔄 Cache is low, filling...');
        
        // Fetch batch of quotes
        const quotes = await fetchMultipleQuotes(BATCH_SIZE);
        
        if (quotes.length === 0) {
            console.error('❌ Failed to fetch quotes from APIs');
            return;
        }
        
        // Cache them
        await cacheMultipleQuotes(quotes);
        
        const newCount = await getCacheCount();
        console.log(`✅ Cache filled! Now has ${newCount} quotes`);
    } catch (error) {
        console.error('ensureCacheFilled error:', error);
    }
}

/**
 * Get quote with automatic cache management
 * This is the main function to use in routes!
 * 
 * @returns {Promise<object>}
 */
async function getQuote() {
    try {
        // Try to get from cache
        let quote = await getRandomCachedQuote();
        
        if (quote) {
            // Check cache size in background
            const count = await getCacheCount();
            if (count < MIN_CACHE_SIZE) {
                // Async refill (don't wait)
                ensureCacheFilled().catch(console.error);
            }
            
            return quote;
        }
        
        // Cache miss - fetch from API
        console.warn('⚠️  Cache miss, fetching from API...');
        const freshQuote = await fetchRandomQuote();
        
        // Cache it (async, don't wait)
        cacheQuote(freshQuote).catch(console.error);
        
        // Start cache fill (async)
        ensureCacheFilled().catch(console.error);
        
        return freshQuote;
    } catch (error) {
        console.error('getQuote error:', error);
        throw error;
    }
}

/**
 * Clear all cached quotes (for testing/maintenance)
 * @returns {Promise<number>} - Number of quotes deleted
 */
async function clearCache() {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (error) throw error;
        
        console.log('🗑️  Cache cleared!');
        return data?.length || 0;
    } catch (error) {
        console.error('clearCache error:', error);
        return 0;
    }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    // Main function (use this in routes!)
    getQuote,
    
    // Cache management
    getRandomCachedQuote,
    cacheQuote,
    cacheMultipleQuotes,
    ensureCacheFilled,
    getCacheCount,
    
    // Utilities
    isDuplicate,
    clearCache
};