/**
 * CURIO BACKEND - Favorites Routes
 * CRUD Operations for User Favorites
 */

const express = require('express');
const router = express.Router();

const { supabase } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { ValidationError } = require('../middleware/error');

// =====================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// =====================================================

/**
 * GET /api/favorites
 * Get all favorites for current user
 * 
 * Returns: Array of favorites with full artwork/quote data
 */
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Get all favorites with joined data
        const { data, error } = await supabase
            .from('favorites')
            .select(`
                id,
                artwork_id,
                quote_id,
                created_at,
                artworks (
                    id,
                    title,
                    artist,
                    year,
                    image_url,
                    ai_description
                ),
                quotes (
                    id,
                    text,
                    author,
                    source,
                    category,
                    ai_description
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform data to frontend format
        const favorites = data.map(fav => {
            if (fav.artwork_id) {
                return {
                    favoriteId: fav.id,
                    type: 'art',
                    id: fav.artworks.id,
                    title: fav.artworks.title,
                    artist: fav.artworks.artist,
                    year: fav.artworks.year,
                    imageUrl: fav.artworks.image_url,
                    description: fav.artworks.ai_description,
                    savedAt: fav.created_at
                };
            } else {
                return {
                    favoriteId: fav.id,
                    type: 'quotes',
                    id: fav.quotes.id,
                    text: fav.quotes.text,
                    author: fav.quotes.author,
                    source: fav.quotes.source,
                    category: fav.quotes.category,
                    backgroundInfo: fav.quotes.ai_description,
                    savedAt: fav.created_at
                };
            }
        });
        
        res.json({
            success: true,
            data: favorites
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/favorites
 * Add new favorite
 * 
 * Body: { type: 'art' | 'quotes', itemId: 'uuid' }
 */
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type, itemId } = req.body;
        
        if (!type || !itemId) {
            throw new ValidationError('Type and itemId required');
        }
        
        if (!['art', 'quotes'].includes(type)) {
            throw new ValidationError('Type must be "art" or "quotes"');
        }
        
        // Check if already favorited
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq(type === 'art' ? 'artwork_id' : 'quote_id', itemId)
            .maybeSingle();
        
        if (existing) {
            return res.json({
                success: true,
                message: 'Already favorited',
                alreadyExists: true
            });
        }
        
        // Insert favorite
        const { data, error } = await supabase
            .from('favorites')
            .insert({
                user_id: userId,
                artwork_id: type === 'art' ? itemId : null,
                quote_id: type === 'quotes' ? itemId : null
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({
            success: true,
            message: 'Favorite added',
            data: {
                favoriteId: data.id,
                type,
                itemId
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/favorites/:favoriteId
 * Remove favorite
 */
router.delete('/:favoriteId', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { favoriteId } = req.params;
        
        // Delete only if owned by user (RLS also enforces this)
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', favoriteId)
            .eq('user_id', userId);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Favorite removed'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/favorites/check/:type/:itemId
 * Check if item is favorited
 */
router.get('/check/:type/:itemId', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type, itemId } = req.params;
        
        if (!['art', 'quotes'].includes(type)) {
            throw new ValidationError('Type must be "art" or "quotes"');
        }
        
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq(type === 'art' ? 'artwork_id' : 'quote_id', itemId)
            .maybeSingle();
        
        if (error) throw error;
        
        res.json({
            success: true,
            isFavorited: !!data,
            favoriteId: data?.id || null
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;