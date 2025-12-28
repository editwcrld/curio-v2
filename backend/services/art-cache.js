/**
 * CURIO BACKEND - Art Cache Service
 * ✅ Reduziert: MIN_CACHE_SIZE = 2
 * ✅ Längere Delays: 3 Sekunden
 * ✅ KEINE AI Generation hier!
 * ✅ excludeIds Support für Favorites-Ausschluss
 */

const { supabase } = require('../config/db');
const { fetchRandomArtwork, fetchMultipleArtworks } = require('./art-api');

// ✅ REDUZIERT für API Schonung
const MIN_CACHE_SIZE = 2;
const BATCH_SIZE = 2;
const API_DELAY_MS = 3000;  // 3 Sekunden

// ===== CACHE FUNCTIONS =====

async function getCacheCount() {
    try {
        const { count, error } = await supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Art getCacheCount error:', error);
        return 0;
    }
}

async function isDuplicate(externalId) {
    try {
        const { data, error } = await supabase
            .from('artworks')
            .select('id, medium, dimensions')
            .eq('external_id', externalId)
            .maybeSingle();
        
        if (error) throw error;
        return data ? data : null;
    } catch (error) {
        console.error('Art isDuplicate error:', error);
        return null;
    }
}

/**
 * Cache artwork to DB - NO AI generation here!
 */
async function cacheArt(artwork) {
    try {
        console.log('🖼️ Caching artwork:', artwork.title.substring(0, 40) + '...');
        
        // Check for duplicates
        const existing = await isDuplicate(artwork.externalId);
        if (existing) {
            console.log('⚠️ Artwork exists, returning ID:', existing.id);
            
            // ✅ Update medium/dimensions if missing and we have new data
            const needsUpdate = 
                (artwork.medium && !existing.medium) || 
                (artwork.dimensions && !existing.dimensions);
            
            if (needsUpdate) {
                console.log('📝 Updating existing artwork with medium/dimensions...');
                const { data, error } = await supabase
                    .from('artworks')
                    .update({
                        medium: artwork.medium || existing.medium,
                        dimensions: artwork.dimensions || existing.dimensions
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();
                
                if (!error && data) {
                    console.log('✅ Updated medium/dimensions for:', existing.id);
                    return data;
                }
            }
            
            const { data } = await supabase
                .from('artworks')
                .select('*')
                .eq('id', existing.id)
                .single();
            return data;
        }
        
        console.log('📤 Inserting artwork:', artwork.title);
        
        // Insert WITHOUT AI
        const { data, error } = await supabase
            .from('artworks')
            .insert({
                external_id: artwork.externalId,
                title: artwork.title,
                artist: artwork.artist,
                year: artwork.year,
                image_url: artwork.imageUrl,
                source_api: artwork.sourceApi || 'artic',
                medium: artwork.medium || null,
                dimensions: artwork.dimensions || null,
                metadata: artwork.metadata || {}
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Art insert error:', error);
            throw error;
        }
        
        console.log('✅ Artwork cached with ID:', data.id);
        return data;
    } catch (error) {
        console.error('cacheArt error:', error);
        return null;
    }
}

async function cacheMultipleArtworks(artworks) {
    let cached = 0;
    
    for (const artwork of artworks) {
        const result = await cacheArt(artwork);
        if (result) cached++;
        // ✅ Längerer Delay
        await new Promise(r => setTimeout(r, API_DELAY_MS));
    }
    
    console.log(`📦 Cached ${cached}/${artworks.length} artworks`);
    return cached;
}

/**
 * Get random artwork from cache
 * @param {string[]} excludeIds - Array of artwork IDs to exclude (e.g., user's favorites)
 */
async function getRandomCachedArt(excludeIds = []) {
    try {
        // Build query
        let query = supabase.from('artworks').select('*');
        
        // ✅ Exclude favorites if provided
        if (excludeIds && excludeIds.length > 0) {
            query = query.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        
        // Get count of available artworks
        const { count, error: countError } = await supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '()');
        
        const availableCount = excludeIds.length > 0 ? count : await getCacheCount();
        
        if (!availableCount || availableCount === 0) {
            console.warn('⚠️ Art cache empty or all excluded!');
            return null;
        }
        
        const randomOffset = Math.floor(Math.random() * availableCount);
        
        // Fetch with exclusions
        let fetchQuery = supabase.from('artworks').select('*');
        if (excludeIds && excludeIds.length > 0) {
            fetchQuery = fetchQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        
        const { data, error } = await fetchQuery
            .range(randomOffset, randomOffset)
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('getRandomCachedArt error:', error);
        return null;
    }
}

async function ensureCacheFilled() {
    try {
        const count = await getCacheCount();
        console.log(`📊 Art cache: ${count}/${MIN_CACHE_SIZE} artworks`);
        
        if (count >= MIN_CACHE_SIZE) {
            console.log('✅ Art cache is healthy');
            return;
        }
        
        console.log('🔄 Filling art cache...');
        
        const artworks = await fetchMultipleArtworks(BATCH_SIZE);
        
        if (artworks.length > 0) {
            await cacheMultipleArtworks(artworks);
        }
    } catch (error) {
        console.error('ensureCacheFilled error:', error);
    }
}

async function getArt(excludeIds = []) {
    try {
        let art = await getRandomCachedArt(excludeIds);
        
        if (art) {
            // Background refill wenn nötig
            getCacheCount().then(count => {
                if (count < MIN_CACHE_SIZE) {
                    ensureCacheFilled().catch(console.error);
                }
            });
            return art;
        }
        
        // Cache miss - fetch from API
        console.warn('⚠️ Art cache miss, fetching from API...');
        const freshArt = await fetchRandomArtwork();
        
        const cached = await cacheArt(freshArt);
        ensureCacheFilled().catch(console.error);
        
        return cached || freshArt;
    } catch (error) {
        console.error('getArt error:', error);
        throw error;
    }
}

module.exports = {
    getArt,
    getRandomCachedArt,
    cacheArt,
    cacheMultipleArtworks,
    ensureCacheFilled,
    getCacheCount,
    isDuplicate
};