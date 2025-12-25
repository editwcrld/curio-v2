// API Configuration
export const API_BASE_URL = 'http://localhost:3000/api';

// Gradient presets for quotes
export const GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
];

// Get random gradient
export function getRandomGradient() {
    return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
}