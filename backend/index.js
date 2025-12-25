// ================================================
// BACKEND - CHUNK 1 MINIMAL
// Nur /get-daily-art Endpoint
// ================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'curioFood Backend - Chunk 1',
        endpoints: ['/get-daily-art']
    });
});

// Get Daily Art Endpoint
app.get('/get-daily-art', async (req, res) => {
    try {
        // TEMPORÄR: Mock-Daten für Testing
        // In Chunk 2 wird das mit echter Supabase-Anbindung ersetzt
        const mockArt = {
            id: '1',
            title: 'The Starry Night',
            artist: 'Vincent van Gogh',
            year: '1889',
            image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1200px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
            description: 'The Starry Night is an oil-on-canvas painting by Dutch Post-Impressionist painter Vincent van Gogh. Painted in June 1889, it depicts the view from the east-facing window of his asylum room at Saint-Rémy-de-Provence, just before sunrise, with the addition of an imaginary village.'
        };
        
        res.json(mockArt);
        
    } catch (error) {
        console.error('Error in /get-daily-art:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`📡 CORS enabled for all origins`);
});