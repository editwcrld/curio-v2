/**
 * CURIO BACKEND - Constants
 * Zentrale Konfiguration für das gesamte Backend
 */

// =====================================================
// PREMIUM CONFIGURATION
// =====================================================

/**
 * Premium Emails werden jetzt in der DB verwaltet!
 * Diese Liste ist nur als Fallback, falls DB nicht erreichbar.
 */
const PREMIUM_FALLBACK_EMAILS = [
    'editw_rld@proton.me'
];

// =====================================================
// LIMITS CONFIGURATION
// =====================================================

/**
 * Daily Navigation Limits pro User-Typ
 * Guest: 3, Registered: 10, Premium: 50
 */
const LIMITS = {
    guest: {
        art: 3,
        quotes: 3
    },
    registered: {
        art: 10,
        quotes: 10
    },
    premium: {
        art: 50,
        quotes: 50
    }
};

// =====================================================
// API CONFIGURATION
// =====================================================

/**
 * Quote APIs (Multi-API Rotation)
 */
const QUOTE_APIS = {
    ninjas: {
        url: 'https://api.api-ninjas.com/v2/randomquotes',
        key: process.env.API_NINJAS_KEY,
        categories: [
            'wisdom', 'philosophy', 'life', 'truth', 'inspirational',
            'knowledge', 'success', 'courage', 'happiness', 'art',
            'freedom', 'leadership'
        ]
    },
    quotable: {
        url: 'https://api.quotable.io/random',
        key: null  // No API key needed
    },
    zenquotes: {
        url: 'https://zenquotes.io/api/random',
        key: null  // No API key needed
    }
};

/**
 * Art API Configuration
 */
const ART_API = {
    artic: {
        url: 'https://api.artic.edu/api/v1/artworks',
        key: null,  // No API key needed
        imageBaseUrl: 'https://www.artic.edu/iiif/2'
    }
};

// =====================================================
// MISTRAL AI CONFIGURATION
// =====================================================

const MISTRAL_CONFIG = {
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-large-latest',
    maxTokens: {
        art: 500,      // ~300-400 words
        quote: 400     // ~200-300 words
    },
    temperature: 0.7
};

// =====================================================
// SCHEDULER CONFIGURATION
// =====================================================

const SCHEDULER_CONFIG = {
    dailyResetTime: '00:01',  // 00:01 CET
    timezone: 'Europe/Berlin',
    enabled: process.env.NODE_ENV === 'production'
};

// =====================================================
// CORS CONFIGURATION
// =====================================================

/**
 * Allowed Origins für CORS
 * Automatische Erkennung von Local + Production
 */
const ALLOWED_ORIGINS = [
    // Local Development
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Production (Render.com)
    'https://curio-v2-1.onrender.com',
    // Future custom domain
    'https://curio.day',
    'https://www.curio.day',
    // From ENV (backup)
    process.env.FRONTEND_URL
].filter(Boolean).map(url => url.replace(/\/$/, ''));

// =====================================================
// ERROR MESSAGES
// =====================================================

const ERROR_MESSAGES = {
    LIMIT_REACHED: 'Daily limit reached',
    UNAUTHORIZED: 'Unauthorized access',
    NOT_FOUND: 'Resource not found',
    SERVER_ERROR: 'Internal server error',
    INVALID_INPUT: 'Invalid input data',
    DB_ERROR: 'Database error'
};

// =====================================================
// SUCCESS MESSAGES
// =====================================================

const SUCCESS_MESSAGES = {
    LOGIN: 'Successfully logged in',
    LOGOUT: 'Successfully logged out',
    SIGNUP: 'Account created successfully',
    FAVORITE_ADDED: 'Added to favorites',
    FAVORITE_REMOVED: 'Removed from favorites'
};

// =====================================================
// CACHE CONFIGURATION
// =====================================================

const CACHE_CONFIG = {
    dailyContentTTL: 24 * 60 * 60,      // 24 hours in seconds
    artworkCacheTTL: 7 * 24 * 60 * 60,  // 7 days
    quoteCacheTTL: 7 * 24 * 60 * 60,    // 7 days
    maxCacheSize: 1000                  // Max items in cache
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    PREMIUM_FALLBACK_EMAILS,
    LIMITS,
    QUOTE_APIS,
    ART_API,
    MISTRAL_CONFIG,
    SCHEDULER_CONFIG,
    ALLOWED_ORIGINS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    CACHE_CONFIG
};