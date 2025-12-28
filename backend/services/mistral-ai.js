/**
 * CURIO BACKEND - Mistral AI Service
 * Generates descriptions in German AND English
 * ✅ Kein Markdown im Output!
 * ✅ Strukturierte Absätze mit Leerzeilen
 */

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

// Fallbacks
const FALLBACK_QUOTE_DE = 'Dieses Zitat lädt zum Nachdenken ein und bietet eine zeitlose Weisheit.';
const FALLBACK_QUOTE_EN = 'This quote invites reflection and offers timeless wisdom.';
const FALLBACK_ART_DE = 'Dieses Kunstwerk zeigt die meisterhafte Technik seines Schöpfers.';
const FALLBACK_ART_EN = 'This artwork demonstrates the masterful technique of its creator.';

/**
 * Remove markdown formatting from AI output
 */
function cleanMarkdown(text) {
    if (!text) return text;
    
    return text
        // Remove bold **text**
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        // Remove italic *text*
        .replace(/\*([^*]+)\*/g, '$1')
        // Remove headers # ## ###
        .replace(/^#{1,3}\s+/gm, '')
        // Remove bullet points
        .replace(/^[-*]\s+/gm, '')
        // Remove numbered lists
        .replace(/^\d+\.\s+/gm, '')
        // Clean up extra whitespace (but keep double newlines for paragraphs)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

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
        const content = data.choices?.[0]?.message?.content?.trim() || null;
        
        // Clean markdown from output
        return cleanMarkdown(content);
    } catch (error) {
        console.error('❌ Mistral API failed:', error.message);
        return null;
    }
}

async function generateQuoteDescription(quote) {
    const { text, author } = quote;
    
    console.log(`🤖 Generating AI for quote by ${author}...`);
    
    const promptDE = `Schreibe einen kurzen, prägnanten Hintergrundtext zum Zitat:
"${text}" - ${author}

WICHTIG - Struktur:
- 1-2 kurze Absätze, getrennt durch Leerzeile
- Falls relevant: historischer Kontext, Entstehung, kulturelle Bedeutung
- Bezug zum Autor nur wenn es das Zitat bereichert, falls unbekannt nur interpretieren

STIL:
- Kompakt und pointiert (30-65 Wörter)
- Keine Wiederholung des Zitats
- Keine generischen Einleitungen wie "Dieses Zitat zeigt..."
- Keine Hinweise auf Zuordnung wie "Dieses wird oft zugeschrieben aber keine Belege...", nur am Ende ganz prägnant ob es belegt ist oder nicht als letzten Absatz
- Nur schreiben wenn es etwas Interessantes zu sagen gibt

Falls keine bedeutsame Geschichte bekannt ist, schreibe nur 1-2 Sätze zur Kernaussage.

WICHTIG: Schreibe NUR Fließtext ohne Formatierung wie ** oder #. Trenne Absätze mit einer Leerzeile.`;

    const promptEN = `Write a short, concise background text for the quote:
"${text}" - ${author}

IMPORTANT - Structure:
- 1-2 short paragraphs, separated by blank line
- If relevant: historical context, origin, cultural significance
- Reference to author only if it enriches the quote, if unknown just interpret

STYLE:
- Compact and to the point (30-65 words)
- No repetition of the quote itself
- No generic introductions like "This quote shows..."
- No hints about attribution like "This is often attributed but no evidence...", only at the end very concisely whether it is documented or not as last paragraph
- Only write if there's something interesting to say

If no significant story is known, write only 1-2 sentences about the core message.

IMPORTANT: Write ONLY prose without formatting like ** or #. Separate paragraphs with a blank line.`;

    const [descDE, descEN] = await Promise.all([
        callMistral(promptDE, 200),
        callMistral(promptEN, 200)
    ]);
    
    return {
        de: descDE || FALLBACK_QUOTE_DE,
        en: descEN || FALLBACK_QUOTE_EN
    };
}

async function generateArtDescription(artwork) {
    const { title, artist, year } = artwork;
    
    console.log(`🤖 Generating AI for "${title}"...`);
    
    const promptDE = `Schreibe einen informativen Text über das Kunstwerk "${title}" von ${artist} (${year || 'unbekannt'}).

WICHTIG - Struktur mit Absätzen:
- Absatz 1: Bedeutung und Wirkung - Welchen Einfluss hatte das Werk? Wie wurde es rezipiert?
- Absatz 2: Entstehungsgeschichte des Werks - Was hat den Künstler inspiriert? Welcher Kontext?
- Absatz 3: Kurze Einordnung des Künstlers (Nationalität, Lebensdaten, Stilrichtung)

STIL:
- Sachlich aber lebendig, wie ein Museumstext
- Konkrete Details und Anekdoten wenn bekannt
- Keine generischen Floskeln wie "dieses Meisterwerk zeigt..."
- Länge je nach verfügbarer Geschichte: 80-180 Wörter

WICHTIG: Schreibe NUR Fließtext ohne Formatierung wie ** oder #. Trenne die Absätze mit einer Leerzeile.`;

    const promptEN = `Write an informative text about the artwork "${title}" by ${artist} (${year || 'unknown'}).

IMPORTANT - Structure with paragraphs:
- Paragraph 1: Significance and impact - What influence did the work have? How was it received?
- Paragraph 2: Creation story - What inspired the artist? What was the context?
- Paragraph 3: Brief context about the artist (nationality, life dates, artistic movement)

STYLE:
- Factual yet engaging, like a museum text
- Specific details and anecdotes when known
- No generic phrases like "this masterpiece shows..."
- Length depending on available history: 80-180 words

IMPORTANT: Write ONLY prose without formatting like ** or #. Separate paragraphs with a blank line.`;

    const [descDE, descEN] = await Promise.all([
        callMistral(promptDE, 350),
        callMistral(promptEN, 350)
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
    cleanMarkdown,
    FALLBACK_QUOTE_DE,
    FALLBACK_QUOTE_EN,
    FALLBACK_ART_DE,
    FALLBACK_ART_EN
};