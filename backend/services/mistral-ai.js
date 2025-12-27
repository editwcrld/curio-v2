/**
 * CURIO BACKEND - Mistral AI Service
 * Generates descriptions in German AND English
 */

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

// Fallbacks
const FALLBACK_QUOTE_DE = 'Dieses Zitat lädt zum Nachdenken ein und bietet eine zeitlose Weisheit.';
const FALLBACK_QUOTE_EN = 'This quote invites reflection and offers timeless wisdom.';
const FALLBACK_ART_DE = 'Dieses Kunstwerk zeigt die meisterhafte Technik seines Schöpfers.';
const FALLBACK_ART_EN = 'This artwork demonstrates the masterful technique of its creator.';

async function callMistral(prompt, maxTokens = 500) {
    const apiKey = process.env.MISTRAL_API_KEY;
    
    if (!apiKey) {
        console.warn('⚠️ MISTRAL_API_KEY not set - using fallback');
        return null;
    }
    
    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MISTRAL_MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            console.error('❌ Mistral API error:', response.status);
            return null;
        }
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.error('❌ Mistral API failed:', error.message);
        return null;
    }
}

async function generateQuoteDescription(quote) {
    const { text, author } = quote;
    
    console.log(`🤖 Generating AI for quote by ${author}...`);
    
    const promptDE = `Schreibe einen kurzen informativen Text (150-200 Wörter) über dieses Zitat und seinen Autor:
"${text}" - ${author}
Wer war der Autor? Was bedeutet das Zitat? Nur Fließtext, keine Listen.`;

    const promptEN = `Write a brief informative text (150-200 words) about this quote and its author:
"${text}" - ${author}
Who was the author? What does the quote mean? Just prose, no lists.`;

    const [descDE, descEN] = await Promise.all([
        callMistral(promptDE, 300),
        callMistral(promptEN, 300)
    ]);
    
    return {
        de: descDE || FALLBACK_QUOTE_DE,
        en: descEN || FALLBACK_QUOTE_EN
    };
}

async function generateArtDescription(artwork) {
    const { title, artist, year } = artwork;
    
    console.log(`🤖 Generating AI for "${title}"...`);
    
    const promptDE = `Schreibe einen informativen Text (200-300 Wörter) über dieses Kunstwerk:
"${title}" von ${artist} (${year || 'unbekannt'})
Wer war der Künstler? Was macht das Werk besonders? Nur Fließtext.`;

    const promptEN = `Write an informative text (200-300 words) about this artwork:
"${title}" by ${artist} (${year || 'unknown'})
Who was the artist? What makes this work special? Just prose.`;

    const [descDE, descEN] = await Promise.all([
        callMistral(promptDE, 400),
        callMistral(promptEN, 400)
    ]);
    
    return {
        de: descDE || FALLBACK_ART_DE,
        en: descEN || FALLBACK_ART_EN
    };
}

module.exports = {
    generateQuoteDescription,
    generateArtDescription,
    callMistral,
    FALLBACK_QUOTE_DE,
    FALLBACK_QUOTE_EN,
    FALLBACK_ART_DE,
    FALLBACK_ART_EN
};