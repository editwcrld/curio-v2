/**
 * CURIO BACKEND - Quote Cache Service
 * ✅ Caching System für Quotes in DB
 * ✅ Duplikat-Schutz
 * ✅ KEINE AI Generation hier (passiert in routes!)
 */

const { supabase } = require('../config/db');
const { fetchRandomQuote, fetchMultipleQuotes } = require('./api-aggregator');

const MIN_CACHE_SIZE = 10;
const BATCH_SIZE = 5;
const API_DELAY_MS = 2000;

// Valid ENUM values
const VALID_SOURCES = ['ninjas', 'quotable', 'zenquotes'];

function normalizeSourceApi(source) {
    if (!source) return 'zenquotes';
    const lower = source.toLowerCase();
    if (VALID_SOURCES.includes(lower)) return lower;
    if (lower.includes('ninja')) return 'ninjas';
    if (lower.includes('quotable')) return 'quotable';
    return 'zenquotes';
}

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
 * AI is handled separately in routes for better control
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
        
        const sourceApi = normalizeSourceApi(quote.sourceApi || quote.source_api || quote.source);
        
        console.log('📤 Inserting with source_api:', sourceApi);
        
        // Insert new quote (WITHOUT AI - that's done in routes!)
        const { data, error } = await supabase
            .from('quotes')
            .insert({
                text: quote.text,
                author: quote.author,
                source: quote.source || null,
                category: quote.category || 'wisdom',
                source_api: sourceApi
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
        await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`📦 Cached ${cached}/${quotes.length} quotes`);
    return cached;
}

async function getRandomCachedQuote() {
    try {
        const count = await getCacheCount();
        
        if (count === 0) {
            console.warn('⚠️ Cache empty!');
            return null;
        }
        
        const randomOffset = Math.floor(Math.random() * count);
        
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
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
        console.log(`📊 Cache: ${count}/${MIN_CACHE_SIZE} quotes`);
        
        if (count >= MIN_CACHE_SIZE) {
            console.log('✅ Cache is healthy');
            return;
        }
        
        console.log('🔄 Filling cache (5 quotes)...');
        
        const quotes = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            try {
                const quote = await fetchRandomQuote();
                if (quote) {
                    quotes.push(quote);
                    console.log(`📥 Fetched quote ${i + 1}/${BATCH_SIZE}`);
                }
                if (i < BATCH_SIZE - 1) {
                    await new Promise(r => setTimeout(r, API_DELAY_MS));
                }
            } catch (err) {
                console.error(`Error fetching quote ${i + 1}:`, err.message);
            }
        }
        
        if (quotes.length > 0) {
            await cacheMultipleQuotes(quotes);
        }
    } catch (error) {
        console.error('ensureCacheFilled error:', error);
    }
}

async function getQuote() {
    try {
        let quote = await getRandomCachedQuote();
        
        if (quote) {
            getCacheCount().then(count => {
                if (count < MIN_CACHE_SIZE) {
                    ensureCacheFilled().catch(console.error);
                }
            });
            return quote;
        }
        
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