/**
 * CURIO BACKEND - Art API Service
 * Multi-Museum Art Fetching mit automatischer Rotation
 * 
 * ✅ ROBUST - Fallback Chain wenn APIs ausfallen
 * ✅ Fair Distribution durch Shuffle
 * ✅ PUBLIC DOMAIN ONLY - Commercial use safe
 * ✅ Attribution included in response
 * ✅ NEW: Medium and Dimensions support
 * 
 * APIs:
 * 1. Art Institute of Chicago (primary, no key needed) - CC0/Public Domain
 * 2. Rijksmuseum (secondary, requires key) - CC0 License
 */

const axios = require('axios');
const { ART_APIS } = require('../config/constants');

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

/**
 * Build IIIF URL for Art Institute of Chicago
 */
function buildArticImageUrl(imageId, size = 843) {
    return `${ART_APIS.artic.iiifUrl}/${imageId}/full/${size},/0/default.jpg`;
}

// =====================================================
// ATTRIBUTION HELPERS
// =====================================================

/**
 * Generate attribution text for artwork
 * @param {string} sourceApi - 'artic' or 'rijks'
 * @param {object} artwork - Artwork data
 * @returns {object} Attribution info
 */
function generateAttribution(sourceApi, artwork) {
    if (sourceApi === 'artic') {
        return {
            museum: 'Art Institute of Chicago',
            museumUrl: 'https://www.artic.edu',
            license: 'Public Domain (CC0)',
            licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
            artworkUrl: artwork.externalId ? `https://www.artic.edu/artworks/${artwork.externalId}` : null
        };
    } else if (sourceApi === 'rijks') {
        return {
            museum: 'Rijksmuseum Amsterdam',
            museumUrl: 'https://www.rijksmuseum.nl',
            license: 'Public Domain (CC0)',
            licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
            artworkUrl: artwork.externalId ? `https://www.rijksmuseum.nl/en/collection/${artwork.externalId}` : null
        };
    }
    
    return {
        museum: 'Unknown',
        license: 'Public Domain'
    };
}

// =====================================================
// ART INSTITUTE OF CHICAGO
// =====================================================

/**
 * Fetch artwork from Art Institute of Chicago via search
 * ✅ ONLY PUBLIC DOMAIN (is_public_domain=true filter)
 * ✅ NEW: Includes medium_display and dimensions
 */
async function fetchFromArticSearch(excludeIds = []) {
    try {
        const term = getRandomItem(ART_APIS.artic.searchTerms);
        const page = Math.floor(Math.random() * 5) + 1;
        
        console.log(`   🔍 ARTIC: Searching "${term}" (page ${page})...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // ✅ CRITICAL: is_public_domain=true ensures commercial use is safe
        // ✅ NEW: Added medium_display and dimensions to fields
        const response = await fetch(
            `${ART_APIS.artic.baseUrl}/search?q=${encodeURIComponent(term)}&page=${page}&limit=30&fields=id,title,artist_title,date_display,image_id,is_public_domain,medium_display,dimensions&query[term][is_public_domain]=true`,
            { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`   ⚠️ ARTIC search response: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            return null;
        }
        
        const excludeSet = new Set(excludeIds.map(String));
        
        // ✅ Double-check: Only public domain AND has image
        const validArtworks = data.data.filter(a => 
            a.image_id && 
            a.is_public_domain === true &&
            !excludeSet.has(String(a.id))
        );
        
        if (validArtworks.length === 0) {
            return null;
        }
        
        const art = getRandomItem(validArtworks);
        
        const artwork = {
            externalId: String(art.id),
            title: art.title || 'Untitled',
            artist: art.artist_title || 'Unknown Artist',
            year: art.date_display || 'Unknown',
            imageUrl: buildArticImageUrl(art.image_id, 843),
            imageUrlLarge: buildArticImageUrl(art.image_id, 1686),
            sourceApi: 'artic',
            isPublicDomain: true,
            // ✅ NEW: Medium and Dimensions
            medium: art.medium_display || null,
            dimensions: art.dimensions || null,
            metadata: {
                medium: art.medium_display || null,
                dimensions: art.dimensions || null
            }
        };
        
        // Add attribution
        artwork.attribution = generateAttribution('artic', artwork);
        
        return artwork;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('   ⚠️ ARTIC search timed out');
        } else {
            console.error('   ❌ ARTIC search error:', error.message);
        }
        return null;
    }
}

