/**
 * CURIO BACKEND - Art API Service
 * Art Institute of Chicago API Integration
 * 
 * ✅ Kein API Key nötig!
 * ✅ Hochwertige Public Domain Kunstwerke
 * ✅ IIIF Image URLs
 */

const ARTIC_API = 'https://api.artic.edu/api/v1/artworks';
const ARTIC_IIIF = 'https://www.artic.edu/iiif/2';

// Curated list of high-quality artwork IDs (famous paintings)
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
    80607,  // A Sunday Afternoon on the Island of La Grande Jatte - Seurat
    64818,  // The Child's Bath - Cassatt
    87479,  // Sky Above Clouds IV - O'Keeffe
    76571,  // Two Sisters (On the Terrace) - Renoir
    59847,  // Bathers by a River - Matisse
    16487,  // The Herring Net - Homer
    27281,  // The Assumption of the Virgin - El Greco
    14655,  // Mother and Child - Picasso
    109439, // Stacks of Wheat - Monet
    52679,  // Landscape with the Fall of Icarus - attributed to Bruegel
    83642,  // The Bay - Frankenthaler
];

// =====================================================
// FETCH RANDOM ARTWORK
// =====================================================

async function fetchRandomArtwork() {
    console.log('🎨 Fetching random artwork from Art Institute of Chicago...');
    
    try {
        // Strategy 1: Get from curated list
        const artwork = await fetchFromCuratedList();
        if (artwork) return artwork;
        
        // Strategy 2: Search for random painting
        const searchArtwork = await fetchFromSearch();
        if (searchArtwork) return searchArtwork;
        
        throw new Error('No artwork found');
    } catch (error) {
        console.error('❌ Art API error:', error.message);
        throw error;
    }
}

// =====================================================
// STRATEGY 1: Curated List (Best Quality)
// =====================================================

async function fetchFromCuratedList() {
    try {
        // Pick random ID from curated list
        const randomId = CURATED_ARTWORK_IDS[Math.floor(Math.random() * CURATED_ARTWORK_IDS.length)];
        
        const response = await fetch(
            `${ARTIC_API}/${randomId}?fields=id,title,artist_title,date_display,image_id,thumbnail,description,medium_display,dimensions,place_of_origin`,
            { timeout: 10000 }
        );
        
        if (!response.ok) {
            console.warn(`⚠️ Curated artwork ${randomId} not found`);
            return null;
        }
        
        const data = await response.json();
        const art = data.data;
        
        if (!art || !art.image_id) {
            console.warn('⚠️ Artwork has no image');
            return null;
        }
        
        const artwork = {
            externalId: String(art.id),
            title: art.title || 'Untitled',
            artist: art.artist_title || 'Unknown Artist',
            year: art.date_display || 'Unknown',
            imageUrl: buildImageUrl(art.image_id, 843),
            imageUrlLarge: buildImageUrl(art.image_id, 1686),
            sourceApi: 'artic',
            metadata: {
                medium: art.medium_display,
                dimensions: art.dimensions,
                origin: art.place_of_origin,
                description: art.description
            }
        };
        
        console.log(`✅ Got artwork: "${artwork.title}" by ${artwork.artist}`);
        return artwork;
    } catch (error) {
        console.error('Curated list error:', error.message);
        return null;
    }
}

// =====================================================
// STRATEGY 2: Search (Fallback)
// =====================================================

async function fetchFromSearch() {
    try {
        const searchTerms = ['painting', 'impressionism', 'portrait', 'landscape', 'modern art'];
        const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        const response = await fetch(
            `${ARTIC_API}/search?q=${term}&limit=20&fields=id,title,artist_title,date_display,image_id&query[term][is_public_domain]=true`,
            { timeout: 10000 }
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        
        // Filter for artworks with images
        const withImages = data.data.filter(a => a.image_id);
        
        if (withImages.length === 0) {
            console.warn('⚠️ No artworks with images found');
            return null;
        }
        
        // Pick random
        const art = withImages[Math.floor(Math.random() * withImages.length)];
        
        const artwork = {
            externalId: String(art.id),
            title: art.title || 'Untitled',
            artist: art.artist_title || 'Unknown Artist',
            year: art.date_display || 'Unknown',
            imageUrl: buildImageUrl(art.image_id, 843),
            imageUrlLarge: buildImageUrl(art.image_id, 1686),
            sourceApi: 'artic'
        };
        
        console.log(`✅ Got artwork from search: "${artwork.title}"`);
        return artwork;
    } catch (error) {
        console.error('Search error:', error.message);
        return null;
    }
}

// =====================================================
// FETCH MULTIPLE ARTWORKS (for cache filling)
// =====================================================

async function fetchMultipleArtworks(count = 5) {
    console.log(`🎨 Fetching ${count} artworks...`);
    
    const artworks = [];
    const usedIds = new Set();
    
    // Shuffle curated list
    const shuffled = [...CURATED_ARTWORK_IDS].sort(() => Math.random() - 0.5);
    
    for (const id of shuffled) {
        if (artworks.length >= count) break;
        if (usedIds.has(id)) continue;
        
        try {
            const response = await fetch(
                `${ARTIC_API}/${id}?fields=id,title,artist_title,date_display,image_id`,
                { timeout: 10000 }
            );
            
            if (!response.ok) continue;
            
            const data = await response.json();
            const art = data.data;
            
            if (!art?.image_id) continue;
            
            artworks.push({
                externalId: String(art.id),
                title: art.title || 'Untitled',
                artist: art.artist_title || 'Unknown Artist',
                year: art.date_display || 'Unknown',
                imageUrl: buildImageUrl(art.image_id, 843),
                sourceApi: 'artic'
            });
            
            usedIds.add(id);
            
            // Small delay between requests
            await new Promise(r => setTimeout(r, 500));
        } catch (error) {
            console.warn(`Error fetching artwork ${id}:`, error.message);
        }
    }
    
    console.log(`📦 Fetched ${artworks.length} artworks`);
    return artworks;
}

// =====================================================
// HELPERS
// =====================================================

function buildImageUrl(imageId, size = 843) {
    // IIIF Image API
    // size: 200 (thumb), 400 (small), 843 (medium), 1686 (large)
    return `${ARTIC_IIIF}/${imageId}/full/${size},/0/default.jpg`;
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    fetchRandomArtwork,
    fetchMultipleArtworks,
    buildImageUrl,
    CURATED_ARTWORK_IDS
};