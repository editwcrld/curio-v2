/**
 * Dummy Data für Development & Testing
 * Verwende diese Daten wenn die API nicht verfügbar ist
 */

export const DUMMY_ART = [
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
    }
];

export const DUMMY_QUOTES = [
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
    }
];

/**
 * Gibt ein zufälliges Art-Objekt zurück
 */
export function getRandomArt() {
    return DUMMY_ART[Math.floor(Math.random() * DUMMY_ART.length)];
}

/**
 * Gibt ein zufälliges Quote-Objekt zurück
 */
export function getRandomQuote() {
    return DUMMY_QUOTES[Math.floor(Math.random() * DUMMY_QUOTES.length)];
}