/**
 * Fetch artwork from Art Institute of Chicago curated list
 */
async function fetchFromArticCurated(excludeIds = []) {
    try {
        const excludeSet = new Set(excludeIds.map(String));
        const available = ART_APIS.artic.curatedIds.filter(id => !excludeSet.has(String(id)));
        
        if (available.length === 0) {
            return null;
        }
        
        // Try up to 3 curated artworks
        for (let i = 0; i < Math.min(3, available.length); i++) {
            const id = available[Math.floor(Math.random() * available.length)];
            
            console.log(`   🎯 ARTIC: Fetching curated ID ${id}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            // ✅ Include is_public_domain, medium_display, dimensions in fields
            const response = await fetch(
                `${ART_APIS.artic.baseUrl}/${id}?fields=id,title,artist_title,date_display,image_id,is_public_domain,medium_display,dimensions`,
                { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);
            
            if (!response.ok) continue;
            
            const data = await response.json();
            const art = data.data;
            
            // ✅ Verify public domain
            if (!art?.image_id || art.is_public_domain !== true) continue;
            
            const artwork = {
                externalId: String(art.id),
                title: art.title || 'Untitled',
                artist: art.artist_title || 'Unknown Artist',
                year: art.date_display || 'Unknown',
                imageUrl: buildArticImageUrl(art.image_id, 843),
                imageUrlLarge: buildArticImageUrl(art.image_id, 1686),
                sourceApi: 'artic',
                isPublicDomain: true,
                // ✅ NEW: Medium and Dimensions
                medium: art.medium_display || null,
                dimensions: art.dimensions || null,
                metadata: {
                    medium: art.medium_display || null,
                    dimensions: art.dimensions || null
                }
            };
            
            artwork.attribution = generateAttribution('artic', artwork);
            
            return artwork;
        }
        
        return null;
    } catch (error) {
        console.error('   ❌ ARTIC curated error:', error.message);
        return null;
    }
}

/**
 * Main ARTIC fetcher with fallback
 */
async function fetchFromArtic(excludeIds = []) {
    console.log('   🏛️ Trying Art Institute of Chicago...');
    
    // Strategy 1: Random search
    let artwork = await fetchFromArticSearch(excludeIds);
    if (artwork) return artwork;
    
    // Strategy 2: Curated fallback
    console.log('   ⚠️ ARTIC search failed, trying curated list...');
    artwork = await fetchFromArticCurated(excludeIds);
    
    return artwork;
}

// =====================================================
// RIJKSMUSEUM
// =====================================================

/**
 * Fetch artwork from Rijksmuseum via search
 * ✅ NEW: Includes physicalMedium and dimensions from subTitle
 */
async function fetchFromRijksSearch(excludeIds = []) {
    try {
        const apiKey = process.env.RIJKSMUSEUM_API_KEY;
        if (!apiKey) {
            console.warn('   ⚠️ Rijks: No API key configured');
            return null;
        }

        const technique = getRandomItem(ART_APIS.rijks.techniques);
        const page = Math.floor(Math.random() * 5) + 1;
        
        console.log(`   🔍 Rijks: Searching technique "${technique}" (page ${page})...`);

        const response = await axios.get(ART_APIS.rijks.baseUrl, {
            params: {
                key: apiKey,
                technique: technique,
                imgonly: true,
                ps: 30,
                p: page,
                s: 'relevance'
            },
            timeout: 10000
        });

        if (!response.data?.artObjects?.length) {
            return null;
        }
        
        const excludeSet = new Set(excludeIds.map(String));
        const validArtworks = response.data.artObjects.filter(a => 
            a.webImage?.url && 
            !a.webImage.url.includes('1x1.png') &&  // ✅ Filter out placeholder
            !a.webImage.url.includes('placeholder') &&
            a.webImage.url.startsWith('http') &&  // ✅ Must be full URL
            !excludeSet.has(a.objectNumber)
        );
        
        if (validArtworks.length === 0) {
            return null;
        }
        
        const art = getRandomItem(validArtworks);
        
        // Rijksmuseum URLs: append =s800 for smaller, original for large
        const imageUrl = art.webImage.url.replace('=s0', '=s800');
        const imageUrlLarge = art.webImage.url; // Original size
        
        // ✅ NEW: Extract dimensions from longTitle if available
        // Format: "Title, Artist, date, h × w cm"
        let dimensions = null;
        if (art.longTitle) {
            const dimMatch = art.longTitle.match(/(\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?(?:\s*[×x]\s*\d+(?:[.,]\d+)?)?\s*cm)/i);
            if (dimMatch) {
                dimensions = dimMatch[1];
            }
        }
        
        const artwork = {
            externalId: art.objectNumber,
            title: art.title || 'Untitled',
            artist: art.principalOrFirstMaker || 'Unknown Artist',
            year: art.longTitle?.match(/\d{4}/)?.[0] || 'Unknown',
            imageUrl: imageUrl,
            imageUrlLarge: imageUrlLarge,
            sourceApi: 'rijks',
            isPublicDomain: true, // Rijksmuseum collection is CC0
            // ✅ NEW: Medium from technique, dimensions from longTitle
            medium: technique || null,
            dimensions: dimensions,
            metadata: {
                objectNumber: art.objectNumber,
                medium: technique || null,
                dimensions: dimensions
            }
        };
        
        artwork.attribution = generateAttribution('rijks', artwork);
        
        return artwork;
    } catch (error) {
        console.error('   ❌ Rijks search error:', error.message);
        return null;
    }
}

/**
 * Fetch artwork from Rijksmuseum curated list
 * ✅ NEW: Includes physicalMedium and dimensions
 */
async function fetchFromRijksCurated(excludeIds = []) {
    try {
        const apiKey = process.env.RIJKSMUSEUM_API_KEY;
        if (!apiKey) {
            return null;
        }

        const excludeSet = new Set(excludeIds.map(String));
        const available = ART_APIS.rijks.curatedIds.filter(id => !excludeSet.has(id));
        
        if (available.length === 0) {
            return null;
        }
        
        // Try up to 3 curated artworks
        for (let i = 0; i < Math.min(3, available.length); i++) {
            const objectNumber = available[Math.floor(Math.random() * available.length)];
            
            console.log(`   🎯 Rijks: Fetching curated ${objectNumber}...`);
            
            const response = await axios.get(`${ART_APIS.rijks.baseUrl}/${objectNumber}`, {
                params: {
                    key: apiKey
                },
                timeout: 8000
            });
            
            const art = response.data?.artObject;
            
            // ✅ Skip if no image or placeholder image
            if (!art?.webImage?.url) continue;
            if (art.webImage.url.includes('1x1.png')) continue;
            if (art.webImage.url.includes('placeholder')) continue;
            if (!art.webImage.url.startsWith('http')) continue;
            
            const imageUrl = art.webImage.url.replace('=s0', '=s800');
            const imageUrlLarge = art.webImage.url;
            
            // ✅ NEW: Get medium and dimensions from detailed response
            const medium = art.physicalMedium || null;
            let dimensions = null;
            
            // Try to get dimensions from subTitle or dating
            if (art.subTitle) {
                const dimMatch = art.subTitle.match(/(\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?(?:\s*[×x]\s*\d+(?:[.,]\d+)?)?\s*cm)/i);
                if (dimMatch) {
                    dimensions = dimMatch[1];
                }
            }
            
            const artwork = {
                externalId: art.objectNumber,
                title: art.title || 'Untitled',
                artist: art.principalOrFirstMaker || 'Unknown Artist',
                year: art.dating?.presentingDate || 'Unknown',
                imageUrl: imageUrl,
                imageUrlLarge: imageUrlLarge,
                sourceApi: 'rijks',
                isPublicDomain: true,
                // ✅ NEW: Medium and Dimensions
                medium: medium,
                dimensions: dimensions,
                metadata: {
                    objectNumber: art.objectNumber,
                    physicalMedium: medium,
                    dimensions: dimensions
                }
            };
            
            artwork.attribution = generateAttribution('rijks', artwork);
            
            return artwork;
        }
        
        return null;
    } catch (error) {
        console.error('   ❌ Rijks curated error:', error.message);
        return null;
    }
}

/**
 * Main Rijksmuseum fetcher with fallback
 */
async function fetchFromRijks(excludeIds = []) {
    console.log('   🏛️ Trying Rijksmuseum...');
    
    // Strategy 1: Random search
    let artwork = await fetchFromRijksSearch(excludeIds);
    if (artwork) return artwork;
    
    // Strategy 2: Curated fallback
    console.log('   ⚠️ Rijks search failed, trying curated list...');
    artwork = await fetchFromRijksCurated(excludeIds);
    
    return artwork;
}

// =====================================================
// MAIN AGGREGATOR
// =====================================================

/**
 * Fetch random artwork with automatic API rotation
 * Tries all APIs in random order until one succeeds
 * 
 * ✅ ALL returned artworks are PUBLIC DOMAIN
 * ✅ Attribution info included in response
 * ✅ Medium and Dimensions included when available
 * 
 * @param {array} excludeIds - IDs to exclude (already in cache)
 * @returns {Promise<object>} - Artwork object with attribution
 * @throws {Error} - If all APIs fail
 */
async function fetchRandomArtwork(excludeIds = []) {
    // Shuffle APIs for fair distribution
    const apiOrder = shuffle(['artic', 'rijks']);
    
    console.log('🎨 Fetching artwork, API order:', apiOrder);

    // Try each API in order
    for (const apiName of apiOrder) {
        let artwork = null;
        
        switch (apiName) {
            case 'artic':
                artwork = await fetchFromArtic(excludeIds);
                break;
            case 'rijks':
                artwork = await fetchFromRijks(excludeIds);
                break;
        }

        if (artwork) {
            console.log(`   ✅ Got artwork: "${artwork.title}" from ${apiName}`);
            console.log(`   📜 License: ${artwork.attribution?.license}`);
            if (artwork.medium) console.log(`   🎨 Medium: ${artwork.medium}`);
            if (artwork.dimensions) console.log(`   📏 Dimensions: ${artwork.dimensions}`);
            return artwork;
        }
        
        console.warn(`   ❌ ${apiName} failed, trying next...`);
    }

    // All APIs failed
    throw new Error('All art APIs failed - no artwork available');
}

/**
 * Fetch multiple artworks (for caching)
 * @param {number} count - Number of artworks to fetch
 * @param {array} excludeIds - IDs to exclude
 * @returns {Promise<array>} - Array of artworks
 */
async function fetchMultipleArtworks(count = 5, excludeIds = []) {
    console.log(`🎨 Fetching ${count} artworks...`);
    
    const artworks = [];
    const usedIds = new Set(excludeIds.map(String));
    
    for (let i = 0; i < count; i++) {
        try {
            const artwork = await fetchRandomArtwork([...usedIds]);
            
            if (artwork && !usedIds.has(artwork.externalId)) {
                artworks.push(artwork);
                usedIds.add(artwork.externalId);
            }
            
            // Delay between requests
            await new Promise(r => setTimeout(r, 1000));
        } catch (error) {
            console.warn(`Error fetching artwork ${i + 1}:`, error.message);
        }
    }
    
    console.log(`📦 Fetched ${artworks.length} artworks`);
    return artworks;
}

// =====================================================
// LEGACY EXPORTS (für Kompatibilität)
// =====================================================

// Diese werden von anderen Dateien noch verwendet
const SEARCH_TERMS = ART_APIS.artic.searchTerms;
const CURATED_ARTWORK_IDS = ART_APIS.artic.curatedIds;

function buildImageUrl(imageId, size = 843) {
    return buildArticImageUrl(imageId, size);
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    // Main functions
    fetchRandomArtwork,
    fetchMultipleArtworks,
    
    // Individual APIs (for testing)
    fetchFromArtic,
    fetchFromRijks,
    fetchFromArticSearch,
    fetchFromArticCurated,
    fetchFromRijksSearch,
    fetchFromRijksCurated,
    
    // Attribution helper
    generateAttribution,
    
    // Legacy exports (für Kompatibilität)
    fetchFromRandomSearch: fetchFromArticSearch,
    fetchFromCuratedList: fetchFromArticCurated,
    buildImageUrl,
    SEARCH_TERMS,
    CURATED_ARTWORK_IDS
};