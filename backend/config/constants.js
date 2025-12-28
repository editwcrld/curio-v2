/**
 * CURIO BACKEND - Central Configuration
 * Alle Konstanten und Konfigurationen an einem Ort
 * 
 * ✅ UPDATED: ZenQuotes removed for commercial compliance
 * ✅ UPDATED: API Ninjas v2 endpoint
 */

// =====================================================
// PREMIUM FALLBACK (für Testing ohne Payment)
// =====================================================

const PREMIUM_FALLBACK_EMAILS = [
    // Hier können Test-Emails eingetragen werden
    // die automatisch als Premium gelten
];

// =====================================================
// USER LIMITS
// =====================================================

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
// QUOTE APIs
// =====================================================

const QUOTE_APIS = {
    ninjas: {
        // ✅ v2 API - siehe https://api-ninjas.com/api/randomquotes
        url: 'https://api.api-ninjas.com/v2/randomquotes',
        // key loaded at runtime from process.env.API_NINJAS_KEY
        categories: [
            'inspirational', 'wisdom', 'happiness', 'success',
            'life', 'love', 'motivational', 'philosophy',
            'knowledge', 'courage', 'hope', 'faith'
        ]
    },
    favqs: {
        url: 'https://favqs.com/api/quotes',
        qotdUrl: 'https://favqs.com/api/qotd',
        // key loaded at runtime from process.env.FAVQS_API_KEY
        tags: [
            'wisdom', 'life', 'inspirational', 'philosophy',
            'motivational', 'success', 'happiness', 'love'
        ]
    }
    
    // ⚠️ ZENQUOTES REMOVED - Non-commercial use only!
    // Their Terms of Service state:
    // "Material on this website is made available solely for 
    //  your personal, non-commercial use"
    // 
    // DO NOT re-add this API for commercial projects!
    // 
    // zenquotes: {
    //     url: 'https://zenquotes.io/api/random'
    // }
};

// =====================================================
// ART APIs
// =====================================================

const ART_APIS = {
    artic: {
        baseUrl: 'https://api.artic.edu/api/v1/artworks',
        iiifUrl: 'https://www.artic.edu/iiif/2',
        searchTerms: [
            'painting', 'impressionism', 'portrait', 'landscape',
            'renaissance', 'baroque', 'watercolor', 'still life',
            'expressionism', 'realism'
        ],
        curatedIds: [
            27992,  // A Sunday on La Grande Jatte - Seurat
            28560,  // The Bedroom - Van Gogh
            14598,  // The Old Guitarist - Picasso
            6565,   // America Windows - Chagall
            111628, // Nighthawks - Hopper
            24306,  // The Bath - Cassatt
            20684,  // Water Lily Pond - Monet
            81512,  // American Gothic - Wood
            16568,  // Paris Street; Rainy Day - Caillebotte
            64818,  // The Child's Bath - Cassatt
            87479,  // Sky Above Clouds IV - O'Keeffe
            76571,  // Two Sisters (On the Terrace) - Renoir
            59847,  // Bathers by a River - Matisse
            16487,  // The Herring Net - Homer
            14655,  // Mother and Child - Picasso
            109439, // Stacks of Wheat - Monet
            83642,  // The Bay - Frankenthaler
            100472, // The Old Fishing Boat
            129884, // Fishing Boats
            102611, // Landscape
        ]
    },
    rijks: {
        baseUrl: 'https://www.rijksmuseum.nl/api/en/collection',
        // key loaded at runtime from process.env.RIJKSMUSEUM_API_KEY
        searchTerms: [
            'painting', 'Rembrandt', 'Vermeer', 'landscape',
            'portrait', 'still life', 'golden age', 'Dutch masters'
        ],
        curatedIds: [
            'SK-C-5',      // De Nachtwacht - Rembrandt
            'SK-A-1595',   // Zelfportret - Rembrandt
            'SK-A-2344',   // Het Melkmeisje - Vermeer
            'SK-C-216',    // Het Joodse Bruidje - Rembrandt
            'SK-A-4',      // Winterlandschap - Avercamp
            'SK-A-180',    // Stilleven met bloemen - De Heem
            'SK-A-2860',   // De Bedreigde Zwaan - Asselijn
            'SK-A-4691',   // Self-portrait - Van Gogh
            'SK-A-1935',   // De Staalmeesters - Rembrandt
        ]
    }
};

// Legacy export (für Kompatibilität mit altem Code)
const ART_API = {
    url: ART_APIS.artic.baseUrl,
    iiif: ART_APIS.artic.iiifUrl
};

// =====================================================
// MISTRAL AI
// =====================================================

const MISTRAL_CONFIG = {
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest',
    maxTokens: 300,
    temperature: 0.7
};

// =====================================================
// SCHEDULER
// =====================================================

const SCHEDULER_CONFIG = {
    dailyTasksCron: '1 0 * * *',  // 00:01 CET
    timezone: 'Europe/Berlin'
};

// =====================================================
// CORS
// =====================================================

const ALLOWED_ORIGINS = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://curio-v2-1.onrender.com',
    'https://curio.day',
    'https://www.curio.day'
];

// =====================================================
// MESSAGES
// =====================================================

const ERROR_MESSAGES = {
    unauthorized: 'Authentication required',
    forbidden: 'Access denied',
    notFound: 'Resource not found',
    limitReached: 'Daily limit reached',
    serverError: 'Internal server error',
    invalidEmail: 'Invalid email format',
    passwordTooShort: 'Password must be at least 6 characters',
    userExists: 'User already exists',
    invalidCredentials: 'Invalid credentials'
};

const SUCCESS_MESSAGES = {
    loggedIn: 'Successfully logged in',
    loggedOut: 'Successfully logged out',
    registered: 'Successfully registered',
    favoriteAdded: 'Added to favorites',
    favoriteRemoved: 'Removed from favorites'
};

// =====================================================
// CACHE CONFIG
// =====================================================

const CACHE_CONFIG = {
    minCacheSize: 2,
    batchSize: 2,
    apiDelay: 3000  // ms between API calls
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    PREMIUM_FALLBACK_EMAILS,
    LIMITS,
    QUOTE_APIS,
    ART_APIS,
    ART_API,  // Legacy
    MISTRAL_CONFIG,
    SCHEDULER_CONFIG,
    ALLOWED_ORIGINS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    CACHE_CONFIG
};