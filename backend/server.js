const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dummy-Daten (Diese werden in Punkt 6 & 7 durch Supabase & KI ersetzt)
const dailyArt = {
    id: "art_001",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1000",
    title: "Die Sternennacht",
    artist: "Vincent van Gogh",
    year: "1889",
    description: "Diese Interpretation zeigt Van Goghs visionäre Kraft. Die wirbelnden Sterne sind ein Symbol für seine emotionale Tiefe und seine Sicht auf das Universum."
};

const dailyQuote = {
    id: "quote_001",
    text: "Phantasie ist wichtiger als Wissen.",
    author: "Albert Einstein",
    source: "Interview, 1929",
    backgroundInfo: "Einstein betonte stets, dass logisches Denken uns von A nach B bringt, aber Vorstellungskraft überall hin. Dieses Zitat ist eine Mahnung, die Intuition nicht zu vergessen."
};

// API Endpunkte
app.get('/api/daily/art', (req, res) => res.json(dailyArt));
app.get('/api/daily/quote', (req, res) => res.json(dailyQuote));

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});