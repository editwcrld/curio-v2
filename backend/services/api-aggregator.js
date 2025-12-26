/**
 * CURIO BACKEND - Quote API Aggregator
 * Multi-API Quote Fetching mit automatischer Rotation
 * 
 * APIs:
 * 1. API Ninjas (primary, requires key)
 * 2. Quotable (fallback, free)
 * 3. ZenQuotes (fallback, free)
 */

const axios = require('axios');
const { QUOTE_APIS } = require('../config/constants');

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Shuffle array (for fair API distribution)
 */
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get random category from ninjas categories
 */
function getRandomCategory() {
    const categories = QUOTE_APIS.ninjas.categories;
    return categories[Math.floor(Math.random() * categories.length)];
}

// =====================================================
// API CLIENTS
// =====================================================

/**
 * Fetch quote from API Ninjas
 * @returns {Promise<object|null>}
 */
async function fetchQuoteFromNinjas() {
    try {
        if (!QUOTE_APIS.ninjas.key) {
            console.warn('API Ninjas: No API key configured');
            return null;
        }

        const category = getRandomCategory();
        
        const response = await axios.get(QUOTE_APIS.ninjas.url, {
            headers: {
                'X-Api-Key': QUOTE_APIS.ninjas.key
            },
            params: {
                category: category
            },
            timeout: 5000
        });

        if (response.data && response.data.length > 0) {
            const quote = response.data[0];
            return {
                text: quote.quote,
                author: quote.author || 'Unknown',
                source: 'api-ninjas',
                category: quote.category || category
            };
        }

        return null;
    } catch (error) {
        console.error('API Ninjas error:', error.message);
        return null;
    }
}

/**
 * Fetch quote from Quotable
 * @returns {Promise<object|null>}
 */
async function fetchQuoteFromQuotable() {
    try {
        const response = await axios.get(QUOTE_APIS.quotable.url, {
            params: {
                tags: 'wisdom|philosophy|famous-quotes'
            },
            timeout: 5000
        });

        if (response.data && response.data.content) {
            return {
                text: response.data.content,
                author: response.data.author || 'Unknown',
                source: 'quotable',
                category: response.data.tags?.[0] || 'wisdom'
            };
        }

        return null;
    } catch (error) {
        console.error('Quotable error:', error.message);
        return null;
    }
}

/**
 * Fetch quote from ZenQuotes
 * @returns {Promise<object|null>}
 */
async function fetchQuoteFromZenQuotes() {
    try {
        const response = await axios.get(QUOTE_APIS.zenquotes.url, {
            timeout: 5000
        });

        if (response.data && response.data.length > 0) {
            const quote = response.data[0];
            return {
                text: quote.q,
                author: quote.a || 'Unknown',
                source: 'zenquotes',
                category: 'wisdom'
            };
        }

        return null;
    } catch (error) {
        console.error('ZenQuotes error:', error.message);
        return null;
    }
}

// =====================================================
// MAIN AGGREGATOR
// =====================================================

/**
 * Fetch random quote with automatic API rotation
 * Tries all APIs in random order until one succeeds
 * 
 * @returns {Promise<object>} - Quote object
 * @throws {Error} - If all APIs fail
 */
async function fetchRandomQuote() {
    // Shuffle APIs for fair distribution
    const apiOrder = shuffle(['ninjas', 'quotable', 'zenquotes']);
    
    console.log('🔍 Fetching quote, API order:', apiOrder);

    // Try each API in order
    for (const apiName of apiOrder) {
        console.log(`   Trying ${apiName}...`);
        
        let quote = null;
        
        switch (apiName) {
            case 'ninjas':
                quote = await fetchQuoteFromNinjas();
                break;
            case 'quotable':
                quote = await fetchQuoteFromQuotable();
                break;
            case 'zenquotes':
                quote = await fetchQuoteFromZenQuotes();
                break;
        }

        if (quote) {
            console.log(`   ✅ Success! Got quote from ${apiName}`);
            return quote;
        }
        
        console.warn(`   ❌ ${apiName} failed, trying next...`);
    }

    // All APIs failed
    throw new Error('All quote APIs failed - no quote available');
}

/**
 * Fetch multiple quotes (for caching)
 * @param {number} count - Number of quotes to fetch
 * @returns {Promise<array>} - Array of quotes
 */
async function fetchMultipleQuotes(count = 10) {
    const quotes = [];
    
    for (let i = 0; i < count; i++) {
        try {
            const quote = await fetchRandomQuote();
            quotes.push(quote);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Failed to fetch quote ${i + 1}:`, error.message);
        }
    }
    
    return quotes;
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    fetchRandomQuote,
    fetchMultipleQuotes,
    // Individual APIs (for testing)
    fetchQuoteFromNinjas,
    fetchQuoteFromQuotable,
    fetchQuoteFromZenQuotes
};