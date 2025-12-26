/**
 * CURIO BACKEND - Content Routes
 * Endpoints: /api/daily/art, /api/daily/quote
 * 
 * AKTUELL: Dummy Data (später durch echte APIs + DB ersetzen)
 */

const express = require('express');
const router = express.Router();

// =====================================================
// DUMMY DATA (Gleiche wie im Frontend)
// =====================================================

const DUMMY_ART = [
    {
        id: "art_1",
        title: "Sternennacht",
        artist: "Vincent van Gogh",
        year: "1889",
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
        description: "Die Sternennacht ist eines der bekanntesten Werke von Vincent van Gogh. Es zeigt die Aussicht aus seinem Fenster im Sanatorium von Saint-Rémy-de-Provence kurz vor Sonnenaufgang."
    },
    {
        id: "art_2",
        title: "Die große Welle vor Kanagawa",
        artist: "Katsushika Hokusai",
        year: "1831",
        imageUrl: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800&q=80",
        description: "Dieses ikonische japanische Holzschnittwerk zeigt eine riesige Welle, die drei Fischerboote vor der Küste Kanagawas bedroht."
    },
    {
        id: "art_3",
        title: "Mona Lisa",
        artist: "Leonardo da Vinci",
        year: "1503",
        imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80",
        description: "Die Mona Lisa ist eines der berühmtesten Gemälde der Welt. Das Porträt zeigt Lisa Gherardini mit ihrem rätselhaften Lächeln."
    }
];

const DUMMY_QUOTES = [
    {
        id: "quote_1",
        text: "In der Mitte von Schwierigkeiten liegen die Möglichkeiten.",
        author: "Albert Einstein",
        source: "Brief an einen Freund, 1940er",
        backgroundInfo: "Albert Einstein (1879-1955) war ein theoretischer Physiker, der die Relativitätstheorie entwickelte."
    },
    {
        id: "quote_2",
        text: "Die einzige Art, großartige Arbeit zu leisten, ist zu lieben, was man tut.",
        author: "Steve Jobs",
        source: "Stanford Commencement Speech, 2005",
        backgroundInfo: "Steve Jobs (1955-2011) war Mitbegründer von Apple Inc. und eine Schlüsselfigur in der Computerrevolution."
    },
    {
        id: "quote_3",
        text: "Sei du selbst die Veränderung, die du dir wünschst für diese Welt.",
        author: "Mahatma Gandhi",
        source: "Zugeschrieben, genaue Quelle unbekannt",
        backgroundInfo: "Mahatma Gandhi (1869-1948) war ein indischer Rechtsanwalt, Politiker und spiritueller Führer."
    }
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get random item from array
 */
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// =====================================================
// ROUTES
// =====================================================

/**
 * GET /api/daily/art
 * Returns daily artwork
 * 
 * TODO: 
 * - Load from DB (daily_content table)
 * - If not exists, generate new via API
 * - Cache in DB
 */
router.get('/daily/art', async (req, res) => {
    try {
        // AKTUELL: Random Dummy Data
        const art = getRandomItem(DUMMY_ART);
        
        res.json({
            success: true,
            data: art,
            cached: false,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /daily/art:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load daily art'
        });
    }
});

/**
 * GET /api/daily/quote
 * Returns daily quote
 * 
 * TODO:
 * - Load from DB (daily_content table)
 * - If not exists, generate new via API
 * - Cache in DB
 */
router.get('/daily/quote', async (req, res) => {
    try {
        // AKTUELL: Random Dummy Data
        const quote = getRandomItem(DUMMY_QUOTES);
        
        res.json({
            success: true,
            data: quote,
            cached: false,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /daily/quote:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load daily quote'
        });
    }
});

/**
 * GET /api/art/next
 * Returns next random art (for navigation)
 * 
 * TODO:
 * - Check user limits
 * - Increment limit counter
 * - Prefetch next art
 */
router.get('/art/next', async (req, res) => {
    try {
        const art = getRandomItem(DUMMY_ART);
        
        res.json({
            success: true,
            data: art,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /art/next:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load next art'
        });
    }
});

/**
 * GET /api/quote/next
 * Returns next random quote (for navigation)
 * 
 * TODO:
 * - Check user limits
 * - Increment limit counter
 * - Prefetch next quote
 */
router.get('/quote/next', async (req, res) => {
    try {
        const quote = getRandomItem(DUMMY_QUOTES);
        
        res.json({
            success: true,
            data: quote,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /quote/next:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load next quote'
        });
    }
});

// =====================================================
// EXPORTS
// =====================================================

module.exports = router;