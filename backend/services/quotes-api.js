/**
 * CURIO BACKEND - Quote API Service
 * Multi-API Quote Fetching mit automatischer Rotation
 * 
 * ✅ ROBUST - Fallback Chain wenn APIs ausfallen
 * ✅ Fair Distribution durch Shuffle
 * 
 * APIs:
 * 1. API Ninjas (primary, requires key)
 * 2. FavQs (secondary, requires key)
 * 3. ZenQuotes (fallback, free, no key)
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
 * Get random item from array
 */
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
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
        const apiKey = process.env.API_NINJAS_KEY;  // ✅ Runtime read
        if (!apiKey) {
            console.warn('⚠️ API Ninjas: No API key configured');
            return null;
        }

        // Pick 1-2 random categories
        const shuffled = [...QUOTE_APIS.ninjas.categories].sort(() => Math.random() - 0.5);
        const selectedCategories = shuffled.slice(0, Math.floor(Math.random() * 2) + 1).join(',');
        
        console.log(`   📝 Ninjas: Fetching quote (categories: ${selectedCategories})...`);

        // ✅ v2/randomquotes endpoint with categories parameter
        const response = await axios.get('https://api.api-ninjas.com/v2/randomquotes', {
            headers: {
                'X-Api-Key': apiKey
            },
            params: {
                categories: selectedCategories
            },
            timeout: 5000
        });

        // v2 returns array of quotes
        if (response.data && response.data.length > 0) {
            const quote = response.data[0];
            return {
                text: quote.quote,
                author: quote.author || 'Unknown',
                source: 'api-ninjas',
                sourceApi: 'ninjas',
                category: quote.categories?.[0] || 'wisdom'
            };
        }

        return null;
    } catch (error) {
        console.error('   ❌ API Ninjas error:', error.message);
        return null;
    }
}

/**
 * Fetch quote from FavQs
 * @returns {Promise<object|null>}
 */
async function fetchQuoteFromFavQs() {
    try {
        const apiKey = process.env.FAVQS_API_KEY;  // ✅ Runtime read
        if (!apiKey) {
            console.warn('⚠️ FavQs: No API key configured');
            return null;
        }

        // Random choice: QOTD or search by tag
        const useQotd = Math.random() > 0.5;
        
        if (useQotd) {
            // Quote of the Day (no auth needed actually, but we have key)
            console.log('   📝 FavQs: Fetching Quote of the Day...');
            
            const response = await axios.get(QUOTE_APIS.favqs.qotdUrl, {
                headers: {
                    'Authorization': `Token token="${apiKey}"`  // ✅ Use runtime key
                },
                timeout: 5000
            });

            if (response.data && response.data.quote) {
                const quote = response.data.quote;
                return {
                    text: quote.body,
                    author: quote.author || 'Unknown',
                    source: 'favqs',
                    sourceApi: 'favqs',
                    category: quote.tags?.[0] || 'wisdom'
                };
            }
        } else {
            // Search by random tag
            const tag = getRandomItem(QUOTE_APIS.favqs.tags);
            const page = Math.floor(Math.random() * 5) + 1;
            
            console.log(`   📝 FavQs: Searching tag "${tag}" (page ${page})...`);

            const response = await axios.get(QUOTE_APIS.favqs.url, {
                headers: {
                    'Authorization': `Token token="${apiKey}"`  // ✅ Use runtime key
                },
                params: {
                    filter: tag,
                    type: 'tag',
                    page: page
                },
                timeout: 5000
            });

            if (response.data && response.data.quotes && response.data.quotes.length > 0) {
                // Pick random from results
                const quote = getRandomItem(response.data.quotes);
                return {
                    text: quote.body,
                    author: quote.author || 'Unknown',
                    source: 'favqs',
                    sourceApi: 'favqs',
                    category: quote.tags?.[0] || tag
                };
            }
        }

        return null;
    } catch (error) {
        console.error('   ❌ FavQs error:', error.message);
        return null;
    }
}

/**
 * Fetch quote from ZenQuotes (free fallback)
 * @returns {Promise<object|null>}
 */
async function fetchQuoteFromZenQuotes() {
    try {
        console.log('   📝 ZenQuotes: Fetching random quote...');
        
        const response = await axios.get(QUOTE_APIS.zenquotes.url, {
            timeout: 5000
        });

        if (response.data && response.data.length > 0) {
            const quote = response.data[0];
            
            // ZenQuotes returns [{ q: "quote", a: "author" }]
            return {
                text: quote.q,
                author: quote.a || 'Unknown',
                source: 'zenquotes',
                sourceApi: 'zenquotes',
                category: 'wisdom'
            };
        }

        return null;
    } catch (error) {
        console.error('   ❌ ZenQuotes error:', error.message);
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
    const apiOrder = shuffle(['ninjas', 'favqs', 'zenquotes']);
    
    console.log('📜 Fetching quote, API order:', apiOrder);

    // Try each API in order
    for (const apiName of apiOrder) {
        console.log(`   Trying ${apiName}...`);
        
        let quote = null;
        
        switch (apiName) {
            case 'ninjas':
                quote = await fetchQuoteFromNinjas();
                break;
            case 'favqs':
                quote = await fetchQuoteFromFavQs();
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
    console.log(`📜 Fetching ${count} quotes...`);
    
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
    
    console.log(`📦 Fetched ${quotes.length} quotes`);
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
    fetchQuoteFromFavQs,
    fetchQuoteFromZenQuotes
};