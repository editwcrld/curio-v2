/**
 * CURIO - Bulk Load Initial Content
 * Loads 10 artworks and 10 quotes into the database
 * 
 * Run with: node bulk-load-content.js
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE ARTWORKS (Public Domain from Art Institute Chicago & Rijksmuseum)
// ═══════════════════════════════════════════════════════════════════════════

const artworks = [
    {
        external_id: '27992',
        title: 'A Sunday on La Grande Jatte',
        artist: 'Georges Seurat',
        year: '1884-1886',
        image_url: 'https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/843,/0/default.jpg',
        source_api: 'artic',
        medium: 'Oil on canvas',
        dimensions: '207.5 × 308.1 cm',
        ai_description_de: 'Georges Seurats Meisterwerk zeigt Pariser Bürger bei einem Sonntagsausflug auf der Île de la Grande Jatte. Das monumentale Gemälde ist ein Paradebeispiel des Pointillismus, bei dem unzählige kleine Farbpunkte zu einem harmonischen Ganzen verschmelzen.',
        ai_description_en: 'Georges Seurat\'s masterpiece depicts Parisians enjoying a Sunday outing on the Île de la Grande Jatte. This monumental painting is a prime example of Pointillism, where countless small dots of color blend into a harmonious whole.'
    },
    {
        external_id: '28560',
        title: 'The Bedroom',
        artist: 'Vincent van Gogh',
        year: '1889',
        image_url: 'https://www.artic.edu/iiif/2/25c31d8d-21a4-9ea1-1d73-6a2eca4dda7e/full/843,/0/default.jpg',
        source_api: 'artic',
        medium: 'Oil on canvas',
        dimensions: '73.6 × 92.3 cm',
        ai_description_de: 'Van Goghs Schlafzimmer in Arles ist eines seiner bekanntesten Werke. Die lebhaften Farben und die leicht verzerrte Perspektive vermitteln ein Gefühl von Ruhe und Geborgenheit, das der Künstler in seinem bescheidenen Zimmer fand.',
        ai_description_en: 'Van Gogh\'s bedroom in Arles is one of his most famous works. The vivid colors and slightly distorted perspective convey a sense of peace and security that the artist found in his modest room.'
    },
    {
        external_id: '111628',
        title: 'Nighthawks',
        artist: 'Edward Hopper',
        year: '1942',
        image_url: 'https://www.artic.edu/iiif/2/831a05de-d3f6-f4fa-a460-23008dd58dda/full/843,/0/default.jpg',
        source_api: 'artic',
        medium: 'Oil on canvas',
        dimensions: '84.1 × 152.4 cm',
        ai_description_de: 'Hoppers ikonisches Nachtcafé zeigt einsame Gestalten in einem hell erleuchteten Diner. Das Gemälde fängt die Isolation und Melancholie des städtischen Lebens ein und wurde zum Symbol der amerikanischen Moderne.',
        ai_description_en: 'Hopper\'s iconic night café shows lonely figures in a brightly lit diner. The painting captures the isolation and melancholy of urban life and became a symbol of American modernism.'
    },
    {
        external_id: '20684',
        title: 'The Old Guitarist',
        artist: 'Pablo Picasso',
        year: '1903-1904',
        image_url: 'https://www.artic.edu/iiif/2/3060de69-dbb8-ff1d-6941-f5c3dff9fb5c/full/843,/0/default.jpg',
        source_api: 'artic',
        medium: 'Oil on panel',
        dimensions: '122.9 × 82.6 cm',
        ai_description_de: 'Aus Picassos Blauer Periode stammt dieses ergreifende Porträt eines blinden Gitarristen. Die monochromen Blautöne verstärken das Gefühl von Armut und Einsamkeit, während die verzerrte Figur eine fast spirituelle Präsenz ausstrahlt.',
        ai_description_en: 'From Picasso\'s Blue Period comes this poignant portrait of a blind guitarist. The monochromatic blue tones enhance the feeling of poverty and loneliness, while the distorted figure radiates an almost spiritual presence.'
    },
    {
        external_id: 'SK-C-5',
        title: 'The Night Watch',
        artist: 'Rembrandt van Rijn',
        year: '1642',
        image_url: 'https://lh3.googleusercontent.com/J-mxAE7CPu-DXIOx4QKBtb0GC4ud37da1QK7CzbTIDswmvZHXhLm4Tv2-1H3iBXJWAW_bHm7dMl3j5wv_XiWAg55VOM=s0',
        source_api: 'rijks',
        medium: 'Oil on canvas',
        dimensions: '379.5 × 453.5 cm',
        ai_description_de: 'Rembrandts berühmtestes Werk zeigt die Bürgerwehr von Amsterdam in dynamischer Bewegung. Das dramatische Spiel von Licht und Schatten sowie die lebendige Komposition machen es zu einem Meisterwerk des Barock.',
        ai_description_en: 'Rembrandt\'s most famous work shows Amsterdam\'s civic guard in dynamic motion. The dramatic play of light and shadow and the lively composition make it a masterpiece of the Baroque.'
    },
    {
        external_id: 'SK-A-2344',
        title: 'The Milkmaid',
        artist: 'Johannes Vermeer',
        year: '1660',
        image_url: 'https://lh3.googleusercontent.com/cRtF3WdYfRQEraAcQz8dWDJOq3XsRX-h244rOw6zwkHtxy7NHjJOany7u4I2EKcaP-S_A8A7BGNuVi9BUBGvqoLW0A=s0',
        source_api: 'rijks',
        medium: 'Oil on canvas',
        dimensions: '45.5 × 41 cm',
        ai_description_de: 'Vermeers Meisterwerk zeigt eine Magd beim Eingießen von Milch. Das sanfte Licht, das durch das Fenster fällt, und die sorgfältige Darstellung alltäglicher Gegenstände machen dieses intime Genrebild zu einem Juwel der niederländischen Malerei.',
        ai_description_en: 'Vermeer\'s masterpiece shows a maid pouring milk. The soft light falling through the window and the careful depiction of everyday objects make this intimate genre painting a jewel of Dutch art.'
    },
    {
        external_id: '14620',
        title: 'Water Lilies',
        artist: 'Claude Monet',
        year: '1906',
        image_url: 'https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/843,/0/default.jpg',
        source_api: 'artic',
        medium: 'Oil on canvas',
        dimensions: '89.9 × 94.1 cm',
        ai_description_de: 'Monets Seerosenteich in Giverny inspirierte hunderte von Gemälden. Diese Version fängt das Spiel von Licht und Reflexionen auf der Wasseroberfläche ein und verkörpert den Impressionismus in seiner reinsten Form.',
        ai_description_en: 'Monet\'s water lily pond in Giverny inspired hundreds of paintings. This version captures the play of light and reflections on the water surface, embodying Impressionism in its purest form.'
    },
    {
        external_id: 'SK-A-3262',
        title: 'Self-Portrait',
        artist: 'Vincent van Gogh',
        year: '1887',
        image_url: 'https://lh3.googleusercontent.com/CKAE6c9E4Y8VNqXexBGZf3NDJA0z1IHmv-w-aVA3NB8YlYW2FWVH9UQx8-U9dKXLh75aXhQ1n_2u6qKcAiGJCXuC9g=s0',
        source_api: 'rijks',
        medium: 'Oil on cardboard',
        dimensions: '42 × 33.7 cm',
        ai_description_de: 'Eines von über 30 Selbstporträts, die Van Gogh in Paris malte. Die kurzen, dynamischen Pinselstriche und die leuchtenden Farben zeigen den Einfluss des Impressionismus auf sein Werk.',
        ai_description_en: 'One of over 30 self-portraits Van Gogh painted in Paris. The short, dynamic brushstrokes and bright colors show the influence of Impressionism on his work.'
    },
    {
        external_id: '6565',
        title: 'American Gothic',
        artist: 'Grant Wood',
        year: '1930',
        image_url: 'https://www.artic.edu/iiif/2/b272df73-a965-ac37-4172-be4e99483637/full/843,/0/default.jpg',
        source_api: 'artic',
        medium: 'Oil on beaver board',
        dimensions: '78 × 65.3 cm',
        ai_description_de: 'Woods ikonisches Doppelporträt zeigt einen Farmer und seine Tochter vor einem Haus im Carpenter-Gothic-Stil. Das Gemälde wurde zum Symbol des amerikanischen Mittleren Westens und ist heute eines der bekanntesten amerikanischen Kunstwerke.',
        ai_description_en: 'Wood\'s iconic double portrait shows a farmer and his daughter in front of a Carpenter Gothic style house. The painting became a symbol of the American Midwest and is now one of the most recognized American artworks.'
    },
    {
        external_id: 'SK-A-1718',
        title: 'Girl with a Pearl Earring',
        artist: 'Johannes Vermeer',
        year: '1665',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg',
        source_api: 'rijks',
        medium: 'Oil on canvas',
        dimensions: '44.5 × 39 cm',
        ai_description_de: 'Vermeers "Mädchen mit dem Perlenohrring" ist ein geheimnisvolles Tronie, das den Betrachter mit seinem intensiven Blick fesselt. Die leuchtende Perle und der blaue Turban heben sich dramatisch vom dunklen Hintergrund ab.',
        ai_description_en: 'Vermeer\'s "Girl with a Pearl Earring" is a mysterious tronie that captivates viewers with its intense gaze. The luminous pearl and blue turban stand out dramatically against the dark background.'
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE QUOTES (Inspirational, Public Domain)
// ═══════════════════════════════════════════════════════════════════════════

const quotes = [
    {
        text: 'The only way to do great work is to love what you do.',
        author: 'Steve Jobs',
        source_api: 'manual',
        ai_description_de: 'Steve Jobs\' Philosophie über Leidenschaft bei der Arbeit. Der Apple-Gründer glaubte, dass wahre Exzellenz nur durch echte Begeisterung für die eigene Tätigkeit erreicht werden kann.',
        ai_description_en: 'Steve Jobs\' philosophy on passion at work. The Apple founder believed that true excellence can only be achieved through genuine enthusiasm for one\'s work.'
    },
    {
        text: 'In the middle of difficulty lies opportunity.',
        author: 'Albert Einstein',
        source_api: 'manual',
        ai_description_de: 'Einstein erinnert uns daran, dass Herausforderungen oft verborgene Chancen bergen. Seine wissenschaftlichen Durchbrüche kamen oft aus der Konfrontation mit scheinbar unlösbaren Problemen.',
        ai_description_en: 'Einstein reminds us that challenges often harbor hidden opportunities. His scientific breakthroughs often came from confronting seemingly unsolvable problems.'
    },
    {
        text: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt',
        source_api: 'manual',
        ai_description_de: 'Eleanor Roosevelt, eine der einflussreichsten First Ladies der USA, ermutigte Menschen, an ihre Träume zu glauben und für eine bessere Zukunft zu kämpfen.',
        ai_description_en: 'Eleanor Roosevelt, one of the most influential First Ladies of the USA, encouraged people to believe in their dreams and fight for a better future.'
    },
    {
        text: 'It is during our darkest moments that we must focus to see the light.',
        author: 'Aristotle',
        source_api: 'manual',
        ai_description_de: 'Der griechische Philosoph Aristoteles lehrte, dass gerade in schwierigen Zeiten innere Stärke und Hoffnung am wichtigsten sind.',
        ai_description_en: 'The Greek philosopher Aristotle taught that inner strength and hope are most important precisely in difficult times.'
    },
    {
        text: 'The only impossible journey is the one you never begin.',
        author: 'Tony Robbins',
        source_api: 'manual',
        ai_description_de: 'Tony Robbins motiviert Menschen weltweit, den ersten Schritt zu wagen. Denn jede große Reise beginnt mit der Entscheidung, aufzubrechen.',
        ai_description_en: 'Tony Robbins motivates people worldwide to take the first step. Because every great journey begins with the decision to set out.'
    },
    {
        text: 'Everything you can imagine is real.',
        author: 'Pablo Picasso',
        source_api: 'manual',
        ai_description_de: 'Picasso glaubte an die unbegrenzte Kraft der Imagination. Für ihn war die Vorstellungskraft der erste Schritt zur Verwirklichung jeder kreativen Vision.',
        ai_description_en: 'Picasso believed in the unlimited power of imagination. For him, imagination was the first step toward realizing any creative vision.'
    },
    {
        text: 'Simplicity is the ultimate sophistication.',
        author: 'Leonardo da Vinci',
        source_api: 'manual',
        ai_description_de: 'Das Renaissance-Genie Leonardo da Vinci erkannte, dass wahre Meisterschaft in der Fähigkeit liegt, Komplexes einfach zu machen.',
        ai_description_en: 'Renaissance genius Leonardo da Vinci recognized that true mastery lies in the ability to make the complex simple.'
    },
    {
        text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
        author: 'Chinese Proverb',
        source_api: 'manual',
        ai_description_de: 'Dieses chinesische Sprichwort ermutigt uns, nicht über verpasste Gelegenheiten zu trauern, sondern heute mit dem Handeln zu beginnen.',
        ai_description_en: 'This Chinese proverb encourages us not to mourn missed opportunities but to start acting today.'
    },
    {
        text: 'Be the change you wish to see in the world.',
        author: 'Mahatma Gandhi',
        source_api: 'manual',
        ai_description_de: 'Gandhis zeitlose Weisheit erinnert uns daran, dass Veränderung bei uns selbst beginnt. Nur wer selbst vorlebt, was er sich wünscht, kann andere inspirieren.',
        ai_description_en: 'Gandhi\'s timeless wisdom reminds us that change begins with ourselves. Only those who embody what they wish for can inspire others.'
    },
    {
        text: 'The mind is everything. What you think you become.',
        author: 'Buddha',
        source_api: 'manual',
        ai_description_de: 'Buddha lehrte, dass unsere Gedanken unsere Realität formen. Diese Erkenntnis ist der Grundstein für Achtsamkeit und persönliches Wachstum.',
        ai_description_en: 'Buddha taught that our thoughts shape our reality. This insight is the foundation for mindfulness and personal growth.'
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function bulkLoad() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📦 CURIO - BULK LOAD INITIAL CONTENT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Load Artworks
    console.log('🎨 Loading artworks...');
    let artSuccess = 0;
    let artFailed = 0;

    for (const artwork of artworks) {
        const { data, error } = await supabase
            .from('artworks')
            .upsert(artwork, { onConflict: 'external_id' })
            .select();

        if (error) {
            console.log(`   ❌ Failed: ${artwork.title} - ${error.message}`);
            artFailed++;
        } else {
            console.log(`   ✅ Loaded: ${artwork.title}`);
            artSuccess++;
        }
    }

    console.log('');
    console.log(`   📊 Artworks: ${artSuccess} loaded, ${artFailed} failed`);
    console.log('');

    // Load Quotes
    console.log('📜 Loading quotes...');
    let quoteSuccess = 0;
    let quoteFailed = 0;

    for (const quote of quotes) {
        const { data, error } = await supabase
            .from('quotes')
            .insert(quote)
            .select();

        if (error) {
            console.log(`   ❌ Failed: "${quote.text.substring(0, 40)}..." - ${error.message}`);
            quoteFailed++;
        } else {
            console.log(`   ✅ Loaded: "${quote.text.substring(0, 40)}..."`);
            quoteSuccess++;
        }
    }

    console.log('');
    console.log(`   📊 Quotes: ${quoteSuccess} loaded, ${quoteFailed} failed`);
    console.log('');

    // Verify
    const { count: artCount } = await supabase.from('artworks').select('*', { count: 'exact', head: true });
    const { count: quoteCount } = await supabase.from('quotes').select('*', { count: 'exact', head: true });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ BULK LOAD COMPLETE');
    console.log(`   🎨 Total artworks in DB: ${artCount}`);
    console.log(`   📜 Total quotes in DB: ${quoteCount}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('💡 Restart your backend to generate today\'s daily content!');
}

// Run
bulkLoad().catch(console.error);