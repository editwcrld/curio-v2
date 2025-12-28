/**
 * CURIO BACKEND - Bulk Load Script
 * 
 * Lädt 70 kuratierte Kunstwerke und 70 inspirierende Zitate
 * mit AI-generierten Beschreibungen in die Datenbank.
 * 
 * ✅ Random Delay 8-17 Sekunden zwischen Requests
 * ✅ Bekannte Kunstwerke von berühmten Malern
 * ✅ Inspirierende Zitate von bedeutenden Persönlichkeiten
 * 
 * Usage: node scripts/bulk-load-curated.js
 */

require('dotenv').config();

const { supabase } = require('../config/db');
const { fetchRandomArtwork } = require('../services/art-api');
const { generateArtDescription, generateQuoteDescription } = require('../services/mistral-ai');

// =====================================================
// CONFIGURATION
// =====================================================

const MIN_DELAY_MS = 8000;   // 8 Sekunden
const MAX_DELAY_MS = 17000;  // 17 Sekunden

function getRandomDelay() {
    return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// KURATIERTE KUNSTWERKE - Bekannte Meisterwerke
// Art Institute of Chicago IDs
// =====================================================

const CURATED_ARTIC_IDS = [
    // Vincent van Gogh
    28560,  // The Bedroom
    80607,  // Self-Portrait
    
    // Claude Monet
    16568,  // Water Lilies
    16571,  // Stacks of Wheat (End of Summer)
    14620,  // Arrival of the Normandy Train
    
    // Georges Seurat
    27992,  // A Sunday on La Grande Jatte
    
    // Grant Wood
    6565,   // American Gothic
    
    // Edward Hopper
    111628, // Nighthawks
    
    // Pablo Picasso
    28067,  // The Old Guitarist
    66039,  // Mother and Child
    
    // Gustav Klimt
    20684,  // Portrait of a Lady
    
    // Mary Cassatt
    111442, // The Child's Bath
    14591,  // The Letter
    
    // Renoir
    81558,  // Two Sisters (On the Terrace)
    
    // Caillebotte
    20684,  // Paris Street; Rainy Day
    
    // El Greco
    86385,  // The Assumption of the Virgin
    
    // Rembrandt
    95998,  // Old Man with a Gold Chain
    
    // Winslow Homer
    16776,  // The Herring Net
    
    // John Singer Sargent
    83642,  // The Fountain
    
    // James McNeill Whistler
    111380, // Arrangement in Grey and Black No.1
    
    // Georgia O'Keeffe
    61428,  // Sky Above Clouds IV
    
    // Marc Chagall
    109439, // America Windows
    
    // Salvador Dalí
    97916,  // Inventions of the Monsters
    
    // Henri Matisse
    185905, // Bathers by a River
    
    // Edvard Munch
    97402,  // Madonna
    
    // Paul Cézanne
    111436, // The Basket of Apples
    6596,   // Mont Sainte-Victoire
    
    // Toulouse-Lautrec
    16231,  // At the Moulin Rouge
    
    // Edgar Degas
    14574,  // The Millinery Shop
    14586,  // Ballet at the Paris Opera
    
    // Camille Pissarro
    16164,  // Woman Bathing Her Feet
    
    // Berthe Morisot
    11723,  // Woman at Her Toilette
    
    // Paul Gauguin
    27992,  // Why Are You Angry?
    
    // Frida Kahlo (wenn verfügbar)
    
    // Jackson Pollock (wenn verfügbar)
    
    // Andy Warhol (wenn verfügbar)
];

// Rijksmuseum Object Numbers - Berühmte Niederländische Meister
const CURATED_RIJKS_IDS = [
    'SK-C-5',      // Rembrandt - The Night Watch
    'SK-A-4691',   // Vermeer - The Milkmaid
    'SK-A-2344',   // Vermeer - Woman Reading a Letter
    'SK-A-1595',   // Vermeer - The Little Street
    'SK-C-6',      // Frans Hals - The Merry Drinker
    'SK-A-135',    // Rembrandt - Self-Portrait
    'SK-A-4050',   // Rembrandt - The Jewish Bride
    'SK-C-216',    // Rembrandt - The Syndics
    'SK-A-3981',   // Jan Steen - The Feast of Saint Nicholas
    'SK-A-2860',   // Pieter de Hooch - Woman and Child
    'SK-A-4',      // Frans Hals - Portrait of a Couple
    'SK-A-180',    // Adriaen Coorte - Still Life with Asparagus
    'SK-A-2963',   // Gerard ter Borch - Gallant Conversation
    'SK-A-3247',   // Jan van Huysum - Still Life with Flowers
    'SK-A-1935',   // Jacob van Ruisdael - View of Haarlem
    'SK-A-2205',   // Aelbert Cuyp - River Landscape
    'SK-C-251',    // Bartholomeus van der Helst - Banquet
    'SK-A-4830',   // Johannes Vermeer - The Love Letter
    'SK-A-1796',   // Paulus Potter - The Bull
    'SK-A-3262',   // Rachel Ruysch - Flowers in a Vase
];

// =====================================================
// KURATIERTE ZITATE - Inspirierende Persönlichkeiten
// =====================================================

const CURATED_QUOTES = [
    // Oscar Wilde
    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "wisdom" },
    { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde", category: "life" },
    { text: "I have the simplest tastes. I am always satisfied with the best.", author: "Oscar Wilde", category: "humor" },
    { text: "The only way to get rid of a temptation is to yield to it.", author: "Oscar Wilde", category: "wisdom" },
    
   
    // Marcus Aurelius
    { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", category: "philosophy" },
    { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", category: "character" },
    { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "stoicism" },
    { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius", category: "philosophy" },
    
    // Friedrich Nietzsche
    { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "philosophy" },
    { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche", category: "strength" },
    { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", category: "art" },
    
    // Leonardo da Vinci
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", category: "design" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci", category: "learning" },
    { text: "Art is never finished, only abandoned.", author: "Leonardo da Vinci", category: "art" },
    
    // Seneca
    { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", category: "success" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "stoicism" },
    { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", category: "time" },
    { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca", category: "growth" },
    
    // Ralph Waldo Emerson
    { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson", category: "authenticity" },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "inner-strength" },
    { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", category: "courage" },
    
    // Winston Churchill
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "perseverance" },
    { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill", category: "generosity" },
    { text: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", author: "Winston Churchill", category: "perspective" },
    
    // Mahatma Gandhi
    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", category: "change" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi", category: "action" },
    { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", category: "willpower" },
    
    // Maya Angelou
    { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou", category: "relationships" },
    { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", category: "expression" },
    { text: "We delight in the beauty of the butterfly, but rarely admit the changes it has gone through to achieve that beauty.", author: "Maya Angelou", category: "growth" },
    
  
    // Rumi
    { text: "The wound is the place where the Light enters you.", author: "Rumi", category: "healing" },
    { text: "What you seek is seeking you.", author: "Rumi", category: "destiny" },
    { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi", category: "wisdom" },
    { text: "Let the beauty of what you love be what you do.", author: "Rumi", category: "passion" },
    
    // Lao Tzu
    { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", category: "beginning" },
    { text: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Lao Tzu", category: "self-knowledge" },
    { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", category: "patience" },
    
    // Aristotle
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "excellence" },
    { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "wisdom" },
    { text: "The whole is greater than the sum of its parts.", author: "Aristotle", category: "philosophy" },
    
    // Marie Curie
    { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", category: "courage" },
    { text: "Be less curious about people and more curious about ideas.", author: "Marie Curie", category: "curiosity" },
    
    // Nelson Mandela
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "perseverance" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", category: "education" },
    { text: "I learned that courage was not the absence of fear, but the triumph over it.", author: "Nelson Mandela", category: "courage" },
    
    // Virginia Woolf
    { text: "You cannot find peace by avoiding life.", author: "Virginia Woolf", category: "life" },
    { text: "One cannot think well, love well, sleep well, if one has not dined well.", author: "Virginia Woolf", category: "wellbeing" },
    
    // Mark Twain
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "action" },
    { text: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.", author: "Mark Twain", category: "regret" },
    { text: "Kindness is the language which the deaf can hear and the blind can see.", author: "Mark Twain", category: "kindness" },
    
  
    // Anne Frank
    { text: "How wonderful it is that nobody need wait a single moment before starting to improve the world.", author: "Anne Frank", category: "action" },
    { text: "In spite of everything I still believe that people are really good at heart.", author: "Anne Frank", category: "hope" },
    
    // Plato
    { text: "The measure of a man is what he does with power.", author: "Plato", category: "character" },
    { text: "Be kind, for everyone you meet is fighting a hard battle.", author: "Plato", category: "empathy" },
    
    // Viktor Frankl
    { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl", category: "adaptation" },
    { text: "Those who have a 'why' to live, can bear with almost any 'how'.", author: "Viktor Frankl", category: "purpose" },
    
    // Carl Jung
    { text: "Who looks outside, dreams; who looks inside, awakes.", author: "Carl Jung", category: "self-discovery" },
    { text: "You are what you do, not what you say you'll do.", author: "Carl Jung", category: "authenticity" },
];

// =====================================================
// LOAD FUNCTIONS
// =====================================================

/**
 * Load artworks from Art Institute of Chicago
 */
async function loadArticArtworks() {
    console.log('\n🎨 Loading Art Institute of Chicago artworks...\n');
    
    let loaded = 0;
    let failed = 0;
    
    for (const artId of CURATED_ARTIC_IDS) {
        try {
            console.log(`\n📥 Fetching ARTIC artwork ID: ${artId}...`);
            
            // Fetch artwork details
            const response = await fetch(
                `https://api.artic.edu/api/v1/artworks/${artId}?fields=id,title,artist_title,date_display,image_id,is_public_domain`
            );
            
            if (!response.ok) {
                console.log(`   ⚠️ Artwork ${artId} not found, skipping...`);
                failed++;
                continue;
            }
            
            const data = await response.json();
            const art = data.data;
            
            if (!art.image_id || !art.is_public_domain) {
                console.log(`   ⚠️ Artwork ${artId} has no image or not public domain, skipping...`);
                failed++;
                continue;
            }
            
            // Fetch medium/dimensions from manifest
            let medium = null;
            let dimensions = null;
            
            try {
                const manifestResponse = await fetch(
                    `https://api.artic.edu/api/v1/artworks/${artId}/manifest.json`
                );
                
                if (manifestResponse.ok) {
                    const manifest = await manifestResponse.json();
                    
                    if (manifest.metadata && Array.isArray(manifest.metadata)) {
                        for (const item of manifest.metadata) {
                            if (item.label === 'Medium' && item.value) {
                                medium = item.value;
                            }
                            if (item.label === 'Dimensions' && item.value) {
                                dimensions = item.value;
                            }
                        }
                    }
                }
            } catch (e) {
                console.log(`   ⚠️ Could not fetch manifest for ${artId}`);
            }
            
            console.log(`   ✅ "${art.title}" by ${art.artist_title}`);
            
            // Check if already exists
            const { data: existing } = await supabase
                .from('artworks')
                .select('id')
                .eq('external_id', String(artId))
                .maybeSingle();
            
            if (existing) {
                console.log(`   ⚠️ Already exists, skipping...`);
                continue;
            }
            
            // Generate AI descriptions
            console.log(`   🤖 Generating AI descriptions...`);
            const descriptions = await generateArtDescription({
                title: art.title,
                artist: art.artist_title,
                year: art.date_display
            });
            
            // Insert into database
            const { error } = await supabase
                .from('artworks')
                .insert({
                    external_id: String(artId),
                    title: art.title,
                    artist: art.artist_title || 'Unknown Artist',
                    year: art.date_display || 'Unknown',
                    image_url: `https://www.artic.edu/iiif/2/${art.image_id}/full/843,/0/default.jpg`,
                    source_api: 'artic',
                    medium: medium,
                    dimensions: dimensions,
                    ai_description_de: descriptions.de,
                    ai_description_en: descriptions.en,
                    metadata: { medium, dimensions }
                });
            
            if (error) {
                console.log(`   ❌ Insert failed:`, error.message);
                failed++;
            } else {
                console.log(`   ✅ Saved to database!`);
                loaded++;
            }
            
            // Random delay
            const delay = getRandomDelay();
            console.log(`   ⏳ Waiting ${(delay/1000).toFixed(1)}s...`);
            await sleep(delay);
            
        } catch (error) {
            console.error(`   ❌ Error loading artwork ${artId}:`, error.message);
            failed++;
        }
    }
    
    console.log(`\n📊 ARTIC Results: ${loaded} loaded, ${failed} failed\n`);
    return loaded;
}

/**
 * Load artworks from Rijksmuseum
 */
async function loadRijksArtworks() {
    console.log('\n🏛️ Loading Rijksmuseum artworks...\n');
    
    const apiKey = process.env.RIJKSMUSEUM_API_KEY;
    if (!apiKey) {
        console.log('⚠️ RIJKSMUSEUM_API_KEY not set, skipping Rijks artworks');
        return 0;
    }
    
    let loaded = 0;
    let failed = 0;
    
    for (const objectNumber of CURATED_RIJKS_IDS) {
        try {
            console.log(`\n📥 Fetching Rijks artwork: ${objectNumber}...`);
            
            const response = await fetch(
                `https://www.rijksmuseum.nl/api/en/collection/${objectNumber}?key=${apiKey}`
            );
            
            if (!response.ok) {
                console.log(`   ⚠️ Artwork ${objectNumber} not found, skipping...`);
                failed++;
                continue;
            }
            
            const data = await response.json();
            const art = data.artObject;
            
            if (!art?.webImage?.url) {
                console.log(`   ⚠️ Artwork ${objectNumber} has no image, skipping...`);
                failed++;
                continue;
            }
            
            console.log(`   ✅ "${art.title}" by ${art.principalOrFirstMaker}`);
            
            // Check if already exists
            const { data: existing } = await supabase
                .from('artworks')
                .select('id')
                .eq('external_id', objectNumber)
                .maybeSingle();
            
            if (existing) {
                console.log(`   ⚠️ Already exists, skipping...`);
                continue;
            }
            
            // Get medium and dimensions
            const medium = art.physicalMedium || null;
            let dimensions = null;
            if (art.subTitle) {
                const dimMatch = art.subTitle.match(/(\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?(?:\s*[×x]\s*\d+(?:[.,]\d+)?)?\s*cm)/i);
                if (dimMatch) {
                    dimensions = dimMatch[1];
                }
            }
            
            // Generate AI descriptions
            console.log(`   🤖 Generating AI descriptions...`);
            const descriptions = await generateArtDescription({
                title: art.title,
                artist: art.principalOrFirstMaker,
                year: art.dating?.presentingDate
            });
            
            // Insert into database
            const { error } = await supabase
                .from('artworks')
                .insert({
                    external_id: objectNumber,
                    title: art.title,
                    artist: art.principalOrFirstMaker || 'Unknown Artist',
                    year: art.dating?.presentingDate || 'Unknown',
                    image_url: art.webImage.url.replace('=s0', '=s800'),
                    source_api: 'rijks',
                    medium: medium,
                    dimensions: dimensions,
                    ai_description_de: descriptions.de,
                    ai_description_en: descriptions.en,
                    metadata: { objectNumber, medium, dimensions }
                });
            
            if (error) {
                console.log(`   ❌ Insert failed:`, error.message);
                failed++;
            } else {
                console.log(`   ✅ Saved to database!`);
                loaded++;
            }
            
            // Random delay
            const delay = getRandomDelay();
            console.log(`   ⏳ Waiting ${(delay/1000).toFixed(1)}s...`);
            await sleep(delay);
            
        } catch (error) {
            console.error(`   ❌ Error loading artwork ${objectNumber}:`, error.message);
            failed++;
        }
    }
    
    console.log(`\n📊 Rijks Results: ${loaded} loaded, ${failed} failed\n`);
    return loaded;
}

/**
 * Load curated quotes
 */
async function loadQuotes() {
    console.log('\n📜 Loading curated quotes...\n');
    
    let loaded = 0;
    let failed = 0;
    
    for (const quote of CURATED_QUOTES) {
        try {
            console.log(`\n📥 Processing quote by ${quote.author}...`);
            console.log(`   "${quote.text.substring(0, 50)}..."`);
            
            // Check if already exists
            const { data: existing } = await supabase
                .from('quotes')
                .select('id')
                .eq('text', quote.text)
                .eq('author', quote.author)
                .maybeSingle();
            
            if (existing) {
                console.log(`   ⚠️ Already exists, skipping...`);
                continue;
            }
            
            // Generate AI descriptions
            console.log(`   🤖 Generating AI descriptions...`);
            const descriptions = await generateQuoteDescription({
                text: quote.text,
                author: quote.author
            });
            
            // Insert into database
            const { error } = await supabase
                .from('quotes')
                .insert({
                    text: quote.text,
                    author: quote.author,
                    category: quote.category,
                    source_api: 'curated',
                    ai_description_de: descriptions.de,
                    ai_description_en: descriptions.en
                });
            
            if (error) {
                console.log(`   ❌ Insert failed:`, error.message);
                failed++;
            } else {
                console.log(`   ✅ Saved to database!`);
                loaded++;
            }
            
            // Random delay
            const delay = getRandomDelay();
            console.log(`   ⏳ Waiting ${(delay/1000).toFixed(1)}s...`);
            await sleep(delay);
            
        } catch (error) {
            console.error(`   ❌ Error loading quote:`, error.message);
            failed++;
        }
    }
    
    console.log(`\n📊 Quotes Results: ${loaded} loaded, ${failed} failed\n`);
    return loaded;
}

// =====================================================
// MAIN
// =====================================================

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 CURIO BULK LOAD - Curated Artworks & Quotes');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`⏱️  Delay between requests: ${MIN_DELAY_MS/1000}-${MAX_DELAY_MS/1000} seconds`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Check environment
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
        process.exit(1);
    }
    
    if (!process.env.MISTRAL_API_KEY) {
        console.error('❌ Missing MISTRAL_API_KEY');
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    // Load artworks
    const articCount = await loadArticArtworks();
    const rijksCount = await loadRijksArtworks();
    
    // Load quotes
    const quotesCount = await loadQuotes();
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ BULK LOAD COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🎨 Artworks loaded: ${articCount + rijksCount}`);
    console.log(`   - Art Institute of Chicago: ${articCount}`);
    console.log(`   - Rijksmuseum: ${rijksCount}`);
    console.log(`📜 Quotes loaded: ${quotesCount}`);
    console.log(`⏱️  Total time: ${duration} minutes`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});