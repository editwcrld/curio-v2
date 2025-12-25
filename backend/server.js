const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dummy-Daten - Gleiche wie in frontend/js/dummy-data.js
const DUMMY_ART = [
    {
        id: "art_1",
        title: "Sternennacht",
        artist: "Vincent van Gogh",
        year: 1889,
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
        description: "Die Sternennacht ist eines der bekanntesten Werke von Vincent van Gogh. Es zeigt die Aussicht aus seinem Fenster im Sanatorium von Saint-Rémy-de-Provence kurz vor Sonnenaufgang. Der wirbelnde Himmel und die leuchtenden Sterne spiegeln van Goghs einzigartige Perspektive und emotionale Intensität wider."
    },
    {
        id: "art_2",
        title: "Die große Welle vor Kanagawa",
        artist: "Katsushika Hokusai",
        year: 1831,
        imageUrl: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800&q=80",
        description: "Dieses ikonische japanische Holzschnittwerk zeigt eine riesige Welle, die drei Fischerboote vor der Küste Kanagawas bedroht. Im Hintergrund ist der Berg Fuji zu sehen. Das Werk ist Teil der Serie '36 Ansichten des Berges Fuji' und gilt als eines der bekanntesten Kunstwerke Japans."
    },
    {
        id: "art_3",
        title: "Mona Lisa",
        artist: "Leonardo da Vinci",
        year: 1503,
        imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80",
        description: "Die Mona Lisa ist eines der berühmtesten Gemälde der Welt. Das Porträt zeigt Lisa Gherardini mit ihrem rätselhaften Lächeln. Da Vincis Meisterwerk zeichnet sich durch die innovative Sfumato-Technik aus, bei der Farben und Töne sanft ineinander übergehen."
    },
    {
        id: "art_4",
        title: "Der Schrei",
        artist: "Edvard Munch",
        year: 1893,
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
        description: "Der Schrei ist ein ikonisches Werk des Expressionismus. Es zeigt eine Person, die vor Angst schreit, während der Himmel in leuchtenden Orange- und Rottönen brennt. Das Gemälde ist ein kraftvoller Ausdruck von Angst und existenzieller Verzweiflung."
    },
    {
        id: "art_5",
        title: "Die Geburt der Venus",
        artist: "Sandro Botticelli",
        year: 1486,
        imageUrl: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80",
        description: "Die Geburt der Venus ist eines der berühmtesten Gemälde der Renaissance. Es zeigt die Göttin Venus, wie sie auf einer Muschel aus dem Meer geboren wird. Das Werk verkörpert die Ideale der Renaissance-Schönheit und harmonische Proportionen."
    },
    {
        id: "art_6",
        title: "Guernica",
        artist: "Pablo Picasso",
        year: 1937,
        imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
        description: "Guernica ist Picassos monumentales Anti-Kriegs-Gemälde. Es wurde als Reaktion auf die Bombardierung der baskischen Stadt Guernica geschaffen. Das Werk zeigt das Leiden und Chaos des Krieges in kubistischer Form und ist ein kraftvolles politisches Statement."
    }
];

const DUMMY_QUOTES = [
    {
        id: "quote_1",
        text: "In der Mitte von Schwierigkeiten liegen die Möglichkeiten.",
        author: "Albert Einstein",
        source: "Brief an einen Freund, 1940er",
        backgroundInfo: "Albert Einstein (1879-1955) war ein theoretischer Physiker, der die Relativitätstheorie entwickelte. Dieses Zitat spiegelt seine optimistische Weltanschauung wider und seine Überzeugung, dass Herausforderungen Chancen für Wachstum und Innovation bieten. Einstein selbst musste viele Schwierigkeiten überwinden, einschließlich seiner Flucht vor dem Nazi-Regime."
    },
    {
        id: "quote_2",
        text: "Die einzige Art, großartige Arbeit zu leisten, ist zu lieben, was man tut.",
        author: "Steve Jobs",
        source: "Stanford Commencement Speech, 2005",
        backgroundInfo: "Steve Jobs (1955-2011) war Mitbegründer von Apple Inc. und eine Schlüsselfigur in der Computerrevolution. In seiner berühmten Rede vor Absolventen der Stanford University teilte er persönliche Geschichten über seinen Lebensweg und betonte die Bedeutung, seiner Leidenschaft zu folgen, auch wenn der Weg steinig erscheint."
    },
    {
        id: "quote_3",
        text: "Sei du selbst die Veränderung, die du dir wünschst für diese Welt.",
        author: "Mahatma Gandhi",
        source: "Zugeschrieben, genaue Quelle unbekannt",
        backgroundInfo: "Mahatma Gandhi (1869-1948) war ein indischer Rechtsanwalt, Politiker und spiritueller Führer, der die indische Unabhängigkeitsbewegung durch gewaltfreien Widerstand anführte. Obwohl die genaue Quelle dieses Zitats umstritten ist, verkörpert es perfekt Gandhis Philosophie, dass persönliche Transformation der Ausgangspunkt für gesellschaftlichen Wandel ist."
    },
    {
        id: "quote_4",
        text: "Das Geheimnis des Glücks liegt nicht im Besitz, sondern im Geben.",
        author: "André Gide",
        source: "Die Früchte der Erde, 1897",
        backgroundInfo: "André Gide (1869-1951) war ein französischer Schriftsteller und Nobelpreisträger. Seine Werke erforschen moralische und psychologische Fragen. Dieses Zitat reflektiert seine Philosophie, dass wahre Erfüllung nicht aus materiellem Besitz, sondern aus Großzügigkeit und dem Teilen mit anderen kommt."
    },
    {
        id: "quote_5",
        text: "Phantasie ist wichtiger als Wissen, denn Wissen ist begrenzt.",
        author: "Albert Einstein",
        source: "Interview mit George Sylvester Viereck, 1929",
        backgroundInfo: "In diesem Interview betonte Einstein die Bedeutung der Vorstellungskraft für wissenschaftlichen Fortschritt. Er glaubte, dass kreatives Denken und Intuition oft wichtiger sind als reines faktisches Wissen, da sie uns erlauben, über das Bekannte hinauszudenken und neue Möglichkeiten zu entdecken."
    },
    {
        id: "quote_6",
        text: "Der Weg ist das Ziel.",
        author: "Konfuzius",
        source: "Analekten, ca. 500 v. Chr.",
        backgroundInfo: "Konfuzius (551-479 v. Chr.) war ein chinesischer Philosoph, dessen Lehren die ostasiatische Kultur tief geprägt haben. Dieses Zitat unterstreicht die Bedeutung des Prozesses und der persönlichen Entwicklung während einer Reise, nicht nur des Endresultats. Es ermutigt uns, jeden Schritt unseres Weges wertzuschätzen."
    }
];

