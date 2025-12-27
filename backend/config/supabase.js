/**
 * CURIO BACKEND - Supabase Helper Functions
 * Zentrale DB Operationen
 */

const { supabase } = require('./db');

// =====================================================
// USER FUNCTIONS
// =====================================================

/**
 * Check if user is premium
 * @param {string} email - User email
 * @returns {Promise<boolean>}
 */
async function isPremium(email) {
    try {
        const { data, error } = await supabase
            .from('premium_users')
            .select('id, status, expires_at')
            .eq('email', email)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();
        
        if (error) {
            console.error('Error checking premium status:', error);
            return false;
        }
        
        return !!data;
    } catch (error) {
        console.error('isPremium error:', error);
        return false;
    }
}

/**
 * Get user profile by email
 * @param {string} email - User email
 * @returns {Promise<object|null>}
 */
async function getUserProfile(email) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('getUserProfile error:', error);
        return null;
    }
}

// =====================================================
// LIMITS FUNCTIONS
// =====================================================

/**
 * Get user's limits for today
 * @param {string} userId - User UUID
 * @returns {Promise<object>}
 */
async function getUserLimits(userId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('user_limits')
            .select('art_count, quote_count')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows
            throw error;
        }
        
        // Return existing limits or default (0, 0)
        return data || { art_count: 0, quote_count: 0 };
    } catch (error) {
        console.error('getUserLimits error:', error);
        return { art_count: 0, quote_count: 0 };
    }
}

/**
 * Increment user's navigation count
 * @param {string} userId - User UUID
 * @param {string} type - 'art' or 'quote'
 * @returns {Promise<boolean>}
 */
async function incrementLimit(userId, type) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const column = type === 'art' ? 'art_count' : 'quote_count';
        
        // Try to get existing row
        const { data: existing } = await supabase
            .from('user_limits')
            .select('id, art_count, quote_count')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();
        
        if (existing) {
            // Update existing row - only increment the specific column
            const { error } = await supabase
                .from('user_limits')
                .update({ 
                    [column]: existing[column] + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            
            if (error) throw error;
        } else {
            // Insert new row
            const insertData = {
                user_id: userId,
                date: today,
                art_count: type === 'art' ? 1 : 0,
                quote_count: type === 'quotes' ? 1 : 0
            };
            
            const { error } = await supabase
                .from('user_limits')
                .insert(insertData);
            
            // If insert failed due to race condition (duplicate key), fetch and update
            if (error && error.code === '23505') {
                console.log('⚠️ Race condition detected, retrying with update...');
                
                const { data: retry } = await supabase
                    .from('user_limits')
                    .select('id, art_count, quote_count')
                    .eq('user_id', userId)
                    .eq('date', today)
                    .single();
                
                if (retry) {
                    const { error: updateError } = await supabase
                        .from('user_limits')
                        .update({ 
                            [column]: retry[column] + 1,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', retry.id);
                    
                    if (updateError) throw updateError;
                }
            } else if (error) {
                throw error;
            }
        }
        
        return true;
    } catch (error) {
        console.error('incrementLimit error:', error);
        return false;
    }
}

/**
 * Reset all user limits (for daily reset)
 * @returns {Promise<boolean>}
 */
async function resetAllLimits() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Delete old limits (älter als heute)
        const { error } = await supabase
            .from('user_limits')
            .delete()
            .lt('date', today);
        
        if (error) throw error;
        
        console.log('✅ All user limits reset');
        return true;
    } catch (error) {
        console.error('resetAllLimits error:', error);
        return false;
    }
}

// =====================================================
// CONTENT FUNCTIONS
// =====================================================

/**
 * Get today's daily content
 * @returns {Promise<object|null>}
 */
async function getDailyContent() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('daily_content')
            .select(`
                *,
                artwork:artworks(*),
                quote:quotes(*)
            `)
            .eq('date', today)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('getDailyContent error:', error);
        return null;
    }
}

/**
 * Create daily content entry
 * @param {string} artworkId - Artwork UUID
 * @param {string} quoteId - Quote UUID
 * @returns {Promise<boolean>}
 */
async function createDailyContent(artworkId, quoteId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { error } = await supabase
            .from('daily_content')
            .upsert({
                date: today,
                artwork_id: artworkId,
                quote_id: quoteId
            }, {
                onConflict: 'date'
            });
        
        if (error) throw error;
        
        console.log('✅ Daily content created');
        return true;
    } catch (error) {
        console.error('createDailyContent error:', error);
        return false;
    }
}

// =====================================================
// ARTWORK FUNCTIONS
// =====================================================

/**
 * Get random artwork from cache
 * @returns {Promise<object|null>}
 */
async function getRandomArtwork() {
    try {
        const { data, error } = await supabase
            .from('artworks')
            .select('*')
            .limit(100);  // Get 100, pick random from those
        
        if (error) throw error;
        if (!data || data.length === 0) return null;
        
        // Pick random
        return data[Math.floor(Math.random() * data.length)];
    } catch (error) {
        console.error('getRandomArtwork error:', error);
        return null;
    }
}

/**
 * Save artwork to cache
 * @param {object} artwork - Artwork data
 * @returns {Promise<object|null>}
 */
async function saveArtwork(artwork) {
    try {
        const { data, error } = await supabase
            .from('artworks')
            .upsert(artwork, {
                onConflict: 'external_id'
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('saveArtwork error:', error);
        return null;
    }
}

// =====================================================
// QUOTE FUNCTIONS
// =====================================================

/**
 * Get random quote from cache
 * @returns {Promise<object|null>}
 */
async function getRandomQuote() {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .limit(100);  // Get 100, pick random
        
        if (error) throw error;
        if (!data || data.length === 0) return null;
        
        return data[Math.floor(Math.random() * data.length)];
    } catch (error) {
        console.error('getRandomQuote error:', error);
        return null;
    }
}

/**
 * Save quote to cache
 * @param {object} quote - Quote data
 * @returns {Promise<object|null>}
 */
async function saveQuote(quote) {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .insert(quote)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('saveQuote error:', error);
        return null;
    }
}

// =====================================================
// APP CONFIG
// =====================================================

/**
 * Get app configuration
 * @param {string} key - Config key
 * @returns {Promise<any>}
 */
async function getConfig(key) {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        
        if (error) throw error;
        return data?.value;
    } catch (error) {
        console.error('getConfig error:', error);
        return null;
    }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    // User
    isPremium,
    getUserProfile,
    
    // Limits
    getUserLimits,
    incrementLimit,
    resetAllLimits,
    
    // Content
    getDailyContent,
    createDailyContent,
    
    // Artwork
    getRandomArtwork,
    saveArtwork,
    
    // Quote
    getRandomQuote,
    saveQuote,
    
    // Config
    getConfig
};