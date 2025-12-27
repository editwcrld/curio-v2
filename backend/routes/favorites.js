/**
 * CURIO BACKEND - Favorites Routes
 * ✅ CRUD Operations
 * ✅ Gradient/Metadata Support
 * ✅ ai_description_de + ai_description_en
 */

const express = require('express');
const router = express.Router();

const { supabase } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { ValidationError } = require('../middleware/error');

// =====================================================
// GET /api/favorites - List all
// =====================================================

router.get('/', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('favorites')
            .select(`
                id,
                artwork_id,
                quote_id,
                metadata,
                created_at,
                artworks (
                    id,
                    title,
                    artist,
                    year,
                    image_url,
                    ai_description_de,
                    ai_description_en
                ),
                quotes (
                    id,
                    text,
                    author,
                    source,
                    category,
                    ai_description_de,
                    ai_description_en
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform to frontend format
        const favorites = data.map(fav => {
            const metadata = fav.metadata || {};
            
            if (fav.artwork_id && fav.artworks) {
                return {
                    favoriteId: fav.id,
                    type: 'art',
                    id: fav.artworks.id,
                    title: fav.artworks.title,
                    artist: fav.artworks.artist,
                    year: fav.artworks.year,
                    imageUrl: fav.artworks.image_url,
                    ai_description_de: fav.artworks.ai_description_de,
                    ai_description_en: fav.artworks.ai_description_en,
                    backgroundInfo: fav.artworks.ai_description_de || fav.artworks.ai_description_en,
                    savedAt: fav.created_at,
                    savedGradient: metadata.gradient || null
                };
            } else if (fav.quote_id && fav.quotes) {
                return {
                    favoriteId: fav.id,
                    type: 'quotes',
                    id: fav.quotes.id,
                    text: fav.quotes.text,
                    author: fav.quotes.author,
                    source: fav.quotes.source,
                    category: fav.quotes.category,
                    ai_description_de: fav.quotes.ai_description_de,
                    ai_description_en: fav.quotes.ai_description_en,
                    backgroundInfo: fav.quotes.ai_description_de || fav.quotes.ai_description_en,
                    savedAt: fav.created_at,
                    savedGradient: metadata.gradient || null
                };
            }
            return null;
        }).filter(Boolean);
        
        res.json({
            success: true,
            data: favorites
        });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// POST /api/favorites - Add new
// =====================================================

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type, itemId, gradient } = req.body;
        
        if (!type || !itemId) {
            throw new ValidationError('type and itemId are required');
        }
        
        if (!['art', 'quotes'].includes(type)) {
            throw new ValidationError('type must be "art" or "quotes"');
        }
        
        // Check if already favorited
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq(type === 'art' ? 'artwork_id' : 'quote_id', itemId)
            .maybeSingle();
        
        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Already favorited',
                alreadyExists: true,
                data: { favoriteId: existing.id }
            });
        }
        
        // Build metadata
        const metadata = {};
        if (gradient) {
            metadata.gradient = gradient;
        }
        
        // Insert favorite
        const { data, error } = await supabase
            .from('favorites')
            .insert({
                user_id: userId,
                artwork_id: type === 'art' ? itemId : null,
                quote_id: type === 'quotes' ? itemId : null,
                metadata: Object.keys(metadata).length > 0 ? metadata : null
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

// =====================================================
// DELETE /api/favorites/:favoriteId - Remove
// =====================================================

router.delete('/:favoriteId', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { favoriteId } = req.params;
        
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

// =====================================================
// GET /api/favorites/check/:type/:itemId - Check status
// =====================================================

router.get('/check/:type/:itemId', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type, itemId } = req.params;
        
        if (!['art', 'quotes'].includes(type)) {
            throw new ValidationError('Type must be "art" or "quotes"');
        }
        
        const { data, error } = await supabase
            .from('favorites')
            .select('id, metadata')
            .eq('user_id', userId)
            .eq(type === 'art' ? 'artwork_id' : 'quote_id', itemId)
            .maybeSingle();
        
        if (error) throw error;
        
        res.json({
            success: true,
            isFavorited: !!data,
            favoriteId: data?.id || null,
            gradient: data?.metadata?.gradient || null
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;