// Index tracking für sequenzielle Navigation
let currentArtIndex = 0;
let currentQuoteIndex = 0;

// Helper: Random item
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// API Endpunkte
app.get('/api/daily/art', (req, res) => {
    // Option 1: Immer das gleiche "daily" Art (erster Index)
    // res.json(DUMMY_ART[0]);
    
    // Option 2: Zufälliges Art bei jedem Request
    res.json(getRandomItem(DUMMY_ART));
    
    console.log(`📤 Sent art: ${DUMMY_ART[currentArtIndex].title}`);
});

app.get('/api/daily/quote', (req, res) => {
    // Option 1: Immer das gleiche "daily" Quote (erster Index)
    // res.json(DUMMY_QUOTES[0]);
    
    // Option 2: Zufälliges Quote bei jedem Request
    res.json(getRandomItem(DUMMY_QUOTES));
    
    console.log(`📤 Sent quote: ${DUMMY_QUOTES[currentQuoteIndex].author}`);
});

// Optional: Endpoint um nächstes Art zu bekommen
app.get('/api/art/next', (req, res) => {
    currentArtIndex = (currentArtIndex + 1) % DUMMY_ART.length;
    const art = DUMMY_ART[currentArtIndex];
    console.log(`📤 Next art (${currentArtIndex + 1}/${DUMMY_ART.length}): ${art.title}`);
    res.json(art);
});

// Optional: Endpoint um vorheriges Art zu bekommen
app.get('/api/art/previous', (req, res) => {
    currentArtIndex = (currentArtIndex - 1 + DUMMY_ART.length) % DUMMY_ART.length;
    const art = DUMMY_ART[currentArtIndex];
    console.log(`📤 Previous art (${currentArtIndex + 1}/${DUMMY_ART.length}): ${art.title}`);
    res.json(art);
});

// Optional: Endpoint um nächstes Quote zu bekommen
app.get('/api/quote/next', (req, res) => {
    currentQuoteIndex = (currentQuoteIndex + 1) % DUMMY_QUOTES.length;
    const quote = DUMMY_QUOTES[currentQuoteIndex];
    console.log(`📤 Next quote (${currentQuoteIndex + 1}/${DUMMY_QUOTES.length}): ${quote.author}`);
    res.json(quote);
});

// Optional: Endpoint um vorheriges Quote zu bekommen
app.get('/api/quote/previous', (req, res) => {
    currentQuoteIndex = (currentQuoteIndex - 1 + DUMMY_QUOTES.length) % DUMMY_QUOTES.length;
    const quote = DUMMY_QUOTES[currentQuoteIndex];
    console.log(`📤 Previous quote (${currentQuoteIndex + 1}/${DUMMY_QUOTES.length}): ${quote.author}`);
    res.json(quote);
});

app.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
    console.log(`📊 ${DUMMY_ART.length} Kunstwerke & ${DUMMY_QUOTES.length} Zitate verfügbar`);
    console.log('');
    console.log('Endpoints:');
    console.log('  GET /api/daily/art');
    console.log('  GET /api/daily/quote');
    console.log('  GET /api/art/next');
    console.log('  GET /api/art/previous');
    console.log('  GET /api/quote/next');
    console.log('  GET /api/quote/previous');
});