// API Configuration
// PRODUCTION: Change to your Render.com backend URL
const IS_PRODUCTION = window.location.hostname !== 'localhost' && 
                       !window.location.hostname.includes('127.0.0.1');

export const API_BASE_URL = IS_PRODUCTION 
    ? 'https://curio-v2.onrender.com/api'  // Production Backend
    : 'http://localhost:3000/api';          // Local Development

// Debug log (remove in final production)
console.log(`🌐 API Mode: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`🔗 API URL: ${API_BASE_URL}`);

// Gradient presets for quotes - ERWEITERT (20 verschiedene!)
export const GRADIENTS = [
    // Blues & Purples
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #5B86E5 0%, #36D1DC 100%)',
    'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
    'linear-gradient(135deg, #7F7FD5 0%, #86A8E7 50%, #91EAE4 100%)',
    
    // Greens & Teals
    'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
    'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
    
    // Pinks & Reds
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #ff6a88 0%, #ff99ac 100%)',
    'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
    'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
    
    // Cyans & Blues
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #0052D4 0%, #65C7F7 50%, #9CECFB 100%)',
    'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    
    // Oranges & Yellows
    'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
    'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)',
    'linear-gradient(135deg, #c31432 0%, #240b36 100%)'
];

// Track last used gradient to avoid repeats
let lastGradientIndex = -1;

// Get random gradient (never repeats same twice!)
export function getRandomGradient() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * GRADIENTS.length);
    } while (newIndex === lastGradientIndex && GRADIENTS.length > 1);
    
    lastGradientIndex = newIndex;
    return GRADIENTS[newIndex];
}