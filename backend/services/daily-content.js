/**
 * CURIO BACKEND - Daily Content Service
 * ✅ Generiert täglich um 00:01 CET neuen Content
 * ✅ ALLE User sehen dasselbe Art + Quote pro Tag
 * ✅ AI wird vorgeneriert
 * ✅ Attribution für API Compliance
 */

const { supabase } = require('../config/db');
const { getRandomCachedArt, cacheArt } = require('./art-cache');
const { getRandomCachedQuote, cacheQuote } = require('./quote-cache');
const { fetchRandomArtwork } = require('./art-api');
const { fetchRandomQuote } = require('./quotes-api');

// AI Service (optional)
let generateArtDescription = null;
let generateQuoteDescription = null;
try {
    const mistral = require('./mistral-ai');
    generateArtDescription = mistral.generateArtDescription;
    generateQuoteDescription = mistral.generateQuoteDescription;
} catch (e) {
    console.warn('⚠️ Mistral AI not available for daily content');
}

// =====================================================
// ATTRIBUTION HELPER
// =====================================================

function getAttribution(sourceApi) {
    const attributions = {
        'artic': {
            text: 'Image courtesy of the Art Institute of Chicago',
            url: 'https://www.artic.edu',
            license: 'CC0 Public Domain'
        },
        'rijks': {
            text: 'Image courtesy of the Rijksmuseum',
            url: 'https://www.rijksmuseum.nl',
            license: 'CC0 Public Domain'
        }
    };
    return attributions[sourceApi] || null;
}

// =====================================================
// GET TODAY'S DATE (CET/CEST)
// =====================================================

function getTodayDateCET() {
    const now = new Date();
    // Convert to CET/CEST
    const cetOffset = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
    const cetDate = new Date(cetOffset);
    return cetDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

// =====================================================
// GET DAILY CONTENT (für heute)
// =====================================================

async function getDailyContent() {
    const today = getTodayDateCET();
    
    console.log(`📅 Getting daily content for ${today}...`);
    
    // Check if we have content for today
    const { data: existing, error } = await supabase
        .from('daily_content')
        .select(`
            id,
            date,
            artwork_id,
            quote_id,
            artworks (
                id, title, artist, year, image_url,
                ai_description_de, ai_description_en, metadata,
                source_api, external_id
            ),
            quotes (
                id, text, author, source, category,
                ai_description_de, ai_description_en
            )
        `)
        .eq('date', today)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching daily content:', error);
    }
    
    if (existing?.artworks && existing?.quotes) {
        console.log('✅ Daily content found for today');
        return {
            date: existing.date,
            art: {
                id: existing.artworks.id,
                title: existing.artworks.title,
                artist: existing.artworks.artist,
                year: existing.artworks.year,
                imageUrl: existing.artworks.image_url,
                ai_description_de: existing.artworks.ai_description_de,
                ai_description_en: existing.artworks.ai_description_en,
                metadata: existing.artworks.metadata,
                source_api: existing.artworks.source_api,
                external_id: existing.artworks.external_id,
                attribution: getAttribution(existing.artworks.source_api)
            },
            quote: {
                id: existing.quotes.id,
                text: existing.quotes.text,
                author: existing.quotes.author,
                source: existing.quotes.source,
                category: existing.quotes.category,
                ai_description_de: existing.quotes.ai_description_de,
                ai_description_en: existing.quotes.ai_description_en
            }
        };
    }
    
    // No content for today - generate it!
    console.log('🔄 No daily content for today, generating...');
    return await generateDailyContent();
}

// =====================================================
// GENERATE DAILY CONTENT (new day)
// =====================================================

