/**
 * CURIO BACKEND - Art API Service
 * Art Institute of Chicago API Integration
 * 
 * ✅ ROBUST - Bessere Fehlerbehandlung
 * ✅ Fallback auf Curated List wenn API Probleme hat
 * ✅ Kein API Key nötig!
 */

const ARTIC_API = 'https://api.artic.edu/api/v1/artworks';
const ARTIC_IIIF = 'https://www.artic.edu/iiif/2';

// Search terms for variety
const SEARCH_TERMS = [
    'painting',
    'impressionism', 
    'portrait',
    'landscape',
    'renaissance',
    'baroque',
    'watercolor',
    'still life',
    'expressionism',
    'realism'
];

// Curated fallback list (bekannte gute IDs)
const CURATED_ARTWORK_IDS = [
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
];

// =====================================================
// FETCH RANDOM ARTWORK (MIT FALLBACK!)
// =====================================================

async function fetchRandomArtwork(excludeIds = []) {
    console.log('🎨 Fetching random artwork from Art Institute of Chicago...');
    
    try {
        // Strategy 1: Random search
        const artwork = await fetchFromRandomSearch(excludeIds);
        if (artwork) return artwork;
        
        console.log('⚠️ Search failed, trying curated list...');
        
        // Strategy 2: Curated list (FALLBACK)
        const curatedArtwork = await fetchFromCuratedList(excludeIds);
        if (curatedArtwork) return curatedArtwork;
        
        throw new Error('No artwork found');
    } catch (error) {
        console.error('❌ Art API error:', error.message);
        throw error;
    }
}

// =====================================================
// STRATEGY 1: Random Search
// =====================================================

async function fetchFromRandomSearch(excludeIds = []) {
    try {
        // Pick random search term
        const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
        
        // Random page (1-5, nicht zu hoch!)
        const page = Math.floor(Math.random() * 5) + 1;
        
        console.log(`🔍 Searching for "${term}" (page ${page})...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(
            `${ARTIC_API}/search?q=${encodeURIComponent(term)}&page=${page}&limit=30&fields=id,title,artist_title,date_display,image_id&query[term][is_public_domain]=true`,
            { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`⚠️ Search response not ok: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            console.warn('⚠️ No results from search');
            return null;
        }
        
        // Filter for artworks with images and not in excludeIds
        const excludeSet = new Set(excludeIds.map(String));
        const validArtworks = data.data.filter(a => 
            a.image_id && 
            !excludeSet.has(String(a.id))
        );
        
        if (validArtworks.length === 0) {
            console.warn('⚠️ No valid artworks found in search');
            return null;
        }
        
        // Pick random from results
        const art = validArtworks[Math.floor(Math.random() * validArtworks.length)];
        
        const artwork = {
            externalId: String(art.id),
            title: art.title || 'Untitled',
            artist: art.artist_title || 'Unknown Artist',
            year: art.date_display || 'Unknown',
            imageUrl: buildImageUrl(art.image_id, 843),
            imageUrlLarge: buildImageUrl(art.image_id, 1686),
            sourceApi: 'artic',
            metadata: {}
        };
        
        console.log(`✅ Got artwork: "${artwork.title}" by ${artwork.artist}`);
        return artwork;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('⚠️ Search request timed out');
        } else {
            console.error('Search error:', error.message);
        }
        return null;
    }
}

// =====================================================
// STRATEGY 2: Curated List (FALLBACK)
// =====================================================

async function fetchFromCuratedList(excludeIds = []) {
    try {
        const excludeSet = new Set(excludeIds.map(String));
        
        // Shuffle curated list
        const shuffled = [...CURATED_ARTWORK_IDS]
            .filter(id => !excludeSet.has(String(id)))
            .sort(() => Math.random() - 0.5);
        
        if (shuffled.length === 0) {
            console.warn('⚠️ All curated artworks excluded');
            return null;
        }
        
        // Try up to 3 artworks from curated list
        for (let i = 0; i < Math.min(3, shuffled.length); i++) {
            const id = shuffled[i];
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(
                    `${ARTIC_API}/${id}?fields=id,title,artist_title,date_display,image_id`,
                    { signal: controller.signal }
                );
                
                clearTimeout(timeoutId);
                
                if (!response.ok) continue;
                
                const data = await response.json();
                const art = data.data;
                
                if (!art?.image_id) continue;
                
                const artwork = {
                    externalId: String(art.id),
                    title: art.title || 'Untitled',
                    artist: art.artist_title || 'Unknown Artist',
                    year: art.date_display || 'Unknown',
                    imageUrl: buildImageUrl(art.image_id, 843),
                    imageUrlLarge: buildImageUrl(art.image_id, 1686),
                    sourceApi: 'artic',
                    metadata: {}
                };
                
                console.log(`✅ Got curated artwork: "${artwork.title}"`);
                return artwork;
            } catch (error) {
                console.warn(`⚠️ Curated artwork ${id} failed:`, error.message);
                continue;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Curated list error:', error.message);
        return null;
    }
}

// =====================================================
// FETCH MULTIPLE ARTWORKS
// =====================================================

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
// HELPERS
// =====================================================

function buildImageUrl(imageId, size = 843) {
    return `${ARTIC_IIIF}/${imageId}/full/${size},/0/default.jpg`;
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    fetchRandomArtwork,
    fetchMultipleArtworks,
    fetchFromRandomSearch,
    fetchFromCuratedList,
    buildImageUrl,
    SEARCH_TERMS,
    CURATED_ARTWORK_IDS
};