async function generateDailyContent() {
    const today = getTodayDateCET();
    
    console.log(`🎨 Generating daily content for ${today}...`);
    
    try {
        // 1. Get or fetch Art
        let art = await getRandomCachedArt();
        if (!art) {
            console.log('⚠️ No cached art, fetching fresh...');
            const freshArt = await fetchRandomArtwork();
            art = await cacheArt(freshArt);
        }
        
        // 2. Ensure Art has AI
        if (!art.ai_description_de && generateArtDescription) {
            console.log('🤖 Generating AI for daily art...');
            const descriptions = await generateArtDescription({
                title: art.title,
                artist: art.artist,
                year: art.year
            });
            
            await supabase
                .from('artworks')
                .update({
                    ai_description_de: descriptions.de,
                    ai_description_en: descriptions.en
                })
                .eq('id', art.id);
            
            art.ai_description_de = descriptions.de;
            art.ai_description_en = descriptions.en;
        }
        
        // 3. Get or fetch Quote
        let quote = await getRandomCachedQuote();
        if (!quote) {
            console.log('⚠️ No cached quote, fetching fresh...');
            const freshQuote = await fetchRandomQuote();
            quote = await cacheQuote(freshQuote);
        }
        
        // 4. Ensure Quote has AI
        if (!quote.ai_description_de && generateQuoteDescription) {
            console.log('🤖 Generating AI for daily quote...');
            const descriptions = await generateQuoteDescription({
                text: quote.text,
                author: quote.author
            });
            
            await supabase
                .from('quotes')
                .update({
                    ai_description_de: descriptions.de,
                    ai_description_en: descriptions.en
                })
                .eq('id', quote.id);
            
            quote.ai_description_de = descriptions.de;
            quote.ai_description_en = descriptions.en;
        }
        
        // 5. Save to daily_content
        const { data, error } = await supabase
            .from('daily_content')
            .upsert({
                date: today,
                artwork_id: art.id,
                quote_id: quote.id
            }, {
                onConflict: 'date'
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error saving daily content:', error);
            throw error;
        }
        
        console.log(`✅ Daily content generated for ${today}`);
        console.log(`   Art: "${art.title}" by ${art.artist}`);
        console.log(`   Quote: "${quote.text.substring(0, 50)}..." - ${quote.author}`);
        
        return {
            date: today,
            art: {
                id: art.id,
                title: art.title,
                artist: art.artist,
                year: art.year,
                imageUrl: art.image_url,
                ai_description_de: art.ai_description_de,
                ai_description_en: art.ai_description_en,
                metadata: art.metadata,
                source_api: art.source_api,
                external_id: art.external_id,
                attribution: getAttribution(art.source_api)
            },
            quote: {
                id: quote.id,
                text: quote.text,
                author: quote.author,
                source: quote.source,
                category: quote.category,
                ai_description_de: quote.ai_description_de,
                ai_description_en: quote.ai_description_en
            }
        };
    } catch (error) {
        console.error('❌ Failed to generate daily content:', error);
        throw error;
    }
}

// =====================================================
// RESET DAILY LIMITS (alle User)
// =====================================================

async function resetDailyLimits() {
    const today = getTodayDateCET();
    
    console.log('🔄 Resetting daily limits...');
    
    try {
        // Delete all limits from previous days
        const { error } = await supabase
            .from('user_limits')
            .delete()
            .lt('date', today);
        
        if (error) throw error;
        
        console.log('✅ Daily limits reset complete');
        return true;
    } catch (error) {
        console.error('❌ Failed to reset limits:', error);
        return false;
    }
}

// =====================================================
// EXPIRE PREMIUM USERS
// =====================================================

async function expirePremiumUsers() {
    console.log('🔄 Checking expired premium users...');
    
    try {
        const { data, error } = await supabase
            .from('premium_users')
            .update({ status: 'expired' })
            .eq('status', 'active')
            .lt('expires_at', new Date().toISOString())
            .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log(`✅ Expired ${data.length} premium users`);
        } else {
            console.log('✅ No premium users to expire');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Failed to expire premium users:', error);
        return false;
    }
}

// =====================================================
// RUN DAILY TASKS (called by scheduler)
// =====================================================

async function runDailyTasks() {
    console.log('═══════════════════════════════════════');
    console.log('🌅 DAILY TASKS STARTED');
    console.log('═══════════════════════════════════════');
    
    const startTime = Date.now();
    
    try {
        // 1. Generate daily content
        await generateDailyContent();
        
        // 2. Reset limits
        await resetDailyLimits();
        
        // 3. Expire premium users
        await expirePremiumUsers();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('═══════════════════════════════════════');
        console.log(`✅ DAILY TASKS COMPLETED in ${duration}s`);
        console.log('═══════════════════════════════════════');
        
        return true;
    } catch (error) {
        console.error('❌ Daily tasks failed:', error);
        return false;
    }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getDailyContent,
    generateDailyContent,
    resetDailyLimits,
    expirePremiumUsers,
    runDailyTasks,
    getTodayDateCET
};